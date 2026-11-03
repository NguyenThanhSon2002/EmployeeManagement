import { useMemo } from 'react';
import type {
  Employee,
  ShiftTemplate,
  ShiftAssignment,
  LeaveRequest,
  DemoSettings,
} from '@/types/domain.types';
import {
  checkShiftOverlap,
  checkRestTimeWithDailyThreshold,
  checkTravelBufferBetweenBranches,
  getShiftAbsoluteTimeRange,
  calculateEmployeeDailyHours,
} from '@/utils/conflict-detector.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { sumEmployeeHoursInWeek } from '@/utils/weekly-hours.utils';
import { useAvailabilityStore } from '@/features/employees/store/useAvailabilityStore';
import type { EvaluatedStaffStatus } from '../dialogs/StaffEligibilityItem';

interface UseStaffEligibilityListParams {
  employees: Employee[];
  shiftTemplate: ShiftTemplate | null;
  workDate: string;
  allAssignments: ShiftAssignment[];
  approvedLeaves: LeaveRequest[];
  settings: DemoSettings;
  branchId?: number;
  branchName?: string;
  selectedEmpIds: Set<number>;
  filterMode: 'AVAILABLE' | 'ALL';
  searchTerm: string;
}

export function useStaffEligibilityList({
  employees,
  shiftTemplate,
  workDate,
  allAssignments,
  approvedLeaves,
  settings,
  branchId,
  branchName,
  selectedEmpIds,
  filterMode,
  searchTerm,
}: UseStaffEligibilityListParams) {
  const isAvailable = useAvailabilityStore((s) => s.isAvailable);
  const isPreferredShift = useAvailabilityStore((s) => s.isPreferredShift);

  const dayOfWeek = useMemo(() => {
    if (!workDate) return 1;
    const dateObj = new Date(workDate + 'T00:00:00');
    const jsDay = dateObj.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, [workDate]);

  const shiftInfo = useMemo(() => {
    if (!shiftTemplate || !workDate) return null;
    const { netHours } = calculateShiftDurations(
      shiftTemplate.startTime,
      shiftTemplate.endTime,
      shiftTemplate.breakMinutes,
      shiftTemplate.isCrossMidnight
    );
    const timeRange = {
      workDate,
      startTime: shiftTemplate.startTime,
      endTime: shiftTemplate.endTime,
      isCrossMidnight: shiftTemplate.isCrossMidnight,
      ...getShiftAbsoluteTimeRange(
        workDate,
        shiftTemplate.startTime,
        shiftTemplate.endTime,
        shiftTemplate.isCrossMidnight
      ),
    };
    return { netHours, timeRange };
  }, [shiftTemplate, workDate]);

  const currentAssignedMap = useMemo(() => {
    const map = new Map<number, ShiftAssignment>();
    if (!shiftTemplate || !workDate) return map;
    for (const a of allAssignments) {
      if (
        Number(a.workShiftId) === Number(shiftTemplate.id) &&
        a.workDate === workDate &&
        a.status !== 'CANCELLED'
      ) {
        map.set(Number(a.employeeId), a);
      }
    }
    return map;
  }, [shiftTemplate?.id, workDate, allAssignments]);

  const employeeStatusList: EvaluatedStaffStatus[] = useMemo(() => {
    if (!shiftTemplate || !workDate || !shiftInfo) return [];

    return employees
      .filter((emp) => emp.employmentStatus !== 'RESIGNED' && emp.positionId !== 1)
      .map((emp) => {
        const isAlreadyInThisShift = currentAssignedMap.has(Number(emp.id));
        const isAvailableForShift = isAvailable(
          Number(emp.id),
          dayOfWeek,
          Number(shiftTemplate.id)
        );
        const isPreferred = isPreferredShift(
          Number(emp.id),
          Number(shiftTemplate.id)
        );

        const leave = approvedLeaves.find(
          (l) =>
            Number(l.employeeId) === Number(emp.id) &&
            workDate >= l.startDate &&
            workDate <= l.endDate &&
            l.status === 'APPROVED'
        );

        const thisAssignment = currentAssignedMap.get(Number(emp.id));
        const otherShifts = allAssignments.filter(
          (a) =>
            Number(a.employeeId) === Number(emp.id) &&
            a.status !== 'CANCELLED' &&
            (!thisAssignment || a.id !== thisAssignment.id)
        );

        const weeklyHours = sumEmployeeHoursInWeek(allAssignments, Number(emp.id), workDate);

        const sameDayShifts = otherShifts.filter((s) => s.workDate === workDate);
        const overlapCheck = checkShiftOverlap(shiftInfo.timeRange, sameDayShifts, branchId);

        const travelCheck = checkTravelBufferBetweenBranches(
          shiftInfo.timeRange,
          otherShifts,
          branchId,
          branchName,
          45
        );

        const sameDayExternalShift = sameDayShifts.find((s) => s.isExternal);

        const restCheck = checkRestTimeWithDailyThreshold(
          shiftInfo.timeRange,
          shiftInfo.netHours,
          otherShifts,
          settings?.minRestBetweenShiftsHours || 12
        );

        const totalDailyHours = calculateEmployeeDailyHours(
          workDate,
          sameDayShifts,
          shiftInfo.timeRange,
          shiftInfo.netHours
        );
        const isDailyExceeded = totalDailyHours > 12.0;

        return {
          emp,
          isAlreadyInThisShift,
          isAvailableForShift,
          isPreferred,
          leave,
          hasOverlap: overlapCheck.hasOverlap,
          overlapMessage: overlapCheck.message,
          isHandover: Boolean(overlapCheck.isHandover),
          handoverMinutes: overlapCheck.overlapMinutes || 0,
          handoverShift: overlapCheck.handoverShift || null,
          hasTravelWarning: travelCheck.hasBufferConflict,
          travelMessage: travelCheck.message,
          travelConflictShift: travelCheck.conflictingShift,
          sameDayExternalShift,
          hasRestWarning: restCheck.isRestViolated,
          restMessage: restCheck.message,
          restHours: restCheck.actualRestHours,
          isDailyExceeded,
          totalDailyHours,
          weeklyHours,
          hasWarning: restCheck.isRestViolated || isDailyExceeded || travelCheck.hasBufferConflict,
        };
      });
  }, [
    employees,
    shiftTemplate,
    workDate,
    shiftInfo,
    currentAssignedMap,
    approvedLeaves,
    allAssignments,
    settings,
    dayOfWeek,
    isAvailable,
    isPreferredShift,
    branchId,
    branchName,
  ]);

  const availableCount = useMemo(() => {
    return employeeStatusList.filter(
      (item) => item.isAvailableForShift || item.isAlreadyInThisShift
    ).length;
  }, [employeeStatusList]);
  const totalCount = employeeStatusList.length;

  const filteredList = useMemo(() => {
    let list = employeeStatusList;
    if (filterMode === 'AVAILABLE') {
      list = list.filter((item) => item.isAvailableForShift || item.isAlreadyInThisShift);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.emp.fullName.toLowerCase().includes(term) ||
          item.emp.employeeCode.toLowerCase().includes(term)
      );
    }

    return [...list].sort((a, b) => {
      const aSelected = selectedEmpIds.has(Number(a.emp.id)) ? 1 : 0;
      const bSelected = selectedEmpIds.has(Number(b.emp.id)) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;

      const aPreferred = a.isPreferred ? 1 : 0;
      const bPreferred = b.isPreferred ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;

      const aAvailable = a.isAvailableForShift ? 1 : 0;
      const bAvailable = b.isAvailableForShift ? 1 : 0;
      if (aAvailable !== bAvailable) return bAvailable - aAvailable;

      const aOverlap = a.hasOverlap ? 1 : 0;
      const bOverlap = b.hasOverlap ? 1 : 0;
      if (aOverlap !== bOverlap) return aOverlap - bOverlap;

      const aWarning = a.hasWarning ? 1 : 0;
      const bWarning = b.hasWarning ? 1 : 0;
      if (aWarning !== bWarning) return aWarning - bWarning;

      return a.weeklyHours - b.weeklyHours;
    });
  }, [employeeStatusList, filterMode, searchTerm, selectedEmpIds]);

  return {
    dayOfWeek,
    shiftInfo,
    currentAssignedMap,
    employeeStatusList,
    availableCount,
    totalCount,
    filteredList,
  };
}
