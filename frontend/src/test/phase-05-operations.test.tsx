import { describe, it, expect, beforeEach } from 'vitest';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';

describe('Phase 05: Operational Features Integration Verification', () => {
  beforeEach(() => {
    useScheduleStore.getState().resetDemoData();
  });

  describe('TSK-D01: Shift Templates CRUD & Snapshot Isolation (SCR-10)', () => {
    it('creates a new shift template and makes it available', () => {
      const initialCount = useScheduleStore.getState().shiftTemplates.length;
      
      useScheduleStore.getState().addShiftTemplate({
        shiftCode: 'CA-TOI',
        shiftName: 'Ca Tối Tăng Cường',
        startTime: '18:00',
        endTime: '23:00',
        breakMinutes: 30,
        isCrossMidnight: false,
        colorCode: '#FFF0F6',
        textColor: '#C41D7F',
        minStaffing: 1,
        maxStaffing: 3,
        applicableDays: '1,2,3,4,5,6,7',
        isActive: true,
      });

      const templates = useScheduleStore.getState().shiftTemplates;
      expect(templates.length).toBe(initialCount + 1);
      const added = templates.find((t) => t.shiftCode === 'CA-TOI');
      expect(added).toBeDefined();
      expect(added?.shiftName).toBe('Ca Tối Tăng Cường');
    });

    it('protects past assignments snapshots when a shift template is modified (Snapshot Isolation)', () => {
      // 1. Assign CA-SANG to an employee
      const mondayStr = useScheduleStore.getState().currentStartDate;
      const assignRes = useScheduleStore.getState().assignShift({
        employeeId: 1,
        workShiftId: 1, // CA-SANG: 08:00 - 17:00
        workDate: mondayStr,
        actorRole: 'ROLE_ADMIN',
      });
      expect(assignRes.success).toBe(true);

      const assignmentKey = `1_${mondayStr}`;
      const savedAssignment = useScheduleStore.getState().assignments[assignmentKey];
      expect(savedAssignment.snapshotStartTime).toBe('08:00');
      expect(savedAssignment.snapshotShiftName).toBe('Ca Sáng Tiêu Chuẩn');

      // 2. Modify template CA-SANG to start at 08:30
      useScheduleStore.getState().updateShiftTemplate(1, {
        shiftName: 'Ca Sáng Mới (08:30)',
        startTime: '08:30',
      });

      // 3. Verify template is modified
      const modifiedTemplate = useScheduleStore.getState().shiftTemplates.find((t) => t.id === 1);
      expect(modifiedTemplate?.startTime).toBe('08:30');

      // 4. Verify existing assignment STILL preserves original snapshot (08:00)
      const unchangedAssignment = useScheduleStore.getState().assignments[assignmentKey];
      expect(unchangedAssignment.snapshotStartTime).toBe('08:00');
      expect(unchangedAssignment.snapshotShiftName).toBe('Ca Sáng Tiêu Chuẩn');
    });
  });

  describe('TSK-D04: Leave Management & Cross-Feature Sync to Schedule (SCR-13, SCR-14)', () => {
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

  describe('TSK-D02 & TSK-D03: Attendance Tracking & Correction Flow (SCR-08, SCR-09)', () => {
    it('processes web check-in and updates status to PRESENT', () => {
      useAttendanceStore.getState().checkIn(10);
      const todayStr = useAttendanceStore.getState().selectedDate;
      const record = useAttendanceStore.getState().records.find(
        (r) => r.employeeId === 10 && r.workDate === todayStr
      );
      expect(record).toBeDefined();
      expect(record?.status).toBe('PRESENT');
      expect(record?.checkInTime).toBeDefined();
    });

    it('submits and approves an attendance correction, updating actual hours', () => {
      // Find correction ID 6001 from mock data
      const pending = useAttendanceStore.getState().corrections.find((c) => c.status === 'PENDING');
      expect(pending).toBeDefined();

      const recordBefore = useAttendanceStore.getState().records.find(
        (r) => r.id === pending!.attendanceRecordId
      );
      expect(recordBefore?.status).toBe('MISSING_CHECKOUT');

      // Manager approves correction
      useAttendanceStore.getState().approveCorrection(pending!.id, 999);

      // Verify correction status
      const updatedCorrection = useAttendanceStore.getState().corrections.find((c) => c.id === pending!.id);
      expect(updatedCorrection?.status).toBe('APPROVED');

      // Verify attendance record updated
      const recordAfter = useAttendanceStore.getState().records.find(
        (r) => r.id === pending!.attendanceRecordId
      );
      expect(recordAfter?.status).toBe('CORRECTED');
      expect(recordAfter?.isManuallyCorrected).toBe(true);
      expect(recordAfter?.checkOutTime).toContain('17:00:00');
      expect(recordAfter?.actualHours).toBe(9); // 17 - 8 = 9h
    });
  });
});
