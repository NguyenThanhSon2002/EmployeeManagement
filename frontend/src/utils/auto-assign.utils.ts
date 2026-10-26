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
        // Ưu tiên: Ca ưu tiên (isPreferred) -> Ít cảnh báo nhất -> ít giờ nhất -> ít ca trong ngày nhất
        result.sort(
            (a, b) =>
                (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0) ||
                a.warnings.length - b.warnings.length ||
                a.totalHours - b.totalHours ||
                a.sameDayCount - b.sameDayCount ||
                a.employee.id - b.employee.id
        );
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