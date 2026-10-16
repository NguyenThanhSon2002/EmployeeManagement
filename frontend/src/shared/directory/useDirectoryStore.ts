import { create } from 'zustand';
import type { Employee, Department, Position } from '@/types/domain.types';
import { employeeService } from '@/features/employees/api/employeeService';
import { departmentService } from '@/shared/department/departmentService';
import { api } from '@/shared/api/apiClient';

interface DirectoryState {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  isLoaded: boolean;
  isLoading: boolean;

  fetchDirectory: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  removeEmployeeFromDirectory: (id: number) => void;
  getEmployeeById: (id: number) => Employee | undefined;
  getDepartmentById: (id: number) => Department | undefined;
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
  departments: [],
  positions: [],
  isLoaded: false,
  isLoading: false,

  fetchDirectory: async () => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    try {
      set({ isLoading: true });

      const [empRes, deptRes, posRes] = await Promise.all([
        employeeService.getEmployees({ page: 1, size: 200 }),
        departmentService.getAllDepartments(),
        api.get<any[]>('/positions').catch(() => []),
      ]);

      const empData = toArray(empRes);
      const deptData = toArray(deptRes);
      const posData = toArray(posRes);

      const mappedDepts: Department[] = deptData.map((d: any) => ({
        id: d.id,
        departmentCode: d.department_code || d.departmentCode,
        departmentName: d.department_name || d.departmentName,
        managerId: d.manager_id || d.managerId || null,
        parentDepartmentId: d.parent_department_id || d.parent_id || null,
      }));

      const mappedPositions: Position[] = posData.map((p: any) => ({
        id: p.id,
        positionCode: p.position_code || p.positionCode,
        positionName: p.position_name || p.positionName,
      }));

      const mappedEmps: Employee[] = empData.map((dto: any) => ({
        id: dto.id,
        employeeCode: dto.employee_code || dto.employeeCode || `EMP-${dto.id}`,
        fullName: dto.full_name || dto.fullName || 'Nhân viên',
        email: dto.email || '',
        phoneNumber: dto.phone_number || dto.phoneNumber || '',
        nationalId: dto.national_id || dto.nationalId || '',
        dateOfBirth: dto.date_of_birth || dto.dateOfBirth || '',
        gender: dto.gender || 'OTHER',
        address: dto.address || '',
        departmentId: dto.department_id || dto.departmentId || 1,
        positionId: dto.position_id || dto.positionId || 1,
        managerId: dto.manager_id || dto.managerId || null,
        employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
        employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
        hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
        isActive: dto.is_active !== undefined ? dto.is_active : true,
        version: dto.version || 0,
      }));

      set({
        employees: mappedEmps,
        departments: mappedDepts,
        positions: mappedPositions,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.warn('Failed to load directory from backend:', error);
      set({ isLoading: false });
    }
  },

  refreshEmployees: async () => {
    try {
      const empRes = await employeeService.getEmployees({ page: 1, size: 200 });
      const empData = toArray(empRes);
      const mappedEmps: Employee[] = empData.map((dto: any) => ({
        id: dto.id,
        employeeCode: dto.employee_code || dto.employeeCode || `EMP-${dto.id}`,
        fullName: dto.full_name || dto.fullName || 'Nhân viên',
        email: dto.email || '',
        phoneNumber: dto.phone_number || dto.phoneNumber || '',
        nationalId: dto.national_id || dto.nationalId || '',
        dateOfBirth: dto.date_of_birth || dto.dateOfBirth || '',
        gender: dto.gender || 'OTHER',
        address: dto.address || '',
        departmentId: dto.department_id || dto.departmentId || 1,
        positionId: dto.position_id || dto.positionId || 1,
        managerId: dto.manager_id || dto.managerId || null,
        employmentStatus: dto.employment_status || dto.employmentStatus || 'OFFICIAL',
        employmentType: dto.employment_type || dto.employmentType || 'FULL_TIME',
        hireDate: dto.hire_date || dto.hireDate || '2026-01-01',
        isActive: dto.is_active !== undefined ? dto.is_active : true,
        version: dto.version || 0,
      }));
      set({ employees: mappedEmps });
    } catch (err) {
      console.warn('Failed to refresh employees:', err);
    }
  },

  removeEmployeeFromDirectory: (id: number) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },

  getEmployeeById: (id: number) => {
    return get().employees.find((e) => e.id === id);
  },

  getDepartmentById: (id: number) => {
    return get().departments.find((d) => d.id === id);
  },

  getPositionById: (id: number) => {
    return get().positions.find((p) => p.id === id);
  },
}));
