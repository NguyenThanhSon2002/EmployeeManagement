import { create } from 'zustand';
import type { Employee, Branch, Position } from '@/types/domain.types';
import { employeeService } from '@/features/employees/api/employeeService';
import { branchService } from '@/shared/branch/branchService';
import { mapDtoToEmployee, mapDtoToBranch } from '@/features/employees/api/employeeMapper';
import { api } from '@/shared/api/apiClient';

interface DirectoryState {
  employees: Employee[];
  branches: Branch[];
  positions: Position[];
  isLoaded: boolean;
  isLoading: boolean;

  fetchDirectory: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  createBranch: (data: Partial<Branch>) => Promise<Branch>;
  updateBranch: (id: number, data: Partial<Branch>) => Promise<Branch>;
  deleteBranch: (id: number) => Promise<void>;
  upsertEmployeeInDirectory: (employee: Employee) => void;
  removeEmployeeFromDirectory: (id: number) => void;
  getEmployeeById: (id: number) => Employee | undefined;
  getBranchById: (id: number) => Branch | undefined;
  getPositionById: (id: number) => Position | undefined;
}

const toArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.content)) return res.content;
  if (res && Array.isArray(res.items)) return res.items;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

export const useDirectoryStore = create<DirectoryState>((set, get) => ({
  employees: [],
  branches: [],
  positions: [],
  isLoaded: false,
  isLoading: false,

  fetchDirectory: async () => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    try {
      set({ isLoading: true });

      const [empRes, branchRes, posRes] = await Promise.all([
        employeeService.getEmployees({ page: 1, size: 200 }).catch(() => null),
        branchService.getAllBranches().catch(() => null),
        api.get<any[]>('/positions').catch(() => null),
      ]);

      const empData = toArray(empRes);
      const branchData = toArray(branchRes);
      const posData = toArray(posRes);

      const mappedBranches: Branch[] = branchData.map(mapDtoToBranch);

      const mappedPositions: Position[] = posData.map((p: any) => ({
        id: p.id,
        positionCode: p.position_code || p.positionCode,
        positionName: p.position_name || p.positionName,
      }));

      const mappedEmps: Employee[] = empData.map(mapDtoToEmployee);

      set({
        employees: mappedEmps,
        branches: mappedBranches,
        positions: mappedPositions,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.warn('Failed to load directory from backend:', error);
      set({
        isLoading: false,
      });
    }
  },

  refreshEmployees: async () => {
    try {
      const empRes = await employeeService.getEmployees({ page: 1, size: 200 });
      const empData = toArray(empRes);
      const mappedEmps: Employee[] = empData.map(mapDtoToEmployee);

      set({ employees: mappedEmps });
    } catch (error) {
      console.warn('Failed to refresh employees:', error);
    }
  },

  createBranch: async (data: Partial<Branch>) => {
    const newBranch = await branchService.createBranch(data);
    set({ branches: [...get().branches, newBranch] });
    return newBranch;
  },

  updateBranch: async (id: number, data: Partial<Branch>) => {
    const updatedBranch = await branchService.updateBranch(id, data);
    set({
      branches: get().branches.map((b) => (b.id === id ? updatedBranch : b)),
    });
    return updatedBranch;
  },

  deleteBranch: async (id: number) => {
    const employeesInBranch = get().employees.filter(
      (e) => e.branchId === id && e.isActive
    );
    if (employeesInBranch.length > 0) {
      throw new Error(
        `Không thể xóa chi nhánh vì vẫn còn ${employeesInBranch.length} nhân sự đang trực thuộc. Vui lòng điều chuyển nhân sự trước khi xóa.`
      );
    }

    await branchService.deleteBranch(id);
    set({
      branches: get().branches.filter((b) => b.id !== id),
    });
  },

  upsertEmployeeInDirectory: (employee: Employee) => {
    set((state) => {
      const idx = state.employees.findIndex((e) => e.id === employee.id);
      if (idx >= 0) {
        const next = [...state.employees];
        next[idx] = { ...next[idx], ...employee };
        return { employees: next };
      }
      return { employees: [employee, ...state.employees] };
    });
  },

  removeEmployeeFromDirectory: (id: number) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },

  getEmployeeById: (id: number) => {
    return get().employees.find((e) => e.id === id);
  },

  getBranchById: (id: number) => {
    return get().branches.find((b) => b.id === id);
  },

  getPositionById: (id: number) => {
    return get().positions.find((p) => p.id === id);
  },
}));
