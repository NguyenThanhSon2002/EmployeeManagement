import { addDays, format, parseISO } from 'date-fns';
import type { ShiftAssignment } from '@/types/domain.types';
import { calculateShiftDurations } from './schedule-calc.utils';

/** Thứ Hai và Chủ Nhật (YYYY-MM-DD) của tuần chứa ngày dateStr */
export function getWeekRange(dateStr: string): { start: string; end: string } {
    const d = parseISO(dateStr);
    const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const monday = addDays(d, -offset);
    return {
        start: format(monday, 'yyyy-MM-dd'),
        end: format(addDays(monday, 6), 'yyyy-MM-dd'),
    };
}

/** Tổng giờ làm (net) của một nhân viên trong tuần chứa dateStr, tính trên mọi ca được truyền vào */
export function sumEmployeeHoursInWeek(
    assignments: ShiftAssignment[],
    employeeId: number,
    dateStr: string,
    excludeAssignmentId?: number
): number {
    const { start, end } = getWeekRange(dateStr);
    let total = 0;
    for (const a of assignments) {
        if (Number(a.employeeId) !== Number(employeeId) || a.status === 'CANCELLED') continue;
        if (excludeAssignmentId !== undefined && a.id === excludeAssignmentId) continue;
        if (a.workDate < start || a.workDate > end) continue;
        total += calculateShiftDurations(
            a.snapshotStartTime,
            a.snapshotEndTime,
            a.snapshotBreakMinutes,
            a.snapshotCrossMidnight
        ).netHours;
    }
    return Math.round(total * 10) / 10;
}