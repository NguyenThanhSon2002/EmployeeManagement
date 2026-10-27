import { addDays, parseISO, format, differenceInCalendarDays } from 'date-fns';
import type {
  Employee,
  ShiftAssignment,
  ScheduleConflict,
  LeaveRequest,
  CompanyHoliday,
  DemoSettings,
} from '@/types/domain.types';
import { calculateShiftDurations, sumWeeklyScheduledHours } from './schedule-calc.utils';

/**
 * Quy tắc nghỉ tối thiểu giữa các ca (BR-006) chỉ áp dụng khi nhân viên làm từ ngần này giờ/ngày trở lên.
 * Làm ít hơn thì không cảnh báo thiếu giờ nghỉ.
 */
export const MIN_DAILY_HOURS_FOR_REST_RULE = 8;

export interface ShiftTimeRange {
  id?: number;
  workDate: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isCrossMidnight: boolean;
  startMs: number;
  endMs: number;
}

/**
 * Converts a date string (YYYY-MM-DD) and time (HH:mm) into absolute epoch milliseconds.
 * If isCrossMidnight is true, endTime is shifted to the subsequent calendar day.
 */
export function getShiftAbsoluteTimeRange(
  workDate: string,
  startTime: string,
  endTime: string,
  isCrossMidnight: boolean
): { startMs: number; endMs: number } {
  const [startH, startM] = startTime.split(':').map((s) => parseInt(s, 10) || 0);
  const [endH, endM] = endTime.split(':').map((s) => parseInt(s, 10) || 0);

  const startDate = parseISO(workDate);
  startDate.setHours(startH, startM, 0, 0);
  const startMs = startDate.getTime();

  let endDate: Date;
  if (isCrossMidnight || endH * 60 + endM < startH * 60 + startM) {
    endDate = addDays(parseISO(workDate), 1);
  } else {
    endDate = parseISO(workDate);
  }
  endDate.setHours(endH, endM, 0, 0);
  const endMs = endDate.getTime();

  return { startMs, endMs };
}

/**
 * Converts a ShiftAssignment into a ShiftTimeRange
 */
export function assignmentToTimeRange(assignment: ShiftAssignment): ShiftTimeRange {
  const { startMs, endMs } = getShiftAbsoluteTimeRange(
    assignment.workDate,
    assignment.snapshotStartTime,
    assignment.snapshotEndTime,
    assignment.snapshotCrossMidnight
  );
  return {
    id: assignment.id,
    workDate: assignment.workDate,
    startTime: assignment.snapshotStartTime,
    endTime: assignment.snapshotEndTime,
    isCrossMidnight: assignment.snapshotCrossMidnight,
    startMs,
    endMs,
  };
}

/**
 * BR-001: Check for overlapping shifts of the same employee.
 * Condition: max(S1, S2) < min(E1, E2)
 * Severity: MANDATORY (Cannot be overridden, blocks saving)
 */
export function checkShiftOverlap(
  newShift: ShiftTimeRange,
  existingShifts: ShiftAssignment[]
): { hasOverlap: boolean; conflictingShift: ShiftAssignment | null; message: string | null } {
  for (const shift of existingShifts) {
    if (shift.status === 'CANCELLED') continue;
    if (newShift.id !== undefined && shift.id === newShift.id) continue;

    const existingRange = assignmentToTimeRange(shift);
    const overlapStart = Math.max(newShift.startMs, existingRange.startMs);
    const overlapEnd = Math.min(newShift.endMs, existingRange.endMs);

    // Strict inequality: touching at edge (e.g. 14:00:00 to 14:00:00) does not overlap
    if (overlapStart < overlapEnd) {
      const branchSuffix = shift.branchName ? ` tại ${shift.branchName}` : '';
      return {
        hasOverlap: true,
        conflictingShift: shift,
        message: `Trùng khung giờ với ca ${shift.snapshotShiftName} (${shift.snapshotStartTime} - ${shift.snapshotEndTime}${branchSuffix})`,
      };
    }
  }

  return { hasOverlap: false, conflictingShift: null, message: null };
}

