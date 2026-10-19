import { api } from '@/shared/api/apiClient';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  shift_assignment_id?: number;
  work_date: string;
  check_in_time?: string;
  check_out_time?: string;
  actual_hours: number;
  regular_hours: number;
  overtime_hours: number;
  night_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  status: string;
  source: string;
  is_manually_corrected: boolean;
}

export const attendanceService = {
  async checkIn(note?: string, workDate?: string): Promise<AttendanceRecord> {
    return api.post<AttendanceRecord>('/attendance/check-in', { note, work_date: workDate });
  },

  async checkOut(note?: string, workDate?: string): Promise<AttendanceRecord> {
    return api.post<AttendanceRecord>('/attendance/check-out', { note, work_date: workDate });
  },

  async getRecords(params?: { employee_id?: number; branch_id?: number; work_date?: string; status?: string; page?: number; size?: number }): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.employee_id) query.set('employee_id', params.employee_id.toString());
    if (params?.branch_id) query.set('branch_id', params.branch_id.toString());
    if (params?.work_date) query.set('work_date', params.work_date);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.size) query.set('size', params.size.toString());

    return api.get<AttendanceRecord[]>(`/attendance/records?${query.toString()}`);
  },

  async submitCorrection(data: {
    attendance_record_id: number;
    requested_check_in: string;
    requested_check_out: string;
    reason: string;
    attachment_url?: string;
  }): Promise<unknown> {
    return api.post('/attendance/corrections', data);
  },

  async reviewCorrection(id: number, data: { action: 'APPROVE' | 'REJECT'; rejection_reason?: string }): Promise<unknown> {
    return api.put(`/attendance/corrections/${id}/review`, data);
  },
};
