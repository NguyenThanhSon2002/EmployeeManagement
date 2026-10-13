import { create } from 'zustand';
import { format } from 'date-fns';
import type { AttendanceRecord, AttendanceCorrection } from '@/types/domain.types';
import { getMockAttendanceRecords, MOCK_ATTENDANCE_CORRECTIONS } from '@/data/mock/attendance.mock';

interface AttendanceState {
  records: AttendanceRecord[];
  corrections: AttendanceCorrection[];
  selectedDate: string; // YYYY-MM-DD
  departmentFilter: number | null;

  setSelectedDate: (date: string) => void;
  setDepartmentFilter: (deptId: number | null) => void;

  submitCorrection: (
    payload: Omit<AttendanceCorrection, 'id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'>
  ) => void;
  approveCorrection: (correctionId: number, reviewerId: number) => void;
  rejectCorrection: (correctionId: number, reviewerId: number, rejectionReason: string) => void;

  checkIn: (employeeId: number) => void;
  checkOut: (employeeId: number) => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const initialRecords = getMockAttendanceRecords(today);

  return {
    records: initialRecords,
    corrections: MOCK_ATTENDANCE_CORRECTIONS,
    selectedDate: todayStr,
    departmentFilter: null,

    setSelectedDate: (date) => set({ selectedDate: date }),
    setDepartmentFilter: (deptId) => set({ departmentFilter: deptId }),

    submitCorrection: (payload) => {
      const state = get();
      const newId = Date.now();
      const newCorrection: AttendanceCorrection = {
        ...payload,
        id: newId,
        status: 'PENDING',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      };
      set({ corrections: [newCorrection, ...state.corrections] });
    },

    approveCorrection: (correctionId, reviewerId) => {
      const state = get();
      const targetCorrection = state.corrections.find((c) => c.id === correctionId);
      if (!targetCorrection) return;

      const updatedCorrections = state.corrections.map((c) =>
        c.id === correctionId
          ? {
              ...c,
              status: 'APPROVED' as const,
              reviewedBy: reviewerId,
              reviewedAt: new Date().toISOString(),
            }
          : c
      );

      // Also update the corresponding attendance record
      const updatedRecords = state.records.map((r) => {
        if (r.id === targetCorrection.attendanceRecordId) {
          const checkInIso = `${r.workDate}T${targetCorrection.requestedCheckIn}`;
          const checkOutIso = `${r.workDate}T${targetCorrection.requestedCheckOut}`;
          
          // Recompute hours
          const inH = parseInt(targetCorrection.requestedCheckIn.split(':')[0], 10);
          const outH = parseInt(targetCorrection.requestedCheckOut.split(':')[0], 10);
          const actualHours = Math.max(0, outH - inH);

          return {
            ...r,
            checkInTime: checkInIso,
            checkOutTime: checkOutIso,
            actualHours: actualHours,
            status: 'CORRECTED' as const,
            isManuallyCorrected: true,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
          };
        }
        return r;
      });

      set({
        corrections: updatedCorrections,
        records: updatedRecords,
      });
    },

    rejectCorrection: (correctionId, reviewerId, rejectionReason) => {
      const state = get();
      set({
        corrections: state.corrections.map((c) =>
          c.id === correctionId
            ? {
                ...c,
                status: 'REJECTED' as const,
                reviewedBy: reviewerId,
                reviewedAt: new Date().toISOString(),
                rejectionReason,
              }
            : c
        ),
      });
    },

    checkIn: (employeeId) => {
      const state = get();
      const today = format(new Date(), 'yyyy-MM-dd');
      const nowTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss');

      const existingIndex = state.records.findIndex(
        (r) => r.employeeId === employeeId && r.workDate === today
      );

      if (existingIndex >= 0) {
        const updated = [...state.records];
        updated[existingIndex] = {
          ...updated[existingIndex],
          checkInTime: nowTime,
          status: 'PRESENT',
        };
        set({ records: updated });
      } else {
        const newRecord: AttendanceRecord = {
          id: Date.now(),
          employeeId,
          shiftAssignmentId: null,
          workDate: today,
          checkInTime: nowTime,
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
        };
        set({ records: [newRecord, ...state.records] });
      }
    },

    checkOut: (employeeId) => {
      const state = get();
      const today = format(new Date(), 'yyyy-MM-dd');
      const nowTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss');

      const updated = state.records.map((r) => {
        if (r.employeeId === employeeId && r.workDate === today) {
          return {
            ...r,
            checkOutTime: nowTime,
            actualHours: 8.0, // standard default
          };
        }
        return r;
      });
      set({ records: updated });
    },
  };
});
