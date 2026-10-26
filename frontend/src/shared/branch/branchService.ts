import { api } from '@/shared/api/apiClient';
import type { Branch } from '@/types/domain.types';

const toBranch = (raw: any): Branch =>
    ({
      ...raw,
      id: raw.id,
      branchCode: raw.branchCode ?? raw.branch_code,
      branchName: raw.branchName ?? raw.branch_name,
      address: raw.address,
      phoneNumber: raw.phoneNumber ?? raw.phone_number,
      openedDate: raw.openedDate ?? raw.opened_date,
      managerId: raw.managerId ?? raw.manager_id,
      isActive: raw.isActive ?? raw.is_active,
      version: raw.version,
    }) as Branch;

export const branchService = {
  async getAllBranches(): Promise<Branch[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = await api.get<any[]>('/branches');
    return list.map(toBranch);
  },

  async getBranchById(id: number): Promise<Branch> {
    return toBranch(await api.get(`/branches/${id}`));
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    return toBranch(
        await api.post('/branches', {
          branch_code: data.branchCode,
          branch_name: data.branchName,
          address: data.address,
          phone_number: data.phoneNumber,
          opened_date: data.openedDate || data.opened_date,
          manager_id: data.managerId,
          is_active: data.isActive ?? true,
        })
    );
  },

  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    return toBranch(
        await api.put(`/branches/${id}`, {
          branch_code: data.branchCode,
          branch_name: data.branchName,
          address: data.address,
          phone_number: data.phoneNumber,
          opened_date: data.openedDate || data.opened_date,
          manager_id: data.managerId,
          is_active: data.isActive,
        })
    );
  },

  async deleteBranch(id: number): Promise<void> {
    return api.delete<void>(`/branches/${id}`);
  },
};