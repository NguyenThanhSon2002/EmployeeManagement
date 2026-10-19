import { api } from '@/shared/api/apiClient';
import type { Branch } from '@/types/domain.types';

export const branchService = {
  async getAllBranches(): Promise<Branch[]> {
    return api.get<Branch[]>('/branches');
  },

  async getBranchById(id: number): Promise<Branch> {
    return api.get<Branch>(`/branches/${id}`);
  },
};
