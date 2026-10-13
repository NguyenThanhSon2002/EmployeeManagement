import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { MOCK_EMPLOYEES } from '@/data/mock/employees.mock';

interface AuthState {
  currentRole: RoleType;
  currentUser: Employee;
  setRole: (role: RoleType) => void;
  setUser: (user: Employee) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'ROLE_ADMIN',
  currentUser: MOCK_EMPLOYEES[0], // Nguyễn Văn An (EMP-001)

  setRole: (role: RoleType) => {
    let defaultUser = MOCK_EMPLOYEES[0];
    if (role === 'ROLE_ADMIN') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 21) || MOCK_EMPLOYEES[0];
    } else if (role === 'ROLE_DEPT_MANAGER') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 1) || MOCK_EMPLOYEES[0];
    } else if (role === 'ROLE_EMPLOYEE') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 2) || MOCK_EMPLOYEES[0];
    }
    set({ currentRole: role, currentUser: defaultUser });
  },

  setUser: (user: Employee) => set({ currentUser: user }),
}));
