import { describe, it, expect } from 'vitest';
import {
  checkShiftOverlap,
  checkRestTimeBetweenShifts,
  validateAllShiftConflicts,
  getShiftAbsoluteTimeRange,
} from '../conflict-detector.utils';
import type { Employee, ShiftAssignment, DemoSettings } from '@/types/domain.types';

const mockEmployee: Employee = {
  id: 1,
  employeeCode: 'EMP001',
  fullName: 'Nguyen Van A',
  email: 'a@example.com',
  phoneNumber: '0901234567',
  branchId: 1,
  positionId: 1,
  managerId: null,
  employmentStatus: 'OFFICIAL',
  hireDate: '2022-01-01',
  isActive: true,
};

const mockSettings: DemoSettings = {
  minRestBetweenShiftsHours: 12,
  maxWeeklyHours: 48,
  maxDailyHours: 12,
  gracePeriodMinutes: 5,
  leaveConflictSeverity: 'MANDATORY',
  overnightAttribution: 'START_DATE',
};

describe('Multi-shift and Conflict Detection Utils', () => {
  it('correctly detects overlap between two shifts on the same day', () => {
    const existingShift: ShiftAssignment = {
      id: 101,
      scheduleId: 1,
      employeeId: 1,
      workShiftId: 1,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca Sáng',
      snapshotStartTime: '06:00',
      snapshotEndTime: '14:00',
      snapshotBreakMinutes: 30,
      snapshotColorCode: '#1890ff',
      snapshotCrossMidnight: false,
      plannedStartTime: '2026-10-19T06:00:00Z',
      plannedEndTime: '2026-10-19T14:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    const overlappingShiftRange = {
      workDate: '2026-10-19',
      startTime: '12:00',
      endTime: '18:00',
      isCrossMidnight: false,
      ...getShiftAbsoluteTimeRange('2026-10-19', '12:00', '18:00', false),
    };

    const result = checkShiftOverlap(overlappingShiftRange, [existingShift]);
    expect(result.hasOverlap).toBe(true);
    expect(result.conflictingShift?.id).toBe(101);
  });

  it('allows non-overlapping shifts on the same day (multi-shift support)', () => {
    const existingShift: ShiftAssignment = {
      id: 101,
      scheduleId: 1,
      employeeId: 1,
      workShiftId: 1,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca Sáng',
      snapshotStartTime: '06:00',
      snapshotEndTime: '12:00',
      snapshotBreakMinutes: 0,
      snapshotColorCode: '#1890ff',
      snapshotCrossMidnight: false,
      plannedStartTime: '2026-10-19T06:00:00Z',
      plannedEndTime: '2026-10-19T12:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    // Second shift starts at 16:00, no time overlap with 06:00-12:00
    const secondShiftRange = {
      workDate: '2026-10-19',
      startTime: '16:00',
      endTime: '20:00',
      isCrossMidnight: false,
      ...getShiftAbsoluteTimeRange('2026-10-19', '16:00', '20:00', false),
    };

    const overlapResult = checkShiftOverlap(secondShiftRange, [existingShift]);
    expect(overlapResult.hasOverlap).toBe(false);
  });

  it('triggers warning when rest interval between two shifts is less than 12 hours', () => {
    const existingShift: ShiftAssignment = {
      id: 101,
      scheduleId: 1,
      employeeId: 1,
      workShiftId: 1,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca Sáng',
      snapshotStartTime: '06:00',
      snapshotEndTime: '12:00',
      snapshotBreakMinutes: 0,
      snapshotColorCode: '#1890ff',
      snapshotCrossMidnight: false,
      plannedStartTime: '2026-10-19T06:00:00Z',
      plannedEndTime: '2026-10-19T12:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    // Second shift starts at 16:00 (rest gap is 4h < 12h)
    const secondShiftRange = {
      workDate: '2026-10-19',
      startTime: '16:00',
      endTime: '20:00',
      isCrossMidnight: false,
      ...getShiftAbsoluteTimeRange('2026-10-19', '16:00', '20:00', false),
    };

    const restCheck = checkRestTimeBetweenShifts(secondShiftRange, [existingShift], 12);
    expect(restCheck.isRestViolated).toBe(true);
    expect(restCheck.actualRestHours).toBe(4);
  });

  it('triggers BR-DAILY-LIMIT when total daily hours exceed 12h', () => {
    const morningShift: ShiftAssignment = {
      id: 101,
      scheduleId: 1,
      employeeId: 1,
      workShiftId: 1,
      workDate: '2026-10-19',
      snapshotShiftName: 'Ca 1',
      snapshotStartTime: '06:00',
      snapshotEndTime: '14:00', // 8h
      snapshotBreakMinutes: 0,
      snapshotColorCode: '#1890ff',
      snapshotCrossMidnight: false,
      plannedStartTime: '2026-10-19T06:00:00Z',
      plannedEndTime: '2026-10-19T14:00:00Z',
      status: 'ASSIGNED',
      overrideRule: null,
      overrideReason: null,
      version: 1,
    };

    // Second shift 15:00 - 21:00 (6h) -> Total 14h > 12h limit
    const secondShiftRange = {
      workDate: '2026-10-19',
      startTime: '15:00',
      endTime: '21:00',
      isCrossMidnight: false,
      ...getShiftAbsoluteTimeRange('2026-10-19', '15:00', '21:00', false),
    };

    const conflicts = validateAllShiftConflicts({
      employee: mockEmployee,
      newShiftRange: secondShiftRange,
      newShiftNetHours: 6,
      existingShifts: [morningShift],
      employeeLeaves: [],
      holidays: [],
      settings: mockSettings,
    });

    const dailyLimitConflict = conflicts.find((c) => c.ruleCode === 'BR-DAILY-LIMIT');
    expect(dailyLimitConflict).toBeDefined();
    expect(dailyLimitConflict?.severity).toBe('WARNING');
    expect(dailyLimitConflict?.canOverride).toBe(true);
  });
});
