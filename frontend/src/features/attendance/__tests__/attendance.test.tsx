import { describe, it, expect } from 'vitest';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';

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
