import { api } from '@/shared/api/apiClient';
import type { EmployeeMonthlySchedule } from '@/types/domain.types';

export interface Employee {
  id: number;
  user_id?: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone_number: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  branch_id: number;
  position_id: number;
  manager_id?: number;
  employment_status: string;
  employment_type: string;
  hire_date: string;
  avatar_url?: string;
  resignation_date?: string;
  is_active: boolean;
  version?: number;
  secondary_branch_ids?: number[];
  secondary_branches?: Array<{
    branch_id: number;
    position_id: number;
    branch_name?: string;
    position_name?: string;
  }>;
}

export const employeeService = {
  async getEmployees(params?: { branch_id?: number; status?: string; search?: string; page?: number; size?: number }): Promise<Employee[]> {
    const query = new URLSearchParams();
    if (params?.branch_id) query.set('branch_id', params.branch_id.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('keyword', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.size) query.set('size', params.size.toString());

    return api.get<Employee[]>(`/employees?${query.toString()}`);
  },

  async getEmployeeById(id: number): Promise<Employee> {
    return api.get<Employee>(`/employees/${id}`);
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    return api.post<Employee>('/employees', employee);
  },

  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee> {
    return api.put<Employee>(`/employees/${id}`, employee);
  },

  async uploadAvatar(id: number, file: File): Promise<Employee> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Employee>(`/employees/${id}/avatar`, formData);
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    return api.post<void>(`/employees/${id}/reset-password`, { new_password: newPassword });
  },

  async deleteEmployee(id: number): Promise<void> {
    return api.delete<void>(`/employees/${id}`);
  },

  async getEmployeeMonthlySchedule(id: number, month?: string): Promise<EmployeeMonthlySchedule> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return api.get<EmployeeMonthlySchedule>(`/employees/${id}/shifts${query}`);
  },
};
