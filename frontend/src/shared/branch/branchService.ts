import { api } from '@/shared/api/apiClient';
import type { Branch } from '@/types/domain.types';

export const branchService = {
  async getAllBranches(): Promise<Branch[]> {
    return api.get<Branch[]>('/branches');
  },

  async getBranchById(id: number): Promise<Branch> {
    return api.get<Branch>(`/branches/${id}`);
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    return api.post<Branch>('/branches', {
      branchCode: data.branchCode,
      branchName: data.branchName,
      address: data.address,
      phoneNumber: data.phoneNumber,
      managerId: data.managerId,
      isActive: data.isActive ?? true,
    });
  },

  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    return api.put<Branch>(`/branches/${id}`, {
      branchName: data.branchName,
      address: data.address,
      phoneNumber: data.phoneNumber,
      managerId: data.managerId,
      isActive: data.isActive,
    });
  },

  async deleteBranch(id: number): Promise<void> {
    return api.delete<void>(`/branches/${id}`);
  },
};
