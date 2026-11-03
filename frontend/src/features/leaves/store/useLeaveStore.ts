import { create } from 'zustand';
import type { LeaveRequest } from '@/types/domain.types';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';
import { leaveService } from '../api/leaveService';

interface LeaveBalanceState {
  annualQuota: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface LeaveState {
  leaves: LeaveRequest[];
  balances: Record<number, LeaveBalanceState>;

  fetchLeaves: (employeeId?: number) => Promise<void>;
  fetchBalances: (employeeId?: number, year?: number) => Promise<void>;
  submitLeave: (
    payload: Omit<LeaveRequest, 'id' | 'status' | 'tier1ReviewedBy' | 'tier2ReviewedBy'>
  ) => { success: boolean; error?: string };

  approveLeave: (leaveId: number, reviewerId: number) => void;
  rejectLeave: (leaveId: number, reviewerId: number, rejectionReason?: string) => void;
  cancelLeave: (leaveId: number) => void;
  getBalance: (employeeId: number) => { annualQuota: number; usedDays: number; pendingDays: number; remainingDays: number };
}

export const useLeaveStore = create<LeaveState>((set, get) => {
  return {
    leaves: [],
    balances: {},

    fetchLeaves: async (employeeId?: number) => {
      try {
        const response: any = await leaveService.getLeaveRequests(employeeId, 1, 100);
        const items = response?.content || (Array.isArray(response) ? response : []);
        if (items.length > 0) {
          const mapped: LeaveRequest[] = items.map((item: any) => ({
            id: item.id,
            employeeId: item.employee_id || item.employeeId,
            leaveTypeId: item.leave_type_id || item.leaveTypeId || 1,
            leaveTypeName: item.leave_type_name || item.leaveTypeName || 'Nghỉ phép năm',
            startDate: item.start_date || item.startDate,
            endDate: item.end_date || item.endDate,
            totalDays: typeof item.total_days === 'number' ? item.total_days : (typeof item.totalDays === 'number' ? item.totalDays : Number(item.total_days || item.totalDays || 1)),
            reason: item.reason || '',
            status: item.status || 'SUBMITTED',
            tier1ReviewedBy: item.tier1_reviewed_by || item.tier1ReviewedBy || null,
            tier2ReviewedBy: null,
          }));
          set({ leaves: mapped });
        }
        await get().fetchBalances(employeeId);
      } catch (err) {
        console.warn('Failed to fetch leaves from backend, keeping local state:', err);
      }
    },

    fetchBalances: async (employeeId?: number, year?: number) => {
      try {
        const data = await leaveService.getLeaveBalances(employeeId, year);
        if (data && Array.isArray(data)) {
          const newBalances: Record<number, LeaveBalanceState> = { ...get().balances };
          for (const item of data) {
            const empId = item.employee_id || (item as any).employeeId;
            if (empId) {
              const allocated = Number(item.total_allocated ?? (item as any).totalAllocated ?? 12);
              const used = Number(item.used_days ?? (item as any).usedDays ?? 0);
              const pending = Number(item.pending_days ?? (item as any).pendingDays ?? 0);
              const remaining = Number(item.remaining_days ?? (item as any).remainingDays ?? Math.max(0, allocated - used - pending));
              newBalances[empId] = {
                annualQuota: allocated,
                usedDays: used,
                pendingDays: pending,
                remainingDays: remaining,
              };
            }
          }
          set({ balances: newBalances });
        }
      } catch (err) {
        console.warn('Failed to fetch leave balances from backend:', err);
      }
    },

    getBalance: (employeeId: number) => {
      const state = get();
      const b = state.balances[employeeId] || { annualQuota: 12, usedDays: 0, pendingDays: 0, remainingDays: 12 };
      return {
        annualQuota: b.annualQuota,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
        remainingDays: b.remainingDays,
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
          error: 'Nhân viên đã có đơn xin nghỉ phép khác trong khoảng thời gian này.',
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

      leaveService.submitLeaveRequest({
        leave_type_id: payload.leaveTypeId,
        start_date: payload.startDate,
        end_date: payload.endDate,
        total_days: payload.totalDays,
        reason: payload.reason,
      }).then((created: any) => {
        if (created && created.id) {
          set((curr) => ({
            leaves: curr.leaves.map((l) => (l.id === newLeave.id ? { ...l, id: created.id } : l)),
          }));
          get().fetchBalances(payload.employeeId);
        }
      }).catch((err) => {
        console.error('Failed to submit leave to backend:', err);
      });

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
      const currentBalance = state.balances[target.employeeId] || { annualQuota: 12, usedDays: 0, pendingDays: 0, remainingDays: 12 };
      const updatedBalances = {
        ...state.balances,
        [target.employeeId]: {
          ...currentBalance,
          usedDays: currentBalance.usedDays + target.totalDays,
          pendingDays: Math.max(0, currentBalance.pendingDays - target.totalDays),
          remainingDays: Math.max(0, currentBalance.annualQuota - currentBalance.usedDays - target.totalDays),
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

      leaveService
        .reviewLeaveRequest(leaveId, 'APPROVE')
        .then(() => {
          get().fetchBalances(target.employeeId);
        })
        .catch((err) => {
          console.error('Failed to approve leave on backend:', err);
        });
    },

    rejectLeave: (leaveId, reviewerId, rejectionReason) => {
      const state = get();
      const target = state.leaves.find((l) => l.id === leaveId);
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

      leaveService
        .reviewLeaveRequest(leaveId, 'REJECT', rejectionReason)
        .then(() => {
          if (target?.employeeId) {
            get().fetchBalances(target.employeeId);
          }
        })
        .catch((err) => {
          console.error('Failed to reject leave on backend:', err);
        });
    },

    cancelLeave: (leaveId) => {
      const state = get();
      const target = state.leaves.find((l) => l.id === leaveId);
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

      leaveService
        .cancelLeaveRequest(leaveId)
        .then(() => {
          if (target?.employeeId) {
            get().fetchBalances(target.employeeId);
          }
        })
        .catch((err) => {
          console.error('Failed to cancel leave on backend:', err);
        });
    },
  };
});
