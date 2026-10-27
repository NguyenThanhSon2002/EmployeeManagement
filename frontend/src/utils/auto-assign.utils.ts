import { addDays, format, getISODay, parseISO } from 'date-fns';
import type {
    CompanyHoliday,
    DemoSettings,
    Employee,
    LeaveRequest,
    ScheduleConflict,
    ShiftAssignment,
    ShiftTemplate,
} from '@/types/domain.types';
import { calculateShiftDurations } from './schedule-calc.utils';
import { getShiftAbsoluteTimeRange, validateAllShiftConflicts } from './conflict-detector.utils';

export type AutoAssignTier = 1 | 2 | 3;

export interface AutoAssignInput {
    fromDate: string; // YYYY-MM-DD
    toDate: string; // YYYY-MM-DD
    /** Nhân sự của chi nhánh đang chọn (không áp bộ lọc tìm kiếm) */
    employees: Employee[];
    shiftTemplates: ShiftTemplate[];
    existingAssignments: ShiftAssignment[];
    approvedLeaves: LeaveRequest[];
    holidays: CompanyHoliday[];
    settings: DemoSettings;
    scheduleId: number;
    /** Nguồn dữ liệu khả dụng. useAvailabilityStore.getState().isAvailable */
    isAvailable: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => boolean;
    /** Kiểm tra nhân viên có ưu tiên ca này không. useAvailabilityStore.getState().isPreferredShift */
    isPreferred?: (employeeId: number, shiftTemplateId: number) => boolean;
    /** Mặc định 2 ca/ngày */
    maxShiftsPerDay?: number;
}

export interface ProposedAssignment {
    assignment: ShiftAssignment;
    employeeName: string;
    employeeCode: string;
    /** 1: xếp sạch, 2: có cảnh báo, 3: vượt giới hạn ca/ngày */
    tier: AutoAssignTier;
    warnings: ScheduleConflict[];
    notes: string[];
}

export interface UnfilledSlot {
    workDate: string;
    workShiftId: number;
    shiftName: string;
    missing: number;
    reason: string;
}

export interface EmployeeAutoSummary {
    employeeId: number;
    employeeName: string;
    addedShifts: number;
    addedHours: number;
    totalHours: number;
}

export interface AutoAssignResult {
    proposals: ProposedAssignment[];
    unfilled: UnfilledSlot[];
    summaries: EmployeeAutoSummary[];
}

interface Slot {
    date: string;
    isoDay: number;
    template: ShiftTemplate;
    need: number;
}

interface Candidate {
    employee: Employee;
    isPreferred: boolean;
    warnings: ScheduleConflict[];
    totalHours: number;
    sameDayCount: number;
}

interface PassConfig {
    tier: AutoAssignTier;
    maxPerDay: number | null;
    allowWarnings: boolean;
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

function isSchedulable(emp: Employee): boolean {
    return (
        emp.isActive &&
        emp.employmentStatus !== 'RESIGNED' &&
        emp.employmentStatus !== 'ON_LEAVE' &&
        emp.positionId !== 1
    );
}

function listDates(fromDate: string, toDate: string): string[] {
    const dates: string[] = [];
    let cursor = parseISO(fromDate);
    const end = parseISO(toDate);
    while (cursor <= end) {
        dates.push(format(cursor, 'yyyy-MM-dd'));
        cursor = addDays(cursor, 1);
    }
    return dates;
}

function parseApplicableDays(raw: string | undefined): number[] {
    if (!raw) return ALL_DAYS;
    const days = raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => n >= 1 && n <= 7);
    return days.length > 0 ? days : ALL_DAYS;
}

function hoursOf(a: ShiftAssignment): number {
    return calculateShiftDurations(
        a.snapshotStartTime,
        a.snapshotEndTime,
        a.snapshotBreakMinutes,
        a.snapshotCrossMidnight
    ).netHours;
}

/** Vi phạm bắt buộc: không bao giờ được bỏ qua (kể cả ở lượt 3) */
function isHardBlock(c: ScheduleConflict): boolean {
    return c.severity === 'MANDATORY' || c.ruleCode === 'BR-003' || c.ruleCode === 'BR-001';
}

