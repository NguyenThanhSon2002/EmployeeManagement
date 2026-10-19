import { describe, it, expect } from 'vitest';
import type { ShiftAssignment, ShiftTemplate } from '@/types/domain.types';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';

describe('Shift-Centric Quota & Weekly Hours Calculation', () => {
  it('correctly calculates staffing quota satisfaction for a shift template', () => {
    const template: ShiftTemplate = {
      id: 1,
      shiftCode: 'SANG',
      shiftName: 'Ca Sáng',
      startTime: '08:00',
      endTime: '12:00',
      breakMinutes: 0,
      isCrossMidnight: false,
      colorCode: '#2563EB',
      textColor: '#FFFFFF',
      minStaffing: 3,
      maxStaffing: 5,
      applicableDays: '1,2,3,4,5,6,7',
      isActive: true,
    };

    const assignmentsOnMonday: ShiftAssignment[] = [
      {
        id: 1,
        scheduleId: 1,
        employeeId: 101,
        workShiftId: 1,
        workDate: '2026-10-19',
        snapshotShiftName: 'Ca Sáng',
        snapshotStartTime: '08:00',
        snapshotEndTime: '12:00',
        snapshotBreakMinutes: 0,
        snapshotCrossMidnight: false,
        snapshotColorCode: '#2563EB',
        plannedStartTime: '2026-10-19T08:00:00Z',
        plannedEndTime: '2026-10-19T12:00:00Z',
        status: 'ASSIGNED',
        overrideRule: null,
        overrideReason: null,
        version: 1,
      },
      {
        id: 2,
        scheduleId: 1,
        employeeId: 102,
        workShiftId: 1,
        workDate: '2026-10-19',
        snapshotShiftName: 'Ca Sáng',
        snapshotStartTime: '08:00',
        snapshotEndTime: '12:00',
        snapshotBreakMinutes: 0,
        snapshotCrossMidnight: false,
        snapshotColorCode: '#2563EB',
        plannedStartTime: '2026-10-19T08:00:00Z',
        plannedEndTime: '2026-10-19T12:00:00Z',
        status: 'ASSIGNED',
        overrideRule: null,
        overrideReason: null,
        version: 1,
      },
    ];

    const currentCount = assignmentsOnMonday.length;
    const isSufficient = currentCount >= template.minStaffing;
    const understaffedCount = Math.max(0, template.minStaffing - currentCount);

    expect(isSufficient).toBe(false);
    expect(understaffedCount).toBe(1);
    expect(`${currentCount}/${template.minStaffing}`).toBe('2/3');
  });

  it('correctly aggregates hours for an employee working 2 shifts on the same day', () => {
    const shift1: ShiftAssignment = {
      id: 1,
      scheduleId: 1,
      employeeId: 101,
      workShiftId: 1,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca Sáng',
      snapshotStartTime: '08:00',
      snapshotEndTime: '12:00',
      snapshotBreakMinutes: 0,
      snapshotCrossMidnight: false,
      snapshotColorCode: '#2563EB',
      plannedStartTime: '2026-10-19T08:00:00Z',
      plannedEndTime: '2026-10-19T12:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    const shift2: ShiftAssignment = {
      id: 2,
      scheduleId: 1,
      employeeId: 101,
      workShiftId: 3,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca Tối',
      snapshotStartTime: '18:00',
      snapshotEndTime: '22:00',
      snapshotBreakMinutes: 0,
      snapshotCrossMidnight: false,
      snapshotColorCode: '#7C3AED',
      plannedStartTime: '2026-10-19T18:00:00Z',
      plannedEndTime: '2026-10-19T22:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    const dayShifts = [shift1, shift2];
    let totalDayHours = 0;
    for (const s of dayShifts) {
      const { netHours } = calculateShiftDurations(
        s.snapshotStartTime,
        s.snapshotEndTime,
        s.snapshotBreakMinutes,
        s.snapshotCrossMidnight
      );
      totalDayHours += netHours;
    }

    expect(dayShifts.length).toBe(2);
    expect(totalDayHours).toBe(8.0);
  });
});
