import { api } from '@/shared/api/apiClient';
import type {
  SalaryContract,
  PayrollSummary,
  PayrollDetail,
  PayrollItem,
  MyPayslip,
  UpdatePayrollItemPayload,
} from '../types/payroll.types';

export const payrollService = {
  async generatePayroll(data: {
    branch_id?: number | null;
    month: number;
    year: number;
  }): Promise<PayrollDetail> {
    return api.post<PayrollDetail>('/payrolls/generate', data);
  },

  async getPayrolls(params?: {
    year?: number;
    branch_id?: number;
  }): Promise<PayrollSummary[]> {
    const query = new URLSearchParams();
    if (params?.year) query.set('year', String(params.year));
    if (params?.branch_id) query.set('branch_id', String(params.branch_id));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<PayrollSummary[]>(`/payrolls${qs}`);
  },

  async getPayrollById(id: number): Promise<PayrollDetail> {
    return api.get<PayrollDetail>(`/payrolls/${id}`);
  },

  async approvePayroll(id: number): Promise<PayrollSummary> {
    return api.post<PayrollSummary>(`/payrolls/${id}/approve`, {});
  },

  async reopenPayroll(id: number): Promise<PayrollSummary> {
    return api.post<PayrollSummary>(`/payrolls/${id}/reopen`, {});
  },

  async getMyPayslip(month: number, year: number): Promise<MyPayslip> {
    return api.get<MyPayslip>(`/payrolls/my-payslip?month=${month}&year=${year}`);
  },

  async getSalaryContract(employeeId: number): Promise<SalaryContract | null> {
    return api.get<SalaryContract>(`/salary-contracts/employee/${employeeId}`);
  },

  async saveSalaryContract(data: Partial<SalaryContract>): Promise<SalaryContract> {
    return api.post<SalaryContract>('/salary-contracts', data);
  },

  async updatePayrollItem(itemId: number, payload: UpdatePayrollItemPayload): Promise<PayrollItem> {
    return api.put<PayrollItem>(`/payrolls/items/${itemId}`, payload);
  },
};
