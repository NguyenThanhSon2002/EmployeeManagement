import { api } from './apiClient';

export interface LeaveType {
  id: number;
  type_code: string;
  type_name: string;
  is_paid: boolean;
  requires_attachment: boolean;
  is_active: boolean;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  carried_over_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  tier1_reviewed_by?: number;
  tier1_reviewed_at?: string;
  rejection_reason?: string;
}

export const leaveService = {
  async getLeaveTypes(): Promise<LeaveType[]> {
    return api.get<LeaveType[]>('/leaves/types');
  },

  async getLeaveBalances(employeeId?: number, year?: number): Promise<LeaveBalance[]> {
    const query = new URLSearchParams();
    if (employeeId) query.set('employee_id', employeeId.toString());
    if (year) query.set('year', year.toString());
    return api.get<LeaveBalance[]>(`/leaves/balances?${query.toString()}`);
  },

  async submitLeaveRequest(data: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    attachment_url?: string;
  }): Promise<LeaveRequest> {
    return api.post<LeaveRequest>('/leaves/requests', data);
  },

  async getLeaveRequests(employeeId?: number, page?: number, size?: number): Promise<LeaveRequest[]> {
    const query = new URLSearchParams();
    if (employeeId) query.set('employee_id', employeeId.toString());
    if (page) query.set('page', page.toString());
    if (size) query.set('size', size.toString());
    return api.get<LeaveRequest[]>(`/leaves/requests?${query.toString()}`);
  },

  async reviewLeaveRequest(id: number, action: 'APPROVE' | 'REJECT', rejectionReason?: string): Promise<LeaveRequest> {
    return api.put<LeaveRequest>(`/leaves/requests/${id}/review`, {
      action,
      rejection_reason: rejectionReason,
    });
  },
};
