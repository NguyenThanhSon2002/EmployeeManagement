import { describe, it, expect } from 'vitest';
import type { ShiftAssignment } from '@/types/domain.types';
import { checkRestTimeBetweenShifts, getShiftAbsoluteTimeRange } from '../conflict-detector.utils';

function makeMockAssignment(
  id: number,
  workDate: string,
  startTime: string,
  endTime: string,
  isCrossMidnight: boolean
): ShiftAssignment {
  return {
    id,
    scheduleId: 1,
    employeeId: 101,
    workShiftId: 1,
    workDate,
    snapshotShiftName: 'Shift A',
    snapshotStartTime: startTime,
    snapshotEndTime: endTime,
    snapshotBreakMinutes: 0,
    snapshotCrossMidnight: isCrossMidnight,
    snapshotColorCode: '#1677FF',
    plannedStartTime: `${workDate}T${startTime}:00Z`,
    plannedEndTime: `${workDate}T${endTime}:00Z`,
    status: 'ASSIGNED',
    overrideRule: null,
    overrideReason: null,
    version: 1,
  };
}

describe('Suite 3: Minimum Rest Time Verification (rest-time.test.ts)', () => {
  it('TC-REST-01: Vi phạm ngưỡng nghỉ 11.0h (22:00 -> 06:00 hôm sau = 8.0h nghỉ)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '14:00', '22:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-13', '06:00', '14:00', false);
    const newShift = {
      workDate: '2026-10-13',
      startTime: '06:00',
      endTime: '14:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkRestTimeBetweenShifts(newShift, existing, 11.0);
    expect(result.isRestViolated).toBe(true);
    expect(result.actualRestHours).toBe(8.0);
    expect(result.direction).toBe('PREVIOUS');
  });

  it('TC-REST-02: Đạt ngưỡng nghỉ chính xác 11.0h (22:00 -> 09:00 hôm sau = 11.0h nghỉ)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '14:00', '22:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-13', '09:00', '17:00', false);
    const newShift = {
      workDate: '2026-10-13',
      startTime: '09:00',
      endTime: '17:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkRestTimeBetweenShifts(newShift, existing, 11.0);
    expect(result.isRestViolated).toBe(false);
  });

  it('TC-REST-03: Vi phạm khi chuyển cấu hình sang ngưỡng 12.0h (21:00 -> 08:30 = 11.5h nghỉ)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '13:00', '21:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-13', '08:30', '17:00', false);
    const newShift = {
      workDate: '2026-10-13',
      startTime: '08:30',
      endTime: '17:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkRestTimeBetweenShifts(newShift, existing, 12.0);
    expect(result.isRestViolated).toBe(true);
    expect(result.actualRestHours).toBe(11.5);
  });

  it('TC-REST-04: Ca đêm Chủ Nhật tràn sang Thứ Hai vi phạm nghỉ (18/10 22:00 -> 19/10 08:00)', () => {
    // Sunday overnight shift ends Monday at 06:00
    const existing = [makeMockAssignment(1, '2026-10-18', '22:00', '06:00', true)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-19', '08:00', '17:00', false);
    const newShift = {
      workDate: '2026-10-19',
      startTime: '08:00',
      endTime: '17:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkRestTimeBetweenShifts(newShift, existing, 11.0);
    expect(result.isRestViolated).toBe(true);
    expect(result.actualRestHours).toBe(2.0);
  });
});
