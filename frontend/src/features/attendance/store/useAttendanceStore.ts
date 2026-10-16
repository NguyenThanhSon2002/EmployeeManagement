import { create } from 'zustand';
import { format } from 'date-fns';
import type { AttendanceRecord, AttendanceCorrection } from '@/types/domain.types';
import { attendanceService } from '../api/attendanceService';
import { isMockEnabled } from '@/config/env.config';

interface AttendanceState {
  records: AttendanceRecord[];
  corrections: AttendanceCorrection[];
  selectedDate: string; // YYYY-MM-DD
  departmentFilter: number | null;

  fetchRecords: (workDate?: string, departmentId?: number) => Promise<void>;
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

  return {
    records: [],
    corrections: [],
    selectedDate: todayStr,
    departmentFilter: null,

    fetchRecords: async (date?: string, departmentId?: number) => {
      if (isMockEnabled()) return;
      try {
        const data = await attendanceService.getRecords({ work_date: date, department_id: departmentId });
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: AttendanceRecord[] = data.map((d: any) => ({
            id: d.id,
            employeeId: d.employee_id || d.employeeId,
            shiftAssignmentId: d.shift_assignment_id || d.shiftAssignmentId || null,
            workDate: d.work_date || d.workDate,
            checkInTime: d.check_in_time || d.checkInTime || null,
            checkOutTime: d.check_out_time || d.checkOutTime || null,
            actualHours: d.actual_hours !== undefined ? d.actual_hours : 0,
            regularHours: d.regular_hours !== undefined ? d.regular_hours : 8,
            overtimeHours: d.overtime_hours !== undefined ? d.overtime_hours : 0,
            nightHours: d.night_hours !== undefined ? d.night_hours : 0,
            lateMinutes: d.late_minutes !== undefined ? d.late_minutes : 0,
            earlyLeaveMinutes: d.early_leave_minutes !== undefined ? d.early_leave_minutes : 0,
            status: d.status || 'PRESENT',
            source: d.source || 'WEB_PORTAL',
            isManuallyCorrected: d.is_manually_corrected || false,
          }));
          set({ records: mapped });
        }
      } catch (err) {
        console.warn('Could not fetch attendance records from backend:', err);
      }
    },

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

      if (!isMockEnabled()) {
        attendanceService.checkIn('Điểm danh vào ca qua Web', today)
          .then((saved) => {
            if (saved && saved.id) {
              set((curr) => ({
                records: curr.records.map((r) =>
                  r.employeeId === employeeId && r.workDate === today
                    ? {
                        ...r,
                        id: saved.id,
                        checkInTime: saved.check_in_time || r.checkInTime,
                        status: (saved.status as any) || r.status,
                      }
                    : r
                ),
              }));
            }
          })
          .catch((err) => {
            console.warn('Backend check-in sync failed:', err);
          });
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

      if (!isMockEnabled()) {
        attendanceService.checkOut('Điểm danh tan ca qua Web', today)
          .then((saved) => {
            if (saved && saved.id) {
              set((curr) => ({
                records: curr.records.map((r) =>
                  r.employeeId === employeeId && r.workDate === today
                    ? {
                        ...r,
                        id: saved.id,
                        checkOutTime: saved.check_out_time || r.checkOutTime,
                        actualHours: saved.actual_hours !== undefined ? saved.actual_hours : r.actualHours,
                        overtimeHours: saved.overtime_hours !== undefined ? saved.overtime_hours : r.overtimeHours,
                        nightHours: saved.night_hours !== undefined ? saved.night_hours : r.nightHours,
                        status: (saved.status as any) || r.status,
                      }
                    : r
                ),
              }));
            }
          })
          .catch((err) => {
            console.warn('Backend check-out sync failed:', err);
          });
      }
    },
  };
});
