import { create } from 'zustand';
import { payrollService } from '../api/payrollService';
import type { PayrollSummary, PayrollDetail, MyPayslip, UpdatePayrollItemPayload } from '../types/payroll.types';

interface PayrollState {
  payrolls: PayrollSummary[];
  activePayroll: PayrollDetail | null;
  myPayslip: MyPayslip | null;
  isLoading: boolean;
  error: string | null;

  selectedMonth: number;
  selectedYear: number;
  selectedBranchId: number | null;

  fetchPayrolls: (year?: number, branchId?: number) => Promise<void>;
  fetchPayrollDetails: (id: number) => Promise<void>;
  generatePayroll: (month: number, year: number, branchId?: number | null) => Promise<boolean>;
  approvePayroll: (id: number) => Promise<boolean>;
  reopenPayroll: (id: number) => Promise<boolean>;
  updatePayrollItem: (itemId: number, payload: UpdatePayrollItemPayload) => Promise<boolean>;
  fetchMyPayslip: (month: number, year: number) => Promise<void>;
  setFilter: (month: number, year: number, branchId?: number | null) => void;
}

const now = new Date();

export const usePayrollStore = create<PayrollState>((set, get) => ({
  payrolls: [],
  activePayroll: null,
  myPayslip: null,
  isLoading: false,
  error: null,

  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  selectedBranchId: null,

  fetchPayrolls: async (year, branchId) => {
    set({ isLoading: true, error: null });
    try {
      const list = await payrollService.getPayrolls({ year, branch_id: branchId });
      set({ payrolls: list, isLoading: false });

      // Auto-load matching activePayroll for currently selected month/year and branch
      const currentMonth = get().selectedMonth;
      const currentYear = year ?? get().selectedYear;
      const currentBranchId = branchId !== undefined ? branchId : get().selectedBranchId;

      // 1. Exact match by month, year, and branch
      let matching = list.find((p) => {
        const timeMatch = p.period_month === currentMonth && p.period_year === currentYear;
        if (!timeMatch) return false;
        if (currentBranchId === null || currentBranchId === undefined) {
          return p.branch_id === null || p.branch_id === undefined;
        }
        return p.branch_id === currentBranchId;
      });

      // 2. Fallback: If "Toàn hệ thống" (currentBranchId == null) and no record with branch_id == null,
      // prioritize any payroll in this month/year with employees > 0
      if (!matching && (currentBranchId === null || currentBranchId === undefined)) {
        matching = list.find((p) => p.period_month === currentMonth && p.period_year === currentYear && p.total_employees > 0);
      }

      if (matching) {
        await get().fetchPayrollDetails(matching.id);
      } else {
        set({ activePayroll: null });
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải danh sách bảng lương', isLoading: false });
    }
  },

  fetchPayrollDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await payrollService.getPayrollById(id);
      set({ activePayroll: detail, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải chi tiết bảng lương', isLoading: false });
    }
  },

  generatePayroll: async (month: number, year: number, branchId?: number | null) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await payrollService.generatePayroll({
        month,
        year,
        branch_id: branchId,
      });
      set({ activePayroll: detail, isLoading: false });
      await get().fetchPayrolls(year, branchId || undefined);
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tính toán bảng lương', isLoading: false });
      return false;
    }
  },

  approvePayroll: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await payrollService.approvePayroll(id);
      if (get().activePayroll && get().activePayroll?.id === id) {
        set((state) => ({
          activePayroll: state.activePayroll ? { ...state.activePayroll, status: 'APPROVED' } : null,
        }));
      }
      await get().fetchPayrolls(get().selectedYear, get().selectedBranchId || undefined);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi phê duyệt bảng lương', isLoading: false });
      return false;
    }
  },

  reopenPayroll: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await payrollService.reopenPayroll(id);
      if (get().activePayroll && get().activePayroll?.id === id) {
        set((state) => ({
          activePayroll: state.activePayroll ? { ...state.activePayroll, status: 'DRAFT' } : null,
        }));
      }
      await get().fetchPayrolls(get().selectedYear, get().selectedBranchId || undefined);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi mở lại bảng lương', isLoading: false });
      return false;
    }
  },

  updatePayrollItem: async (itemId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await payrollService.updatePayrollItem(itemId, payload);
      set((state) => {
        if (!state.activePayroll) return { isLoading: false };
        const newItems = state.activePayroll.items.map((it) =>
          it.id === itemId ? updatedItem : it
        );
        const newTotalGross = newItems.reduce((acc, curr) => acc + (curr.gross_salary || 0), 0);
        const newTotalNet = newItems.reduce((acc, curr) => acc + (curr.net_salary || 0), 0);
        return {
          activePayroll: {
            ...state.activePayroll,
            items: newItems,
            total_gross: newTotalGross,
            total_net: newTotalNet,
          },
          isLoading: false,
        };
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi cập nhật phiếu lương', isLoading: false });
      return false;
    }
  },

  fetchMyPayslip: async (month: number, year: number) => {
    set({ isLoading: true, error: null });
    try {
      const payslip = await payrollService.getMyPayslip(month, year);
      set({ myPayslip: payslip, isLoading: false });
    } catch (err: any) {
      set({ myPayslip: null, error: err.message || 'Chưa có phiếu lương kỳ này', isLoading: false });
    }
  },

  setFilter: (month: number, year: number, branchId?: number | null) => {
    set({ selectedMonth: month, selectedYear: year, selectedBranchId: branchId ?? null });
    get().fetchPayrolls(year, branchId || undefined);
  },
}));
