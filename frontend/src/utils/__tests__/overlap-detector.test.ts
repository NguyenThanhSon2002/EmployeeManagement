import { describe, it, expect } from 'vitest';
import type { ShiftAssignment } from '@/types/domain.types';
import { checkShiftOverlap, getShiftAbsoluteTimeRange } from '../conflict-detector.utils';

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
    snapshotShiftName: 'Test Shift',
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

describe('Suite 2: Shift Overlap Detection (overlap-detector.utils)', () => {
  it('TC-OVERLAP-01: Trùng nhau hoàn toàn (08:00 - 17:00 vs 08:00 - 17:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '08:00', '17:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-12', '08:00', '17:00', false);
    const newShift = {
      workDate: '2026-10-12',
      startTime: '08:00',
      endTime: '17:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(true);
  });

  it('TC-OVERLAP-02: Ca mới nằm lọt trong ca cũ (10:00 - 14:00 inside 08:00 - 17:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '08:00', '17:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-12', '10:00', '14:00', false);
    const newShift = {
      workDate: '2026-10-12',
      startTime: '10:00',
      endTime: '14:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(true);
  });

  it('TC-OVERLAP-03: Ca mới giao thoa phần đuôi ca cũ (08:00 - 16:00 vs 14:00 - 22:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '08:00', '16:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-12', '14:00', '22:00', false);
    const newShift = {
      workDate: '2026-10-12',
      startTime: '14:00',
      endTime: '22:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(true);
  });

  it('TC-OVERLAP-04: Hai ca tiếp giáp sát giờ (06:00 - 14:00 và 14:00 - 22:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '06:00', '14:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-12', '14:00', '22:00', false);
    const newShift = {
      workDate: '2026-10-12',
      startTime: '14:00',
      endTime: '22:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(false);
  });

  it('TC-OVERLAP-05: Hai ca tách rời hoàn toàn (06:00 - 12:00 và 16:00 - 22:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '06:00', '12:00', false)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-12', '16:00', '22:00', false);
    const newShift = {
      workDate: '2026-10-12',
      startTime: '16:00',
      endTime: '22:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(false);
  });

  it('TC-OVERLAP-06: Ca đêm giao thoa với ca sáng hôm sau (12/10 22:00 - 13/10 06:00 vs 13/10 05:00 - 13:00)', () => {
    const existing = [makeMockAssignment(1, '2026-10-12', '22:00', '06:00', true)];
    const { startMs, endMs } = getShiftAbsoluteTimeRange('2026-10-13', '05:00', '13:00', false);
    const newShift = {
      workDate: '2026-10-13',
      startTime: '05:00',
      endTime: '13:00',
      isCrossMidnight: false,
      startMs,
      endMs,
    };

    const result = checkShiftOverlap(newShift, existing);
    expect(result.hasOverlap).toBe(true);
  });
});
