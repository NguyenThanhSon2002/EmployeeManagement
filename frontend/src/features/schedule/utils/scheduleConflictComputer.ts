import { format, addDays, parseISO } from 'date-fns';
import type {
  ShiftAssignment,
  ScheduleConflict,
  Employee,
  ShiftTemplate,
  LeaveRequest,
  CompanyHoliday,
} from '@/types/domain.types';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import {
  validateAllShiftConflicts,
  assignmentToTimeRange,
} from '@/utils/conflict-detector.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';

export function computeAllConflicts(
  assignments: Record<string, ShiftAssignment[]>,
  employees: Employee[],
  leaves: LeaveRequest[],
  holidays: CompanyHoliday[],
  shiftTemplates: ShiftTemplate[] = []
): Record<string, ScheduleConflict[]> {
  const settings = useSettingsStore.getState().settings;
  const conflictsMap: Record<string, ScheduleConflict[]> = {};

  const allAssignmentsList: ShiftAssignment[] = Object.values(assignments).flat();

  for (const assignment of allAssignmentsList) {
    if (assignment.status === 'CANCELLED') continue;

    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (!emp) continue;

    const timeRange = assignmentToTimeRange(assignment);
    const { netHours } = calculateShiftDurations(
      assignment.snapshotStartTime,
      assignment.snapshotEndTime,
      assignment.snapshotBreakMinutes,
      assignment.snapshotCrossMidnight
    );

    const assignDate = parseISO(assignment.workDate);
    const dayOfWeek = assignDate.getDay();
    const weekMon = addDays(assignDate, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekSunStr = format(addDays(weekMon, 6), 'yyyy-MM-dd');
    const prevSunStr = format(addDays(weekMon, -1), 'yyyy-MM-dd');

    const empAssignments = allAssignmentsList.filter((a) => {
      return a.employeeId === emp.id && a.workDate >= prevSunStr && a.workDate <= weekSunStr;
    });

    const cellConflicts = validateAllShiftConflicts({
      employee: emp,
      newShiftRange: timeRange,
      newShiftNetHours: netHours,
      existingShifts: empAssignments,
      employeeLeaves: leaves.filter((l) => l.employeeId === emp.id),
      holidays,
      settings,
      targetBranchId: assignment.branchId,
      targetBranchName: assignment.branchName,
    });

    if (cellConflicts.length > 0) {
      const conflictsWithContext = cellConflicts.map((c) => ({
        ...c,
        workShiftId: Number(assignment.workShiftId),
        assignmentId: assignment.id,
      }));
      const key = `${assignment.employeeId}_${assignment.workDate}`;
      conflictsMap[key] = [...(conflictsMap[key] || []), ...conflictsWithContext];
    }
  }

  // Bổ sung kiểm tra định biên tối đa cho từng ô ca
  const templates = shiftTemplates || [];

  if (templates.length > 0) {
    const templateMap = new Map<number | string, ShiftTemplate>();
    for (const t of templates) {
      templateMap.set(t.id, t);
      templateMap.set(Number(t.id), t);
      templateMap.set(String(t.id), t);
    }
    const cellGroups = new Map<string, ShiftAssignment[]>();

    for (const a of allAssignmentsList) {
      if (a.status === 'CANCELLED') continue;
      const cKey = `${a.workShiftId}_${a.workDate}`;
      const list = cellGroups.get(cKey) || [];
      list.push(a);
      cellGroups.set(cKey, list);
    }

    for (const [cKey, list] of cellGroups.entries()) {
      const [shiftIdStr, dateStr] = cKey.split('_');
      const tmpl = templateMap.get(Number(shiftIdStr)) || templateMap.get(shiftIdStr);
      const maxCap = tmpl?.maxStaffing || tmpl?.minStaffing || 1;

      if (tmpl && list.length > maxCap) {
        // Sắp xếp theo ID tăng dần (ID nhỏ hơn = tạo trước = ca gốc hợp lệ; ID lớn hơn = tạo sau = ca bổ sung)
        list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

        // Gán cảnh báo cho các nhân sự từ vị trí vượt định biên
        for (let i = maxCap; i < list.length; i++) {
          const extraAssignment = list[i];
          const k = `${extraAssignment.employeeId}_${dateStr}`;
          const capacityWarning: ScheduleConflict = {
            id: `WARN_CAPACITY_${extraAssignment.employeeId}_${dateStr}_${extraAssignment.workShiftId}`,
            ruleCode: 'WARN_STAFFING_CAPACITY',
            severity: 'WARNING',
            employeeId: extraAssignment.employeeId,
            workDate: dateStr,
            workShiftId: Number(extraAssignment.workShiftId),
            assignmentId: extraAssignment.id,
            message: `${extraAssignment.snapshotShiftName} đã vượt định biên tối đa (${list.length}/${maxCap} NV). Bổ sung nhân sự tăng cường.`,
            canOverride: true,
          };
          conflictsMap[k] = [...(conflictsMap[k] || []), capacityWarning];
        }
      }
    }
  }

  return conflictsMap;
}
