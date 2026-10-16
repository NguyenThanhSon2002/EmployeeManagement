import { describe, it, expect, beforeEach } from 'vitest';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { useLeaveStore } from '@/features/leaves/store/useLeaveStore';

describe('TSK-D04: Leave Management & Cross-Feature Sync to Schedule (SCR-13, SCR-14)', () => {
  beforeEach(() => {
    useScheduleStore.getState().resetDemoData();
  });

  it('blocks overlapping leave requests for the same employee (BR-009)', () => {
    const employeeId = 5;
    const submit1 = useLeaveStore.getState().submitLeave({
      employeeId,
      leaveTypeId: 1,
      leaveTypeName: 'Nghỉ phép năm',
      startDate: '2026-10-20',
      endDate: '2026-10-22',
      totalDays: 3,
      reason: 'Nghỉ phép đợt 1',
    });
    expect(submit1.success).toBe(true);

    // Attempt overlapping leave: 2026-10-21 to 2026-10-23
    const submit2 = useLeaveStore.getState().submitLeave({
      employeeId,
      leaveTypeId: 1,
      leaveTypeName: 'Nghỉ phép năm',
      startDate: '2026-10-21',
      endDate: '2026-10-23',
      totalDays: 3,
      reason: 'Nghỉ phép đợt 2 (trùng)',
    });
    expect(submit2.success).toBe(false);
    expect(submit2.error).toContain('BR-009');
  });

  it('synchronizes approved leave to useScheduleStore.approvedLeaves', () => {
    const employeeId = 4;
    const submitRes = useLeaveStore.getState().submitLeave({
      employeeId,
      leaveTypeId: 1,
      leaveTypeName: 'Nghỉ phép năm',
      startDate: '2026-10-28',
      endDate: '2026-10-28',
      totalDays: 1,
      reason: 'Khám sức khỏe định kỳ',
    });
    expect(submitRes.success).toBe(true);

    const targetLeave = useLeaveStore.getState().leaves.find(
      (l) => l.employeeId === employeeId && l.startDate === '2026-10-28'
    );
    expect(targetLeave).toBeDefined();

    // Approve the leave
    useLeaveStore.getState().approveLeave(targetLeave!.id, 100);

    // Verify leave status in leaveStore
    const approvedInLeaveStore = useLeaveStore.getState().leaves.find((l) => l.id === targetLeave!.id);
    expect(approvedInLeaveStore?.status).toBe('APPROVED');

    // Verify sync in useScheduleStore!
    const syncInScheduleStore = useScheduleStore.getState().approvedLeaves.find(
      (l) => l.id === targetLeave!.id
    );
    expect(syncInScheduleStore).toBeDefined();
    expect(syncInScheduleStore?.status).toBe('APPROVED');
  });
});
