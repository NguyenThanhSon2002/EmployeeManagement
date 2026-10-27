import { create } from 'zustand';
import type { Employee, Branch, Position } from '@/types/domain.types';
import { employeeService } from '@/features/employees/api/employeeService';
import { branchService } from '@/shared/branch/branchService';
import { api } from '@/shared/api/apiClient';
import { isMockEnabled } from '@/config/env.config';

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

const DEFAULT_BRANCHES: Branch[] = [
  { id: 1, branchCode: 'CN_CAUGIAY', branchName: 'Chi nhánh Cầu Giấy', address: '12 Cầu Giấy, Hà Nội', phoneNumber: '0243123456', openedDate: '2026-01-01', isActive: true },
  { id: 2, branchCode: 'CN_DONGDA', branchName: 'Chi nhánh Đống Đa', address: '45 Chùa Bộc, Hà Nội', phoneNumber: '0243654321', openedDate: '2026-01-01', isActive: true },
  { id: 3, branchCode: 'CN_HOANKIEM', branchName: 'Chi nhánh Hoàn Kiếm', address: '88 Tràng Thi, Hà Nội', phoneNumber: '0243987654', openedDate: '2026-01-01', isActive: true },
];

const DEFAULT_POSITIONS: Position[] = [
  { id: 1, positionCode: 'POS_DIRECTOR', positionName: 'Giám đốc' },
  { id: 2, positionCode: 'POS_MANAGER', positionName: 'Quản lý' },
  { id: 3, positionCode: 'POS_EMPLOYEE', positionName: 'Nhân viên' },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 1, employeeCode: 'EMP-001', fullName: 'Nguyễn Văn An', email: 'an.nguyen@company.com', phoneNumber: '0901234567', nationalId: '001202001111', dateOfBirth: '1990-05-12', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 2, managerId: null, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2022-03-01', isActive: true, version: 1 },
  { id: 2, employeeCode: 'EMP-002', fullName: 'Trần Thị Bích', email: 'bich.tran@company.com', phoneNumber: '0902345678', nationalId: '001202001112', dateOfBirth: '1995-08-20', gender: 'FEMALE', address: 'Hà Nội', branchId: 1, positionId: 2, managerId: null, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2023-05-15', isActive: true, version: 1 },
  { id: 3, employeeCode: 'EMP-003', fullName: 'Lê Văn Cường', email: 'cuong.le@company.com', phoneNumber: '0903456789', nationalId: '001202001113', dateOfBirth: '1998-11-05', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'PROBATION', employmentType: 'FULL_TIME', hireDate: '2026-09-01', isActive: true, version: 1 },
  { id: 4, employeeCode: 'EMP-004', fullName: 'Phạm Văn Dũng', email: 'dung.pham@company.com', phoneNumber: '0904567890', nationalId: '001202001114', dateOfBirth: '1992-03-15', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 2, managerId: null, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2022-10-10', isActive: true, version: 1 },
  { id: 5, employeeCode: 'EMP-005', fullName: 'Hoàng Thị Em', email: 'em.hoang@company.com', phoneNumber: '0905678901', nationalId: '001202001115', dateOfBirth: '1996-07-22', gender: 'FEMALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2023-01-05', isActive: true, version: 1 },
  { id: 6, employeeCode: 'EMP-006', fullName: 'Vũ Văn Giang', email: 'giang.vu@company.com', phoneNumber: '0906789012', nationalId: '001202001116', dateOfBirth: '1994-12-30', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2021-06-18', isActive: true, version: 1 },
  { id: 7, employeeCode: 'EMP-007', fullName: 'Đỗ Thị Hà', email: 'ha.do@company.com', phoneNumber: '0907890123', nationalId: '001202001117', dateOfBirth: '1997-04-14', gender: 'FEMALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2024-02-01', isActive: true, version: 1 },
  { id: 8, employeeCode: 'EMP-008', fullName: 'Bùi Văn Hùng', email: 'hung.bui@company.com', phoneNumber: '0908901234', nationalId: '001202001118', dateOfBirth: '1991-09-09', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 2, managerId: null, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2020-11-15', isActive: true, version: 1 },
  { id: 9, employeeCode: 'EMP-009', fullName: 'Ngô Thị Mai', email: 'mai.ngo@company.com', phoneNumber: '0909012345', nationalId: '001202001119', dateOfBirth: '1999-01-25', gender: 'FEMALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'RESIGNED', employmentType: 'FULL_TIME', hireDate: '2026-08-15', isActive: false, version: 1 },
  { id: 10, employeeCode: 'EMP-010', fullName: 'Dương Văn Nam', email: 'nam.duong@company.com', phoneNumber: '0910123456', nationalId: '001202001120', dateOfBirth: '1993-06-17', gender: 'MALE', address: 'Hà Nội', branchId: 1, positionId: 3, managerId: 1, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2022-04-20', isActive: true, version: 1 },
  { id: 21, employeeCode: 'EMP-021', fullName: 'Đinh Thị Uyên', email: 'uyen.dinh@company.com', phoneNumber: '0921234567', nationalId: '001202001121', dateOfBirth: '1988-02-14', gender: 'FEMALE', address: 'Hà Nội', branchId: 2, positionId: 1, managerId: null, employmentStatus: 'OFFICIAL', employmentType: 'FULL_TIME', hireDate: '2020-01-01', isActive: true, version: 1 },
];

export const useDirectoryStore = create<DirectoryState>((set, get) => ({
  employees: isMockEnabled() ? DEFAULT_EMPLOYEES : [],
  branches: isMockEnabled() ? DEFAULT_BRANCHES : [],
  positions: isMockEnabled() ? DEFAULT_POSITIONS : [],
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

      const mappedBranches: Branch[] = (branchData.length > 0 ? branchData : (isMockEnabled() ? DEFAULT_BRANCHES : [])).map((b: any) => ({
        id: b.id,
        branchCode: b.branch_code || b.branchCode,
        branchName: b.branch_name || b.branchName,
        address: b.address || '',
        phoneNumber: b.phone_number || b.phoneNumber || '',
        openedDate: b.opened_date || b.openedDate || '2026-01-01',
        managerId: b.manager_id || b.managerId || null,
        isActive: b.is_active !== undefined ? b.is_active : (b.isActive !== undefined ? b.isActive : true),
      }));

      const mappedPositions: Position[] = (posData.length > 0 ? posData : (isMockEnabled() ? DEFAULT_POSITIONS : [])).map((p: any) => ({
        id: p.id,
        positionCode: p.position_code || p.positionCode,
        positionName: p.position_name || p.positionName,
      }));

      const mappedEmps: Employee[] = empData.map((dto: any) => {
        const secBranches = (dto.secondary_branches || []).map((sb: any) => ({
          branchId: sb.branch_id || sb.branchId,
          positionId: sb.position_id || sb.positionId,
          branchName: sb.branch_name || sb.branchName,
          positionName: sb.position_name || sb.positionName,
        }));
        const secBranchIds: number[] = dto.secondary_branch_ids || secBranches.map((sb: any) => sb.branchId);

        return {
          id: dto.id,
          employeeCode: dto.employee_code || dto.employeeCode || `EMP-${dto.id}`,
          fullName: dto.full_name || dto.fullName || 'Nhân viên',
          email: dto.email || '',
          phoneNumber: dto.phone_number || dto.phoneNumber || '',
          nationalId: dto.national_id || dto.nationalId || '',
          dateOfBirth: dto.date_of_birth || dto.dateOfBirth || '',
          gender: dto.gender || 'OTHER',
          address: dto.address || '',
          branchId: dto.branch_id || dto.branchId || dto.department_id || dto.departmentId || 1,
          positionId: dto.position_id || dto.positionId || 1,
          managerId: dto.manager_id || dto.managerId || null,
          employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
          employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
          hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
          avatarUrl: dto.avatar_url || dto.avatarUrl || '',
          isActive: dto.is_active !== undefined ? dto.is_active : true,
          version: dto.version || 0,
          secondaryBranchIds: secBranchIds,
          secondaryBranches: secBranches,
          hasMultiBranch: secBranchIds.length > 0,
        };
      });

      set({
        employees: mappedEmps.length > 0 ? mappedEmps : (isMockEnabled() ? DEFAULT_EMPLOYEES : []),
        branches: mappedBranches.length > 0 ? mappedBranches : (isMockEnabled() ? DEFAULT_BRANCHES : []),
        positions: mappedPositions.length > 0 ? mappedPositions : (isMockEnabled() ? DEFAULT_POSITIONS : []),
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.warn('Failed to load directory from backend:', error);
      set({
        employees: isMockEnabled() ? (get().employees.length > 0 ? get().employees : DEFAULT_EMPLOYEES) : [],
        branches: isMockEnabled() ? (get().branches.length > 0 ? get().branches : DEFAULT_BRANCHES) : [],
        positions: isMockEnabled() ? (get().positions.length > 0 ? get().positions : DEFAULT_POSITIONS) : [],
        isLoaded: true,
        isLoading: false,
      });
    }
  },

  refreshEmployees: async () => {
    try {
      const empRes = await employeeService.getEmployees({ page: 1, size: 200 });
      const empData = toArray(empRes);
      const mappedEmps: Employee[] = empData.map((dto: any) => {
        const secBranches = (dto.secondary_branches || []).map((sb: any) => ({
          branchId: sb.branch_id || sb.branchId,
          positionId: sb.position_id || sb.positionId,
          branchName: sb.branch_name || sb.branchName,
          positionName: sb.position_name || sb.positionName,
        }));
        const secBranchIds: number[] = dto.secondary_branch_ids || secBranches.map((sb: any) => sb.branchId);

        return {
          id: dto.id,
          employeeCode: dto.employee_code || dto.employeeCode || `EMP-${dto.id}`,
          fullName: dto.full_name || dto.fullName || 'Nhân viên',
          email: dto.email || '',
          phoneNumber: dto.phone_number || dto.phoneNumber || '',
          nationalId: dto.national_id || dto.nationalId || '',
          dateOfBirth: dto.date_of_birth || dto.dateOfBirth || '',
          gender: dto.gender || 'OTHER',
          address: dto.address || '',
          branchId: dto.branch_id || dto.branchId || dto.department_id || dto.departmentId || 1,
          positionId: dto.position_id || dto.positionId || 1,
          managerId: dto.manager_id || dto.managerId || null,
          employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
          employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
          hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
          avatarUrl: dto.avatar_url || dto.avatarUrl || '',
          isActive: dto.is_active !== undefined ? dto.is_active : true,
          version: dto.version || 0,
          secondaryBranchIds: secBranchIds,
          secondaryBranches: secBranches,
          hasMultiBranch: secBranchIds.length > 0,
        };
      });
      set({ employees: mappedEmps });
    } catch (err) {
      console.warn('Failed to refresh employees:', err);
    }
  },

  createBranch: async (data: Partial<Branch>) => {
    let newBranch: Branch;
    if (isMockEnabled()) {
      newBranch = {
        id: Math.max(...get().branches.map((b) => b.id), 0) + 1,
        branchCode: data.branchCode || `CN_${Date.now()}`,
        branchName: data.branchName || 'Chi nhánh mới',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        openedDate: data.openedDate || data.opened_date || new Date().toISOString().slice(0, 10),
        managerId: data.managerId || null,
        isActive: data.isActive ?? true,
      };
    } else {
      newBranch = await branchService.createBranch(data);
    }
    set({ branches: [...get().branches, newBranch] });
    return newBranch;
  },

  updateBranch: async (id: number, data: Partial<Branch>) => {
    let updatedBranch: Branch;
    if (isMockEnabled()) {
      const existing = get().branches.find((b) => b.id === id);
      if (!existing) throw new Error('Không tìm thấy chi nhánh');
      updatedBranch = { ...existing, ...data };
    } else {
      updatedBranch = await branchService.updateBranch(id, data);
    }
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

    if (!isMockEnabled()) {
      await branchService.deleteBranch(id);
    }
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