function buildAssignment(
    template: ShiftTemplate,
    employeeId: number,
    workDate: string,
    scheduleId: number,
    id: number
): ShiftAssignment {
    const { startMs, endMs } = getShiftAbsoluteTimeRange(
        workDate,
        template.startTime,
        template.endTime,
        template.isCrossMidnight
    );
    return {
        id,
        scheduleId,
        employeeId,
        workShiftId: template.id,
        workDate,
        snapshotShiftName: template.shiftName,
        snapshotStartTime: template.startTime,
        snapshotEndTime: template.endTime,
        snapshotBreakMinutes: template.breakMinutes,
        snapshotCrossMidnight: template.isCrossMidnight,
        snapshotColorCode: template.colorCode,
        plannedStartTime: new Date(startMs).toISOString(),
        plannedEndTime: new Date(endMs).toISOString(),
        status: 'ASSIGNED',
        overrideRule: null,
        overrideReason: null,
        version: 1,
    };
}

export function autoAssignShifts(input: AutoAssignInput): AutoAssignResult {
    const maxPerDay = input.maxShiftsPerDay ?? 2;
    const branchEmpIds = new Set(input.employees.map((e) => e.id));
    const schedulable = input.employees.filter(isSchedulable);
    const templates = input.shiftTemplates.filter((t) => t.isActive);
    const dates = listDates(input.fromDate, input.toDate);

    // ---- 1. Trạng thái mô phỏng: ca hiện có của từng nhân viên + tổng giờ trong kỳ ----
    const existing = input.existingAssignments.filter(
        (a) => a.status !== 'CANCELLED' && branchEmpIds.has(a.employeeId)
    );
    const byEmployee = new Map<number, ShiftAssignment[]>();
    const hoursInRange = new Map<number, number>();
    for (const a of existing) {
        const list = byEmployee.get(a.employeeId) ?? [];
        list.push(a);
        byEmployee.set(a.employeeId, list);
        if (a.workDate >= input.fromDate && a.workDate <= input.toDate) {
            hoursInRange.set(a.employeeId, (hoursInRange.get(a.employeeId) ?? 0) + hoursOf(a));
        }
    }

    // ---- 2. Các ô (ngày x ca) còn thiếu người so với định biên tối thiểu ----
    const slots: Slot[] = [];
    for (const date of dates) {
        const isoDay = getISODay(parseISO(date)); // 1 = Thứ Hai ... 7 = Chủ Nhật
        for (const template of templates) {
            if (!parseApplicableDays(template.applicableDays).includes(isoDay)) continue;
            const filled = existing.filter(
                (a) => a.workDate === date && a.workShiftId === template.id
            ).length;
            const capacity = Math.max(0, template.maxStaffing - filled);
            const need = Math.min(Math.max(0, template.minStaffing - filled), capacity);
            if (need > 0) slots.push({ date, isoDay, template, need });
        }
    }
    slots.sort(
        (a, b) =>
            a.date.localeCompare(b.date) || a.template.startTime.localeCompare(b.template.startTime)
    );

    // ---- 3. Kiểm tra xung đột bằng đúng bộ luật đang dùng trên lưới ----
    const checkConflicts = (
        emp: Employee,
        template: ShiftTemplate,
        date: string
    ): ScheduleConflict[] => {
        const { startMs, endMs } = getShiftAbsoluteTimeRange(
            date,
            template.startTime,
            template.endTime,
            template.isCrossMidnight
        );
        const { netHours } = calculateShiftDurations(
            template.startTime,
            template.endTime,
            template.breakMinutes,
            template.isCrossMidnight
        );
        return validateAllShiftConflicts({
            employee: emp,
            newShiftRange: {
                workDate: date,
                startTime: template.startTime,
                endTime: template.endTime,
                isCrossMidnight: template.isCrossMidnight,
                startMs,
                endMs,
            },
            newShiftNetHours: netHours,
            existingShifts: byEmployee.get(emp.id) ?? [],
            employeeLeaves: input.approvedLeaves.filter((l) => l.employeeId === emp.id),
            holidays: input.holidays,
            settings: input.settings,
        });
    };

    const findCandidates = (slot: Slot, cfg: PassConfig): Candidate[] => {
        const result: Candidate[] = [];
        for (const emp of schedulable) {
            // RÀNG BUỘC CỨNG: Không đăng ký ca này vào thứ này -> Bỏ qua lập tức
            if (!input.isAvailable(emp.id, slot.isoDay, slot.template.id)) continue;

            const list = byEmployee.get(emp.id) ?? [];
            const sameDayShifts = list.filter((a) => a.workDate === slot.date);
            const sameDayCount = sameDayShifts.length;

            // Không gán trùng cùng 1 ca vào cùng 1 ngày
            if (sameDayShifts.some((a) => a.workShiftId === slot.template.id)) continue;

            if (cfg.maxPerDay !== null && sameDayCount >= cfg.maxPerDay) continue;

            const conflicts = checkConflicts(emp, slot.template, slot.date);
            if (conflicts.some(isHardBlock)) continue;
            if (!cfg.allowWarnings && conflicts.length > 0) continue;

            const isPreferred = input.isPreferred ? input.isPreferred(emp.id, slot.template.id) : false;

            result.push({
                employee: emp,
                isPreferred,
                warnings: conflicts,
                totalHours: hoursInRange.get(emp.id) ?? 0,
                sameDayCount,
            });
        }
        // Ưu tiên công bằng số giờ:
        // 1. Tránh cảnh báo nặng trước
        // 2. Chênh lệch giờ >= 2h -> Người ít giờ hơn ĐƯỢC ƯU TIÊN TUYỆT ĐỐI (đảm bảo quyền lợi/lương đều nhau)
        // 3. Nếu số giờ xấp xỉ nhau (< 2h) -> Ưu tiên ca ưa thích (isPreferred)
        // 4. Ít ca trong ngày hơn -> id
        result.sort((a, b) => {
            if (a.warnings.length !== b.warnings.length) {
                return a.warnings.length - b.warnings.length;
            }
            const hourDiff = a.totalHours - b.totalHours;
            if (Math.abs(hourDiff) >= 2) {
                return hourDiff;
            }
            if (a.isPreferred !== b.isPreferred) {
                return (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0);
            }
            if (a.sameDayCount !== b.sameDayCount) {
                return a.sameDayCount - b.sameDayCount;
            }
            return a.employee.id - b.employee.id;
        });
        return result;
    };

    // ---- 4. Chạy từng lượt: ô ít ứng viên nhất xếp trước ----
    const proposals: ProposedAssignment[] = [];
    const baseId = Date.now() * 1000;
    let seq = 0;

    const runPass = (cfg: PassConfig) => {
        for (;;) {
            let best: { slot: Slot; candidates: Candidate[] } | null = null;
            for (const slot of slots) {
                if (slot.need <= 0) continue;
                const candidates = findCandidates(slot, cfg);
                if (candidates.length === 0) continue;
                if (best === null || candidates.length < best.candidates.length) {
                    best = { slot, candidates };
                }
            }
            if (best === null) return;

            const { slot, candidates } = best;
            const pick = candidates[0];
            const assignment = buildAssignment(
                slot.template,
                pick.employee.id,
                slot.date,
                input.scheduleId,
                baseId + seq++
            );

            const list = byEmployee.get(pick.employee.id) ?? [];
            list.push(assignment);
            byEmployee.set(pick.employee.id, list);
            hoursInRange.set(pick.employee.id, pick.totalHours + hoursOf(assignment));
            slot.need -= 1;

            const notes: string[] = [];
            if (pick.sameDayCount >= 1) notes.push(`Ca thứ ${pick.sameDayCount + 1} trong ngày`);
            if (pick.sameDayCount >= maxPerDay) notes.push(`Vượt giới hạn ${maxPerDay} ca/ngày`);

            proposals.push({
                assignment,
                employeeName: pick.employee.fullName,
                employeeCode: pick.employee.employeeCode,
                tier: cfg.tier,
                warnings: pick.warnings,
                notes,
            });
        }
    };

    runPass({ tier: 1, maxPerDay, allowWarnings: false });
    runPass({ tier: 2, maxPerDay, allowWarnings: true });
    runPass({ tier: 3, maxPerDay: null, allowWarnings: true });

    // ---- 4.5. Thuật toán cân bằng lại giờ làm đa chiều (All-Pairs Equalization Rebalancer) ----
    // Duyệt qua tất cả các cặp nhân sự (Nhóm thừa giờ -> Nhóm thiếu giờ) để chuyển nhượng ca hợp lệ,
    // đảm bảo thu hẹp khoảng cách giờ làm về mức nhỏ nhất có thể mà không vi phạm quy tắc.
    const maxIterations = 50;
    for (let iter = 0; iter < maxIterations; iter++) {
        // Sắp xếp danh sách nhân sự theo giờ giảm dần
        const sorted = [...schedulable].sort(
            (a, b) => (hoursInRange.get(b.id) ?? 0) - (hoursInRange.get(a.id) ?? 0)
        );

        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        if (!highest || !lowest) break;

        const maxH = hoursInRange.get(highest.id) ?? 0;
        const minH = hoursInRange.get(lowest.id) ?? 0;

        // Nếu khoảng cách giữa người cao nhất và thấp nhất đã <= 3.5h -> Đã cân bằng tối ưu!
        if (maxH - minH <= 3.5) break;

        let anyTransferred = false;

        // Thử chuyển nhượng giữa các cặp: Người nhiều giờ (donor) -> Người ít giờ (receiver)
        outerLoop:
        for (let i = 0; i < sorted.length; i++) {
            const donor = sorted[i];
            const donorH = hoursInRange.get(donor.id) ?? 0;

            for (let j = sorted.length - 1; j > i; j--) {
                const receiver = sorted[j];
                const receiverH = hoursInRange.get(receiver.id) ?? 0;

                // Chỉ chuyển nếu donor hơn receiver ít nhất 3.5h
                if (donorH - receiverH <= 3.5) continue;

                const donorProposals = proposals.filter((p) => p.assignment.employeeId === donor.id);
                for (const p of donorProposals) {
                    const shiftH = hoursOf(p.assignment);
                    // Đảm bảo sau khi chuyển, receiver không bị vọt lên cao hơn donor quá 3.5h
                    if ((donorH - shiftH) < (receiverH + shiftH) - 3.5) continue;

                    const template = templates.find((t) => t.id === p.assignment.workShiftId);
                    if (!template) continue;

                    const isoDay = getISODay(parseISO(p.assignment.workDate));
                    if (!input.isAvailable(receiver.id, isoDay, template.id)) continue;

                    // Không trùng ca cùng ngày
                    const receiverSameDay = (byEmployee.get(receiver.id) ?? []).filter(
                        (a) => a.workDate === p.assignment.workDate
                    );
                    if (receiverSameDay.length > 0) continue;

                    // Kiểm tra không có xung đột nghiêm trọng
                    const conflicts = checkConflicts(receiver, template, p.assignment.workDate);
                    if (conflicts.some(isHardBlock)) continue;

                    // THỰC HIỆN CHUYỂN NHƯỢNG CA!
                    p.assignment.employeeId = receiver.id;
                    p.employeeName = receiver.fullName;
                    p.employeeCode = receiver.employeeCode;
                    p.warnings = conflicts;
                    p.tier = conflicts.length > 0 ? 2 : 1;

                    // Cập nhật danh sách ca của cả hai nhân viên
                    const donorList = (byEmployee.get(donor.id) ?? []).filter((a) => a.id !== p.assignment.id);
                    byEmployee.set(donor.id, donorList);

                    const receiverList = byEmployee.get(receiver.id) ?? [];
                    receiverList.push(p.assignment);
                    byEmployee.set(receiver.id, receiverList);

                    hoursInRange.set(donor.id, donorH - shiftH);
                    hoursInRange.set(receiver.id, receiverH + shiftH);

                    anyTransferred = true;
                    break outerLoop; // Đã chuyển được 1 ca, tính toán lại danh sách ở lượt sau
                }
            }
        }

        if (!anyTransferred) {
            // Đã duyệt toàn bộ các cặp và không còn ca nào hợp lệ để chuyển nhượng -> Dừng
            break;
        }
    }

    // ---- 5. Các ô vẫn chưa lấp được, kèm lý do ----
    const unfilled: UnfilledSlot[] = slots
        .filter((s) => s.need > 0)
        .map((s) => {
            const registered = schedulable.filter((e) =>
                input.isAvailable(e.id, s.isoDay, s.template.id)
            );
            return {
                workDate: s.date,
                workShiftId: s.template.id,
                shiftName: s.template.shiftName,
                missing: s.need,
                reason:
                    registered.length === 0
                        ? 'Chưa có nhân sự nào đăng ký ca này'
                        : `Có ${registered.length} nhân sự đăng ký nhưng bị chặn (trùng ca, nghỉ phép hoặc đã có ca khác)`,
            };
        });

    // ---- 6. Tóm tắt theo nhân viên để xem mức độ công bằng ----
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const summaries: EmployeeAutoSummary[] = schedulable.map((emp) => {
        const mine = proposals.filter((p) => p.assignment.employeeId === emp.id);
        return {
            employeeId: emp.id,
            employeeName: emp.fullName,
            addedShifts: mine.length,
            addedHours: round1(mine.reduce((sum, p) => sum + hoursOf(p.assignment), 0)),
            totalHours: round1(hoursInRange.get(emp.id) ?? 0),
        };
    });

    return { proposals, unfilled, summaries };
}

