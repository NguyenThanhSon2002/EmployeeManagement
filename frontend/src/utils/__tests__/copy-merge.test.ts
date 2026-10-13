import { describe, it, expect } from 'vitest';
import type { ShiftAssignment, LeaveRequest } from '@/types/domain.types';
import { copyScheduleWeek } from '../copy-merge.utils';

function makeSimpleShift(id: number, employeeId: number, workDate: string): ShiftAssignment {
  return {
    id,
    scheduleId: 1,
    employeeId,
    workShiftId: 1,
    workDate,
    snapshotShiftName: 'Shift Standard',
    snapshotStartTime: '08:00',
    snapshotEndTime: '17:00',
    snapshotBreakMinutes: 60,
    snapshotCrossMidnight: false,
    snapshotColorCode: '#1677FF',
    plannedStartTime: `${workDate}T08:00:00Z`,
    plannedEndTime: `${workDate}T17:00:00Z`,
    status: 'ASSIGNED',
    overrideRule: null,
    overrideReason: null,
    version: 1,
  };
}

describe('Suite 4: Copy-Week Merge Algorithm (copy-merge.test.ts)', () => {
  it('TC-COPY-01: Tuần đích hoàn toàn trống (100 ca nguồn -> 0 ca đích, SKIP_OCCUPIED)', () => {
    // Generate 100 shifts in source week
    const source: ShiftAssignment[] = [];
    for (let i = 1; i <= 100; i++) {
      source.push(makeSimpleShift(i, i, '2026-10-12'));
    }

    const result = copyScheduleWeek({
      sourceAssignments: source,
      targetAssignments: [],
      mode: 'SKIP_OCCUPIED',
      newScheduleId: 2,
    });

    expect(result.copiedCount).toBe(100);
    expect(result.skippedCount).toBe(0);
    expect(result.mergedAssignments.length).toBe(100);
  });

  it('TC-COPY-02: Tuần đích đã có ca và chọn Skip (100 nguồn, 20 đích với 15 ô trùng)', () => {
    // 100 source shifts on 2026-10-12
    const source: ShiftAssignment[] = [];
    for (let i = 1; i <= 100; i++) {
      source.push(makeSimpleShift(i, i, '2026-10-12'));
    }

    // Target week on 2026-10-19:
    // 15 shifts for emp 1..15 (overlapping with source + 7 days)
    // 5 shifts for emp 101..105 (distinct from source)
    const target: ShiftAssignment[] = [];
    for (let i = 1; i <= 15; i++) {
      target.push(makeSimpleShift(1000 + i, i, '2026-10-19'));
    }
    for (let i = 101; i <= 105; i++) {
      target.push(makeSimpleShift(2000 + i, i, '2026-10-19'));
    }

    const result = copyScheduleWeek({
      sourceAssignments: source,
      targetAssignments: target,
      mode: 'SKIP_OCCUPIED',
      newScheduleId: 2,
    });

    // 15 were already occupied, so 100 - 15 = 85 copied
    expect(result.copiedCount).toBe(85);
    expect(result.skippedCount).toBe(15);
    // Total merged: 20 existing + 85 copied = 105
    expect(result.mergedAssignments.length).toBe(105);
  });

  it('TC-COPY-03: Tuần đích đã có ca và chọn Replace (100 nguồn, 20 đích)', () => {
    const source: ShiftAssignment[] = [];
    for (let i = 1; i <= 100; i++) {
      source.push(makeSimpleShift(i, i, '2026-10-12'));
    }

    const target: ShiftAssignment[] = [];
    for (let i = 1; i <= 20; i++) {
      target.push(makeSimpleShift(1000 + i, i, '2026-10-19'));
    }

    const result = copyScheduleWeek({
      sourceAssignments: source,
      targetAssignments: target,
      mode: 'REPLACE_ALL',
      newScheduleId: 2,
    });

    expect(result.copiedCount).toBe(100);
    expect(result.skippedCount).toBe(0);
    expect(result.mergedAssignments.length).toBe(100);
  });

  it('TC-COPY-04: Tuần đích có Đơn nghỉ phép đã duyệt được bảo vệ không bị ghi đè', () => {
    // 100 source shifts
    const source: ShiftAssignment[] = [];
    for (let i = 1; i <= 100; i++) {
      source.push(makeSimpleShift(i, i, '2026-10-12'));
    }

    // 5 approved leave requests in target week for employees 1..5
    const targetLeaves: LeaveRequest[] = [];
    for (let i = 1; i <= 5; i++) {
      targetLeaves.push({
        id: i,
        employeeId: i,
        leaveTypeId: 1,
        leaveTypeName: 'Nghỉ phép năm',
        startDate: '2026-10-19',
        endDate: '2026-10-19',
        totalDays: 1,
        reason: 'Việc gia đình',
        status: 'APPROVED',
        tier1ReviewedBy: 1,
        tier2ReviewedBy: null,
      });
    }

    const result = copyScheduleWeek({
      sourceAssignments: source,
      targetAssignments: [],
      targetLeaves,
      mode: 'REPLACE_ALL',
      newScheduleId: 2,
    });

    // 5 assignments overlapping approved leaves were skipped
    expect(result.copiedCount).toBe(95);
    expect(result.skippedCount).toBe(5);
  });
});
