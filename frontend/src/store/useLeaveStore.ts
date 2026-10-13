import { create } from 'zustand';
import type { LeaveRequest } from '@/types/domain.types';
import { getMockLeaves } from '@/data/mock/leaves.mock';
import { useScheduleStore } from './useScheduleStore';

interface LeaveBalance {
  annualQuota: number;
  usedDays: number;
}

interface LeaveState {
  leaves: LeaveRequest[];
  balances: Record<number, LeaveBalance>;

  submitLeave: (
    payload: Omit<LeaveRequest, 'id' | 'status' | 'tier1ReviewedBy' | 'tier2ReviewedBy'>
  ) => { success: boolean; error?: string };

  approveLeave: (leaveId: number, reviewerId: number) => void;
  rejectLeave: (leaveId: number, reviewerId: number, rejectionReason?: string) => void;
  cancelLeave: (leaveId: number) => void;
  getBalance: (employeeId: number) => { annualQuota: number; usedDays: number; remainingDays: number };
}

export const useLeaveStore = create<LeaveState>((set, get) => {
  // Use today's date anchor
  const initialLeaves = getMockLeaves(new Date());

  // Default quota is 12 days per year
  const initialBalances: Record<number, LeaveBalance> = {
    1: { annualQuota: 12, usedDays: 2 },
    2: { annualQuota: 12, usedDays: 3.5 },
    3: { annualQuota: 12, usedDays: 1 },
    4: { annualQuota: 12, usedDays: 4 },
    5: { annualQuota: 12, usedDays: 2 },
    7: { annualQuota: 12, usedDays: 1 },
  };

  return {
    leaves: initialLeaves,
    balances: initialBalances,

    getBalance: (employeeId: number) => {
      const state = get();
      const b = state.balances[employeeId] || { annualQuota: 12, usedDays: 0 };
      return {
        annualQuota: b.annualQuota,
        usedDays: b.usedDays,
        remainingDays: Math.max(0, b.annualQuota - b.usedDays),
      };
    },

    submitLeave: (payload) => {
      const state = get();
      
      // Rule BR-009: Prevent overlapping leaves for the same employee
      const hasOverlap = state.leaves.some((l) => {
        if (l.employeeId !== payload.employeeId || l.status === 'CANCELLED' || l.status === 'REJECTED') {
          return false;
        }
        return payload.startDate <= l.endDate && payload.endDate >= l.startDate;
      });

      if (hasOverlap) {
        return {
          success: false,
          error: 'Nhân viên đã có đơn xin nghỉ phép khác trong khoảng thời gian này (BR-009).',
        };
      }

      // Check balance
      const balance = get().getBalance(payload.employeeId);
      if (payload.totalDays > balance.remainingDays && payload.leaveTypeId === 1) {
        return {
          success: false,
          error: `Số ngày xin nghỉ (${payload.totalDays} ngày) vượt quá quỹ phép năm còn lại (${balance.remainingDays} ngày).`,
        };
      }

      const newLeave: LeaveRequest = {
        ...payload,
        id: Date.now(),
        status: 'SUBMITTED',
        tier1ReviewedBy: null,
        tier2ReviewedBy: null,
      };

      set({ leaves: [newLeave, ...state.leaves] });
      return { success: true };
    },

    approveLeave: (leaveId, reviewerId) => {
      const state = get();
      const target = state.leaves.find((l) => l.id === leaveId);
      if (!target) return;

      const updatedLeave: LeaveRequest = {
        ...target,
        status: 'APPROVED',
        tier1ReviewedBy: reviewerId,
      };

      const updatedLeaves = state.leaves.map((l) => (l.id === leaveId ? updatedLeave : l));

      // Update employee's used balance
      const currentBalance = state.balances[target.employeeId] || { annualQuota: 12, usedDays: 0 };
      const updatedBalances = {
        ...state.balances,
        [target.employeeId]: {
          ...currentBalance,
          usedDays: currentBalance.usedDays + target.totalDays,
        },
      };

      set({
        leaves: updatedLeaves,
        balances: updatedBalances,
      });

      // Synchronize to useScheduleStore so it immediately reflects on the Schedule Roster (SCR-11)
      try {
        useScheduleStore.getState().addApprovedLeave(updatedLeave);
      } catch (err) {
        console.warn('Could not sync approved leave to schedule store:', err);
      }
    },

    rejectLeave: (leaveId, reviewerId) => {
      const state = get();
      set({
        leaves: state.leaves.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                status: 'REJECTED' as const,
                tier1ReviewedBy: reviewerId,
              }
            : l
        ),
      });

      try {
        useScheduleStore.getState().removeApprovedLeave(leaveId);
      } catch (err) {
        console.warn('Could not remove leave from schedule store:', err);
      }
    },

    cancelLeave: (leaveId) => {
      const state = get();
      set({
        leaves: state.leaves.map((l) =>
          l.id === leaveId ? { ...l, status: 'CANCELLED' as const } : l
        ),
      });

      try {
        useScheduleStore.getState().removeApprovedLeave(leaveId);
      } catch (err) {
        console.warn('Could not remove leave from schedule store:', err);
      }
    },
  };
});
