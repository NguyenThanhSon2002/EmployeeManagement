import { api } from '@/shared/api/apiClient';

export interface AttendanceSummary {
  employee_id: number;
  employee_code: string;
  full_name: string;
  department_name: string;
  total_working_days: number;
  total_actual_hours: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_night_hours: number;
  late_count: number;
  early_leave_count: number;
}

export const reportService = {
  async getAttendanceSummary(departmentId?: number, year?: number, month?: number): Promise<AttendanceSummary[]> {
    const query = new URLSearchParams();
    if (departmentId) query.set('department_id', departmentId.toString());
    if (year) query.set('year', year.toString());
    if (month) query.set('month', month.toString());

    return api.get<AttendanceSummary[]>(`/reports/attendance-summary?${query.toString()}`);
  },

  async downloadExcel(departmentId?: number, year?: number, month?: number): Promise<void> {
    const query = new URLSearchParams();
    if (departmentId) query.set('department_id', departmentId.toString());
    if (year) query.set('year', year.toString());
    if (month) query.set('month', month.toString());

    const blob = await api.get<Blob>(`/reports/export/excel?${query.toString()}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Cham_Cong_${month || new Date().getMonth() + 1}_${year || new Date().getFullYear()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadCsv(departmentId?: number, year?: number, month?: number): Promise<void> {
    const query = new URLSearchParams();
    if (departmentId) query.set('department_id', departmentId.toString());
    if (year) query.set('year', year.toString());
    if (month) query.set('month', month.toString());

    const blob = await api.get<Blob>(`/reports/export/csv?${query.toString()}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Cham_Cong_${month || new Date().getMonth() + 1}_${year || new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
