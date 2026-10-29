import type { ScheduleConflict } from '@/types/domain.types';

export type SwapType = 'SWAP' | 'HANDOVER';

export type SwapStatus =
  | 'PENDING_PEER'
  | 'PEER_ACCEPTED'
  | 'PEER_REJECTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ShiftSwapItem {
  id: number;
  requestCode: string;
  branchId: number;
  branchName: string;

  requesterId: number;
  requesterCode: string;
  requesterName: string;
  requesterAssignmentId: number;
  requesterShiftName: string;
  requesterWorkDate: string;
  requesterStartTime: string;
  requesterEndTime: string;

  targetId: number;
  targetCode: string;
  targetName: string;
  targetAssignmentId?: number | null;
  targetShiftName?: string | null;
  targetWorkDate?: string | null;
  targetStartTime?: string | null;
  targetEndTime?: string | null;

  type: SwapType;
  reason: string;
  status: SwapStatus;
  peerNote?: string | null;
  peerRespondedAt?: string | null;
  managerId?: number | null;
  managerName?: string | null;
  managerNote?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface CreateSwapPayload {
  requesterAssignmentId: number;
  targetEmployeeId: number;
  targetAssignmentId?: number | null;
  type: SwapType;
  reason: string;
}

export interface SimulateSwapPayload {
  requesterAssignmentId: number;
  targetEmployeeId: number;
  targetAssignmentId?: number | null;
  type: SwapType;
}

export interface SimulateSwapResult {
  valid: boolean;
  hasError: boolean;
  hasWarning: boolean;
  isServerError?: boolean;
  requesterConflicts: ScheduleConflict[];
  targetConflicts: ScheduleConflict[];
  message: string;
}
