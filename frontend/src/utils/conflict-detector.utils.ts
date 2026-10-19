import { addDays, parseISO, format } from 'date-fns';
import type {
  Employee,
  ShiftAssignment,
  ScheduleConflict,
  LeaveRequest,
  CompanyHoliday,
  DemoSettings,
} from '@/types/domain.types';
import { calculateShiftDurations, sumWeeklyScheduledHours } from './schedule-calc.utils';

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
      return {
        hasOverlap: true,
        conflictingShift: shift,
        message: `Trùng khung giờ với ca ${shift.snapshotShiftName} (${shift.snapshotStartTime} - ${shift.snapshotEndTime})`,
      };
    }
  }

  return { hasOverlap: false, conflictingShift: null, message: null };
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

/**
 * BR-006: Check minimum rest time between adjacent shifts (default 11.0h or 12.0h).
 * Severity: WARNING
 */
export function checkRestTimeBetweenShifts(
  currentShift: ShiftTimeRange,
  allEmployeeShifts: ShiftAssignment[],
  minRestHours: number = 11.0
): {
  isRestViolated: boolean;
  actualRestHours: number;
  adjacentShift: ShiftAssignment | null;
  direction: 'PREVIOUS' | 'NEXT' | null;
  message: string | null;
} {
  const otherRanges = allEmployeeShifts
    .filter((s) => s.status !== 'CANCELLED' && (currentShift.id === undefined || s.id !== currentShift.id))
    .map((s) => ({ assignment: s, range: assignmentToTimeRange(s) }))
    .sort((a, b) => a.range.startMs - b.range.startMs);

  // 1. Check with preceding shift (ends before or at current shift start)
  const prevShifts = otherRanges.filter((o) => o.range.endMs <= currentShift.startMs);
  if (prevShifts.length > 0) {
    const latestPrev = prevShifts[prevShifts.length - 1];
    const diffHours = (currentShift.startMs - latestPrev.range.endMs) / (1000 * 60 * 60);
    const roundedDiff = Math.round(diffHours * 10) / 10;
    if (roundedDiff < minRestHours) {
      return {
        isRestViolated: true,
        actualRestHours: roundedDiff,
        adjacentShift: latestPrev.assignment,
        direction: 'PREVIOUS',
        message: `Khoảng nghỉ sau ca trước chỉ có ${roundedDiff.toFixed(1)}h (dưới ${minRestHours.toFixed(1)}h)`,
      };
    }
  }

  // 2. Check with subsequent shift (starts after or at current shift end)
  const nextShifts = otherRanges.filter((o) => o.range.startMs >= currentShift.endMs);
  if (nextShifts.length > 0) {
    const earliestNext = nextShifts[0];
    const diffHours = (earliestNext.range.startMs - currentShift.endMs) / (1000 * 60 * 60);
    const roundedDiff = Math.round(diffHours * 10) / 10;
    if (roundedDiff < minRestHours) {
      return {
        isRestViolated: true,
        actualRestHours: roundedDiff,
        adjacentShift: earliestNext.assignment,
        direction: 'NEXT',
        message: `Khoảng nghỉ trước ca sau chỉ có ${roundedDiff.toFixed(1)}h (dưới ${minRestHours.toFixed(1)}h)`,
      };
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
}): ScheduleConflict[] {
  const {
    employee,
    newShiftRange,
    newShiftNetHours,
    existingShifts,
    employeeLeaves,
    holidays,
    settings,
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

  // BR-006: Rest time between shifts
  const restCheck = checkRestTimeBetweenShifts(
    newShiftRange,
    existingShifts,
    settings.minRestBetweenShiftsHours
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