/**
 * BR-TRAVEL-BUFFER: Check travel buffer between shifts at DIFFERENT branches.
 * Severity: WARNING (Can be overridden with explanation)
 */
export function checkTravelBufferBetweenBranches(
  newShift: ShiftTimeRange,
  existingShifts: ShiftAssignment[],
  targetBranchId?: number,
  targetBranchName?: string,
  bufferMinutes = 45
): { hasBufferConflict: boolean; conflictingShift: ShiftAssignment | null; message: string | null } {
  const bufferMs = bufferMinutes * 60 * 1000;

  for (const shift of existingShifts) {
    if (shift.status === 'CANCELLED') continue;
    if (newShift.id !== undefined && shift.id === newShift.id) continue;

    // Chỉ kiểm tra khi biết rõ hai ca thuộc hai chi nhánh KHÁC nhau.
    // Cùng chi nhánh (hoặc chưa biết chi nhánh của ca đang xét) thì không cần thời gian di chuyển.
    if (
        !targetBranchId ||
        !shift.branchId ||
        Number(shift.branchId) === Number(targetBranchId)
    ) {
      continue;
    }

    const existingRange = assignmentToTimeRange(shift);

    // Existing ends before newShift starts
    if (existingRange.endMs <= newShift.startMs) {
      const gapMs = newShift.startMs - existingRange.endMs;
      if (gapMs >= 0 && gapMs < bufferMs) {
        const gapMin = Math.round(gapMs / (60 * 1000));
        const otherBranch = shift.branchName || `Chi nhánh #${shift.branchId}`;
        const currentBranch = targetBranchName || 'cơ sở này';
        return {
          hasBufferConflict: true,
          conflictingShift: shift,
          message: `Khoảng cách giữa ca tại ${otherBranch} và ca tại ${currentBranch} chỉ có ${gapMin} phút, không đủ thời gian di chuyển an toàn giữa 2 cơ sở (khuyến nghị tối thiểu ${bufferMinutes} phút)`,
        };
      }
    }

    // NewShift ends before existing starts
    if (newShift.endMs <= existingRange.startMs) {
      const gapMs = existingRange.startMs - newShift.endMs;
      if (gapMs >= 0 && gapMs < bufferMs) {
        const gapMin = Math.round(gapMs / (60 * 1000));
        const otherBranch = shift.branchName || `Chi nhánh #${shift.branchId}`;
        const currentBranch = targetBranchName || 'cơ sở này';
        return {
          hasBufferConflict: true,
          conflictingShift: shift,
          message: `Khoảng cách giữa ca tại ${currentBranch} và ca tại ${otherBranch} chỉ có ${gapMin} phút, không đủ thời gian di chuyển an toàn giữa 2 cơ sở (khuyến nghị tối thiểu ${bufferMinutes} phút)`,
        };
      }
    }
  }

  return { hasBufferConflict: false, conflictingShift: null, message: null };
}

/**
 * BR-002: Check employee active employment status.
 * Severity: MANDATORY
 */
export function checkEmployeeActiveForShift(
  employee: Employee
): { isValid: boolean; message: string | null } {
  if (!employee.isActive || employee.employmentStatus === 'RESIGNED') {
    return {
      isValid: false,
      message: 'Nhân viên đã thôi việc hoặc đang bị vô hiệu hóa, không được phân ca.',
    };
  }
  return { isValid: true, message: null };
}

/**
 * BR-003: Check if employee has approved leave on work date.
 * Severity: WARNING
 */
export function checkLeaveConflict(
  workDate: string,
  employeeLeaves: LeaveRequest[]
): { hasConflict: boolean; leave: LeaveRequest | null; message: string | null } {
  for (const leave of employeeLeaves) {
    if (leave.status === 'APPROVED' && workDate >= leave.startDate && workDate <= leave.endDate) {
      return {
        hasConflict: true,
        leave,
        message: `Trùng với ngày nghỉ phép đã được phê duyệt (${leave.leaveTypeName}).`,
      };
    }
  }
  return { hasConflict: false, leave: null, message: null };
}

/**
 * BR-004: Check if employee's weekly scheduled hours exceed limit (default 48.0h).
 * Severity: WARNING
 */