/**
 * Tìm ca tối ưu nhất để gỡ của nhân viên:
 * Ưu tiên 1: Ca có người khác trong chi nhánh có thể thay thế được trước (replacementCount cao nhất)
 * Ưu tiên 2: Ca có cảnh báo (tier > 1)
 * Ưu tiên 3: Ca ngày muộn nhất trong kỳ
 */
export function pickShiftToRemove(
    employeeId: number,
    proposals: ProposedAssignment[],
    employees: Employee[],
    isAvailable: (empId: number, dayOfWeek: number, shiftId: number) => boolean,
    existingAssignments: ShiftAssignment[]
): ProposedAssignment | null {
    const mine = proposals.filter((p) => p.assignment.employeeId === employeeId);
    if (mine.length === 0) return null;

    const branchEmpIds = new Set(employees.filter(isSchedulable).map((e) => e.id));

    const scored = mine.map((p) => {
        const isoDay = getISODay(parseISO(p.assignment.workDate));
        // Đếm xem có bao nhiêu nhân viên khác có thể nhận ca này
        const candidates = employees.filter((e) => {
            if (e.id === employeeId || !branchEmpIds.has(e.id)) return false;
            if (!isAvailable(e.id, isoDay, p.assignment.workShiftId)) return false;
            // Chưa có ca cùng ngày ở existing hoặc proposals
            const hasExisting = existingAssignments.some(
                (a) => a.employeeId === e.id && a.workDate === p.assignment.workDate && a.status !== 'CANCELLED'
            );
            if (hasExisting) return false;
            const hasProposal = proposals.some(
                (prop) => prop.assignment.employeeId === e.id && prop.assignment.workDate === p.assignment.workDate
            );
            if (hasProposal) return false;
            return true;
        });

        return {
            proposal: p,
            replacementCount: candidates.length,
            hasWarning: p.tier > 1 ? 1 : 0,
            workDate: p.assignment.workDate,
        };
    });

    scored.sort(
        (a, b) =>
            b.replacementCount - a.replacementCount ||
            b.hasWarning - a.hasWarning ||
            b.workDate.localeCompare(a.workDate)
    );

    return scored[0].proposal;
}

