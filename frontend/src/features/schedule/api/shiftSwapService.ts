import { api } from '@/shared/api/apiClient';
import type {
  ShiftSwapItem,
  CreateSwapPayload,
  SimulateSwapPayload,
  SimulateSwapResult,
} from '../types/swap.types';

export const shiftSwapService = {
  simulateSwap: async (payload: SimulateSwapPayload): Promise<SimulateSwapResult> => {
    return api.post<SimulateSwapResult>('/shift-swaps/simulate', payload);
  },

  createSwapRequest: async (payload: CreateSwapPayload): Promise<ShiftSwapItem> => {
    return api.post<ShiftSwapItem>('/shift-swaps', payload);
  },

  peerRespond: async (
    swapId: number,
    action: 'ACCEPT' | 'REJECT',
    peerNote?: string
  ): Promise<ShiftSwapItem> => {
    return api.put<ShiftSwapItem>(`/shift-swaps/${swapId}/peer-respond`, {
      action,
      peerNote,
    });
  },

  managerReview: async (
    swapId: number,
    action: 'APPROVE' | 'REJECT',
    managerNote?: string
  ): Promise<ShiftSwapItem> => {
    return api.put<ShiftSwapItem>(`/shift-swaps/${swapId}/manager-review`, {
      action,
      managerNote,
    });
  },

  cancelRequest: async (swapId: number): Promise<ShiftSwapItem> => {
    return api.delete<ShiftSwapItem>(`/shift-swaps/${swapId}`);
  },

  getMyRequests: async (): Promise<ShiftSwapItem[]> => {
    return api.get<ShiftSwapItem[]>('/shift-swaps/my-requests');
  },

  getPendingManagerRequests: async (branchId: number): Promise<ShiftSwapItem[]> => {
    return api.get<ShiftSwapItem[]>(`/shift-swaps/pending-manager?branchId=${branchId}`);
  },

  getAllBranchRequests: async (branchId: number): Promise<ShiftSwapItem[]> => {
    return api.get<ShiftSwapItem[]>(`/shift-swaps/branch-history?branchId=${branchId}`);
  },
};
