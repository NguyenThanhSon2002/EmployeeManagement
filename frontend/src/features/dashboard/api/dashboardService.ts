import { api } from '@/shared/api/apiClient';

export interface DashboardOverview {
  total_employees: number;
  present_count: number;
  late_count: number;
  on_leave_count: number;
  active_contract_rate: number;
  attendance_rate: number;
}

export interface PendingApprovalItem {
  id: number;
  type: 'LEAVE' | 'ATTENDANCE_CORRECTION';
  employee_id: number;
  employee_code: string;
  employee_name: string;
  title: string;
  reason: string;
  date_str: string;
  created_at: string;
}

export interface AttendanceTrendItem {
  date: string;
  day_name: string;
  on_time_percent: number;
  late_percent: number;
  absent_percent: number;
}

export const dashboardService = {
  async getOverview(branchId?: number): Promise<DashboardOverview> {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return api.get<DashboardOverview>(`/dashboard/overview${query}`);
  },

  async getPendingApprovals(branchId?: number): Promise<PendingApprovalItem[]> {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return api.get<PendingApprovalItem[]>(`/dashboard/pending-approvals${query}`);
  },

  async getAttendanceTrends(branchId?: number): Promise<AttendanceTrendItem[]> {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return api.get<AttendanceTrendItem[]>(`/dashboard/attendance-trends${query}`);
  },
};