/**
 * Tìm ca trống phù hợp trong danh sách unfilled để gán thêm cho nhân viên
 */
export function findEligibleUnfilledSlot(
    employeeId: number,
    unfilled: UnfilledSlot[],
    currentProposals: ProposedAssignment[],
    existingAssignments: ShiftAssignment[],
    shiftTemplates: ShiftTemplate[],
    isAvailable: (empId: number, dayOfWeek: number, shiftId: number) => boolean,
    approvedLeaves: LeaveRequest[],
    holidays: CompanyHoliday[],
    settings: DemoSettings,
    allEmployees: Employee[],
    scheduleId: number
): { slot: UnfilledSlot; template: ShiftTemplate; proposal: ProposedAssignment } | null {
    const employee = allEmployees.find((e) => e.id === employeeId);
    if (!employee || !isSchedulable(employee)) return null;

    // Lọc các ca hiện có của nhân viên (bao gồm cả existing và proposals)
    const empAssignments = [
        ...existingAssignments.filter((a) => a.employeeId === employeeId && a.status !== 'CANCELLED'),
        ...currentProposals.filter((p) => p.assignment.employeeId === employeeId).map((p) => p.assignment),
    ];

    for (const slot of unfilled) {
        if (slot.missing <= 0) continue;
        const template = shiftTemplates.find((t) => t.id === slot.workShiftId && t.isActive);
        if (!template) continue;

        const isoDay = getISODay(parseISO(slot.workDate));
        if (!isAvailable(employeeId, isoDay, template.id)) continue;

        // Trùng ca cùng ngày
        const sameDayShifts = empAssignments.filter((a) => a.workDate === slot.workDate);
        if (sameDayShifts.some((a) => a.workShiftId === template.id)) continue;
        if (sameDayShifts.length >= 2) continue; // Tối đa 2 ca/ngày

        // Kiểm tra xung đột thời gian (trùng giờ, nghỉ phép, ngày lễ)
        const { startMs, endMs } = getShiftAbsoluteTimeRange(
            slot.workDate,
            template.startTime,
            template.endTime,
            template.isCrossMidnight
        );
        const { netHours } = calculateShiftDurations(
            template.startTime,
            template.endTime,
            template.breakMinutes,
            template.isCrossMidnight
        );

        const conflicts = validateAllShiftConflicts({
            employee,
            newShiftRange: {
                workDate: slot.workDate,
                startTime: template.startTime,
                endTime: template.endTime,
                isCrossMidnight: template.isCrossMidnight,
                startMs,
                endMs,
            },
            newShiftNetHours: netHours,
            existingShifts: empAssignments,
            employeeLeaves: approvedLeaves.filter((l) => l.employeeId === employeeId),
            holidays,
            settings,
        });

        if (conflicts.some(isHardBlock)) continue;

        // Tạo assignment
        const newAssignment = buildAssignment(
            template,
            employeeId,
            slot.workDate,
            scheduleId,
            Date.now() + Math.floor(Math.random() * 10000)
        );

        const notes: string[] = [];
        if (sameDayShifts.length >= 1) notes.push(`Ca thứ ${sameDayShifts.length + 1} trong ngày`);

        const proposal: ProposedAssignment = {
            assignment: newAssignment,
            employeeName: employee.fullName,
            employeeCode: employee.employeeCode,
            tier: conflicts.length > 0 ? 2 : 1,
            warnings: conflicts,
            notes,
        };

        return { slot, template, proposal };
    }

    return null;
}

