import { format, subDays } from 'date-fns';
import type { AttendanceRecord, AttendanceCorrection } from '@/types/domain.types';

export function getMockAttendanceRecords(today: Date): AttendanceRecord[] {
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  return [
    {
      id: 5001,
      employeeId: 1, // Nguyễn Văn An
      shiftAssignmentId: 1001,
      workDate: todayStr,
      checkInTime: `${todayStr}T07:55:12`,
      checkOutTime: null,
      actualHours: 0,
      regularHours: 8.0,
      overtimeHours: 0,
      nightHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      status: 'PRESENT',
      source: 'WEB_PORTAL',
      isManuallyCorrected: false,
    },
    {
      id: 5002,
      employeeId: 3, // Lê Văn Cường - Missing checkout
      shiftAssignmentId: 1002,
      workDate: yesterdayStr,
      checkInTime: `${yesterdayStr}T08:02:00`,
      checkOutTime: null,
      actualHours: 0,
      regularHours: 8.0,
      overtimeHours: 0,
      nightHours: 0,
      lateMinutes: 2,
      earlyLeaveMinutes: 0,
      status: 'MISSING_CHECKOUT',
      source: 'WEB_PORTAL',
      isManuallyCorrected: false,
    },
    {
      id: 5003,
      employeeId: 4, // Phạm Văn Dũng - Late 15m
      shiftAssignmentId: 1003,
      workDate: yesterdayStr,
      checkInTime: `${yesterdayStr}T08:15:30`,
      checkOutTime: `${yesterdayStr}T17:05:10`,
      actualHours: 8.0,
      regularHours: 8.0,
      overtimeHours: 0,
      nightHours: 0,
      lateMinutes: 15,
      earlyLeaveMinutes: 0,
      status: 'LATE',
      source: 'WEB_PORTAL',
      isManuallyCorrected: false,
    },
  ];
}

export const MOCK_ATTENDANCE_CORRECTIONS: AttendanceCorrection[] = [
  {
    id: 6001,
    attendanceRecordId: 5002,
    employeeId: 3,
    originalCheckIn: '08:02:00',
    originalCheckOut: null,
    requestedCheckIn: '08:00:00',
    requestedCheckOut: '17:00:00',
    reason: 'Máy tính bị sập nguồn cuối giờ, không bấm check-out được',
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
];