export function checkWeeklyHoursLimit(
  newShiftNetHours: number,
  existingWeeklyHours: number,
  maxWeeklyHours: number = 48.0
): { isExceeded: boolean; totalHours: number; message: string | null } {
  const total = Math.round((existingWeeklyHours + newShiftNetHours) * 100) / 100;
  if (total > maxWeeklyHours) {
    return {
      isExceeded: true,
      totalHours: total,
      message: `Tổng giờ làm trong tuần đạt ${total.toFixed(1)}h, vượt trần chính sách ${maxWeeklyHours.toFixed(1)}h/tuần.`,
    };
  }
  return { isExceeded: false, totalHours: total, message: null };
}

export const DAILY_HOURS_THRESHOLD_FOR_REST_RULE = 8.0;

/**
 * Tính tổng số giờ làm việc thực tế của nhân viên trong một ngày cụ thể (trừ giờ nghỉ giữa ca).
 * Hỗ trợ tính cả ca ứng viên candidateShift nếu được cung cấp.
 */
export function calculateEmployeeDailyHours(
  targetDate: string,
  employeeShifts: ShiftAssignment[],
  candidateShift?: ShiftTimeRange,
  candidateNetHours?: number
): number {
  let totalMinutes = 0;

  // Cộng ca ứng viên nếu ca đó thuộc đúng ngày targetDate
  if (candidateShift && candidateShift.workDate === targetDate) {
    if (candidateNetHours !== undefined) {
      totalMinutes += Math.round(candidateNetHours * 60);
    } else {
      const { netHours } = calculateShiftDurations(
        candidateShift.startTime,
        candidateShift.endTime,
        0,
        candidateShift.isCrossMidnight
      );
      totalMinutes += Math.round(netHours * 60);
    }
  }

  // Cộng các ca đã phân công khác của nhân viên trong ngày đó
  for (const s of employeeShifts) {
    if (s.status === 'CANCELLED') continue;
    if (candidateShift?.id !== undefined && s.id === candidateShift.id) continue;
    if (s.workDate !== targetDate) continue;

    const { netHours } = calculateShiftDurations(
      s.snapshotStartTime,
      s.snapshotEndTime,
      s.snapshotBreakMinutes,
      s.snapshotCrossMidnight
    );
    totalMinutes += Math.round(netHours * 60);
  }

  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * BR-006: Check minimum rest time between adjacent shifts (default 12.0h).
 * Quy tắc nghỉ tối thiểu giữa 2 ca:
 * - Chỉ áp dụng giữa Ngày N và Ngày N+1 (KHÔNG áp dụng cùng ngày).
 * - CHỈ kích hoạt khi ngày đứng trước đạt tổng thời gian làm việc >= 8.0 giờ.
 *   (Nếu ngày đứng trước làm < 8.0h thì KHÔNG cảnh báo nghỉ ngơi).
 * Severity: WARNING
 */
export function checkRestTimeBetweenShifts(
  currentShift: ShiftTimeRange,
  allEmployeeShifts: ShiftAssignment[],
  minRestHours: number = 12.0,
  _currentNetHours?: number
): {
  isRestViolated: boolean;
  actualRestHours: number;
  adjacentShift: ShiftAssignment | null;
  direction: 'PREVIOUS' | null;
  message: string | null;
} {
  const otherRanges = allEmployeeShifts
    .filter((s) => s.status !== 'CANCELLED' && (currentShift.id === undefined || s.id !== currentShift.id))
    .map((s) => ({ assignment: s, range: assignmentToTimeRange(s) }))
    .sort((a, b) => a.range.startMs - b.range.startMs);

  const currDate = parseISO(currentShift.workDate);

  // Kiểm tra với ca muộn nhất của ngày liền trước (N-1)
  // Chỉ cảnh báo ở ca ngày hôm sau khi ngày hôm trước nhân viên làm >= 8h và chưa nghỉ đủ 12h
  const prevShifts = otherRanges.filter((o) => {
    if (o.range.endMs > currentShift.startMs) return false;
    const prevDate = parseISO(o.assignment.workDate);
    // Chỉ áp dụng khi ca trước thuộc Ngày N-1 (differenceInCalendarDays === 1)
    return differenceInCalendarDays(currDate, prevDate) === 1;
  });

  if (prevShifts.length > 0) {
    const latestPrev = prevShifts[prevShifts.length - 1];
    const prevWorkDate = latestPrev.assignment.workDate;
    const prevDayTotalHours = calculateEmployeeDailyHours(prevWorkDate, allEmployeeShifts);

    // CHỈ áp dụng nếu tổng thời gian làm việc của nhân viên trong ngày N-1 đạt >= 8.0 giờ
    if (prevDayTotalHours >= DAILY_HOURS_THRESHOLD_FOR_REST_RULE) {
      const diffHours = (currentShift.startMs - latestPrev.range.endMs) / (1000 * 60 * 60);
      const roundedDiff = Math.round(diffHours * 10) / 10;
      if (roundedDiff < minRestHours) {
        return {
          isRestViolated: true,
          actualRestHours: roundedDiff,
          adjacentShift: latestPrev.assignment,
          direction: 'PREVIOUS',
          message: `Khoảng nghỉ sau ca ngày hôm trước chỉ có ${roundedDiff.toFixed(1)}h (dưới ${minRestHours.toFixed(1)}h sau khi làm việc ${prevDayTotalHours.toFixed(1)}h trong ngày ${prevWorkDate})`,
        };
      }
    }
  }

  return {
    isRestViolated: false,
    actualRestHours: 999,
    adjacentShift: null,
    direction: null,
    message: null,
  };
}

export const REST_RULE_INCLUDES_SAME_DAY_SHIFTS = false;

export function checkRestTimeWithDailyThreshold(
    currentShift: ShiftTimeRange,
    currentNetHours: number,
    allEmployeeShifts: ShiftAssignment[],
    minRestHours: number = 12.0,
    _minDailyHours: number = MIN_DAILY_HOURS_FOR_REST_RULE
): ReturnType<typeof checkRestTimeBetweenShifts> {
  return checkRestTimeBetweenShifts(currentShift, allEmployeeShifts, minRestHours, currentNetHours);
}

/**
 * BR-007: Check if shift falls on a company holiday.
 * Severity: WARNING
 */
export function checkHolidayConflict(
  workDate: string,
  holidays: CompanyHoliday[]
): { isHoliday: boolean; holiday: CompanyHoliday | null; message: string | null } {
  const match = holidays.find((h) => h.holidayDate === workDate);
  if (match) {
    return {
      isHoliday: true,
      holiday: match,
      message: `Ca làm việc rơi vào Ngày lễ công ty (${match.holidayName}). Cần xác nhận làm việc ngày Lễ.`,
    };
  }
  return { isHoliday: false, holiday: null, message: null };
}

/**
 * Comprehensive conflict validation for assigning a shift.
 * Aggregates all rules (BR-001 through BR-007) and returns a list of ScheduleConflict items.
 */
export function validateAllShiftConflicts(params: {
  employee: Employee;
  newShiftRange: ShiftTimeRange;
  newShiftNetHours: number;
  existingShifts: ShiftAssignment[];
  employeeLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  settings: DemoSettings;
  targetBranchId?: number;
  targetBranchName?: string;
}): ScheduleConflict[] {
  const {
    employee,
    newShiftRange,
    newShiftNetHours,
    existingShifts,
    employeeLeaves,
    holidays,
    settings,
    targetBranchId,
    targetBranchName,
  } = params;

  const conflicts: ScheduleConflict[] = [];

  // BR-002: Inactive employee
  const activeCheck = checkEmployeeActiveForShift(employee);
  if (!activeCheck.isValid) {
    conflicts.push({
      id: `BR-002_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-002',
      severity: 'MANDATORY',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: activeCheck.message!,
      canOverride: false,
    });
  }

  // BR-001: Overlap
  const overlapCheck = checkShiftOverlap(newShiftRange, existingShifts);
  if (overlapCheck.hasOverlap) {
    conflicts.push({
      id: `BR-001_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-001',
      severity: 'MANDATORY',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: overlapCheck.message!,
      canOverride: false,
    });
  }

  // BR-TRAVEL-BUFFER: Travel buffer between different branches
  const travelCheck = checkTravelBufferBetweenBranches(
    newShiftRange,
    existingShifts,
    targetBranchId,
    targetBranchName
  );
  if (travelCheck.hasBufferConflict) {
    conflicts.push({
      id: `BR-TRAVEL-BUFFER_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-TRAVEL-BUFFER',
      severity: 'WARNING',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: travelCheck.message!,
      canOverride: true,
    });
  }

  // BR-006: Rest time between shifts (chỉ áp dụng khi ngày làm của ca đứng trước đủ >= 8h)
  const restCheck = checkRestTimeWithDailyThreshold(
      newShiftRange,
      newShiftNetHours,
      existingShifts,
      settings?.minRestBetweenShiftsHours || 12.0
  );
  if (restCheck.isRestViolated) {
    conflicts.push({
      id: `BR-006_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-006',
      severity: 'WARNING',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: restCheck.message!,
      canOverride: true,
    });
  }

  // BR-003: Approved leave
  const leaveCheck = checkLeaveConflict(newShiftRange.workDate, employeeLeaves);
  if (leaveCheck.hasConflict) {
    conflicts.push({
      id: `BR-003_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-003',
      severity: settings.leaveConflictSeverity,
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: leaveCheck.message!,
      canOverride: settings.leaveConflictSeverity === 'WARNING',
    });
  }

  // BR-004: Weekly hours limit (strictly Monday through Sunday of the work date)
  const shiftDate = parseISO(newShiftRange.workDate);
  const weekStart = format(addDays(shiftDate, -(shiftDate.getDay() === 0 ? 6 : shiftDate.getDay() - 1)), 'yyyy-MM-dd');
  const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');

  const currentWeeklyHours = sumWeeklyScheduledHours(
    existingShifts.filter(
      (s) => s.id !== newShiftRange.id && s.workDate >= weekStart && s.workDate <= weekEnd
    )
  );
  const weeklyCheck = checkWeeklyHoursLimit(
    newShiftNetHours,
    currentWeeklyHours,
    settings.maxWeeklyHours
  );
  if (weeklyCheck.isExceeded) {
    conflicts.push({
      id: `BR-004_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-004',
      severity: 'WARNING',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: weeklyCheck.message!,
      canOverride: true,
    });
  }

  // BR-DAILY: Daily hours limit (> 12h/day warning under VN Labor Code 2019)
  const existingSameDayShifts = existingShifts.filter(
    (s) => s.status !== 'CANCELLED' && s.workDate === newShiftRange.workDate && (newShiftRange.id === undefined || s.id !== newShiftRange.id)
  );
  let existingSameDayHours = 0;
  for (const s of existingSameDayShifts) {
    const { netHours } = calculateShiftDurations(
      s.snapshotStartTime,
      s.snapshotEndTime,
      s.snapshotBreakMinutes,
      s.snapshotCrossMidnight
    );
    existingSameDayHours += netHours;
  }
  const totalDayHours = Math.round((existingSameDayHours + newShiftNetHours) * 10) / 10;
  if (totalDayHours > 12.0) {
    conflicts.push({
      id: `BR-DAILY_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-DAILY-LIMIT',
      severity: 'WARNING',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: `Tổng thời gian làm việc trong ngày đạt ${totalDayHours.toFixed(1)}h, vượt quá 12h/ngày theo Điều 107 Luật Lao Động 2019. Yêu cầu nhập lý do giải trình đặc cách.`,
      canOverride: true,
    });
  }

  // BR-007: Holiday
  const holidayCheck = checkHolidayConflict(newShiftRange.workDate, holidays);
  if (holidayCheck.isHoliday) {
    conflicts.push({
      id: `BR-007_${employee.id}_${newShiftRange.workDate}`,
      ruleCode: 'BR-007',
      severity: 'WARNING',
      employeeId: employee.id,
      workDate: newShiftRange.workDate,
      message: holidayCheck.message!,
      canOverride: true,
    });
  }

  return conflicts;
}