/**
 * Cập nhật lại danh sách summaries cho từng nhân viên dựa trên proposals hiện tại.
 * - REPLACE_ALL: các ca cũ trên lịch trong khoảng [fromDate, toDate] bị xóa hoàn toàn khi áp dụng,
 *   nên baseHours = 0, totalHours = addedHours.
 * - FILL_MISSING: các ca cũ trên lịch được giữ nguyên, nên baseHours = tổng giờ các ca cũ trong kỳ.
 */
export function recalculateAutoSummaries(
    employees: Employee[],
    proposals: ProposedAssignment[],
    existingAssignments: ShiftAssignment[],
    fromDate: string,
    toDate: string,
    mode: 'REPLACE_ALL' | 'FILL_MISSING' = 'REPLACE_ALL'
): EmployeeAutoSummary[] {
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const schedulable = employees.filter(isSchedulable);

    // Tính giờ gốc từ existing trong khoảng ngày
    const baseHoursMap = new Map<number, number>();
    if (mode === 'FILL_MISSING') {
        for (const a of existingAssignments) {
            if (a.status !== 'CANCELLED' && a.workDate >= fromDate && a.workDate <= toDate) {
                baseHoursMap.set(a.employeeId, (baseHoursMap.get(a.employeeId) ?? 0) + hoursOf(a));
            }
        }
    }

    return schedulable.map((emp) => {
        const mine = proposals.filter((p) => p.assignment.employeeId === emp.id);
        const addedHours = round1(mine.reduce((sum, p) => sum + hoursOf(p.assignment), 0));
        const baseHours = baseHoursMap.get(emp.id) ?? 0;
        return {
            employeeId: emp.id,
            employeeName: emp.fullName,
            addedShifts: mine.length,
            addedHours,
            totalHours: round1(baseHours + addedHours),
        };
    });
}