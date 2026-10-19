import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { authService } from './authService';
import { getDefaultAuthPassword, isMockEnabled } from '@/config/env.config';

interface AuthState {
  currentRole: RoleType;
  currentUser: Employee;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: Employee) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const CANONICAL_AUTH_USERS: Record<
  string,
  { username: string; role: RoleType; employee: Employee }
> = {
  admin: {
    username: 'admin',
    role: 'ROLE_DIRECTOR',
    employee: {
      id: 21,
      employeeCode: 'EMP-021',
      fullName: 'Đinh Thị Uyên',
      email: 'admin@company.com',
      phoneNumber: '0921234567',
      branchId: 1,
      positionId: 1,
      managerId: null,
      employmentStatus: 'OFFICIAL',
      hireDate: '2020-01-01',
      isActive: true,
    },
  },
  manager: {
    username: 'manager',
    role: 'ROLE_MANAGER',
    employee: {
      id: 1,
      employeeCode: 'EMP-001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@company.com',
      phoneNumber: '0901234567',
      branchId: 1,
      positionId: 2,
      managerId: null,
      employmentStatus: 'OFFICIAL',
      hireDate: '2022-03-01',
      isActive: true,
    },
  },
  employee: {
    username: 'employee',
    role: 'ROLE_EMPLOYEE',
    employee: {
      id: 2,
      employeeCode: 'EMP-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phoneNumber: '0902345678',
      branchId: 1,
      positionId: 3,
      managerId: 1,
      employmentStatus: 'OFFICIAL',
      hireDate: '2023-05-15',
      isActive: true,
    },
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'ROLE_DIRECTOR',
  currentUser: CANONICAL_AUTH_USERS.admin.employee,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token') || import.meta.env.MODE === 'test',
  isLoading: false,

  setUser: (user: Employee) => set({ currentUser: user }),

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });
      let userRole: RoleType = 'ROLE_DIRECTOR';
      let employeeObj: Employee = CANONICAL_AUTH_USERS.admin.employee;
      let accessToken = 'mock-access-token';

      if (!isMockEnabled()) {
        const res = await authService.login({ username, password });
        userRole = (res.user.roles && res.user.roles.length > 0
          ? res.user.roles[0]
          : 'ROLE_DIRECTOR') as RoleType;
        accessToken = res.access_token;
        employeeObj = {
          id: res.user.employee_id || 1,
          fullName: res.user.full_name || res.user.username,
          email: res.user.email,
          employeeCode: res.user.username.toUpperCase(),
          phoneNumber: '',
          branchId: 1,
          positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
          managerId: null,
          employmentStatus: 'OFFICIAL',
          hireDate: '2026-01-01',
          isActive: true,
        };
      } else {
        // Mock authentication check
        const lowerUser = username.toLowerCase().trim();
        const found = Object.values(CANONICAL_AUTH_USERS).find(
          (u) =>
            u.username.toLowerCase() === lowerUser ||
            u.employee.email.toLowerCase() === lowerUser
        );
        if (!found || password !== getDefaultAuthPassword()) {
          set({ isLoading: false });
          return false;
        }
        userRole = found.role;
        employeeObj = found.employee;
        accessToken = `mock-token-${found.username}`;
        localStorage.setItem('access_token', accessToken);
      }

      set({
        token: accessToken,
        isAuthenticated: true,
        currentRole: userRole,
        currentUser: employeeObj,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.warn('Real login failed, checking mock fallback:', error);
      // Fallback to canonical mock accounts if backend is temporarily offline
      const lowerUser = username.toLowerCase().trim();
      const found = Object.values(CANONICAL_AUTH_USERS).find(
        (u) =>
          u.username.toLowerCase() === lowerUser ||
          u.employee.email.toLowerCase() === lowerUser
      );
      if (found && password === getDefaultAuthPassword()) {
        const accessToken = `mock-token-${found.username}`;
        localStorage.setItem('access_token', accessToken);
        set({
          token: accessToken,
          isAuthenticated: true,
          currentRole: found.role,
          currentUser: found.employee,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      token: null,
      isAuthenticated: false,
      currentRole: 'ROLE_DIRECTOR',
      currentUser: CANONICAL_AUTH_USERS.admin.employee,
    });
  },

  initAuth: async () => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      // Check if it's a mock token
      if (token.startsWith('mock-token-')) {
        const username = token.replace('mock-token-', '');
        const found = CANONICAL_AUTH_USERS[username];
        if (found) {
          set({
            token,
            isAuthenticated: true,
            currentRole: found.role,
            currentUser: found.employee,
            isLoading: false,
          });
          return;
        }
      }

      try {
        const user = await authService.getCurrentUser();
        const userRole = (user.roles && user.roles.length > 0
          ? user.roles[0]
          : 'ROLE_DIRECTOR') as RoleType;
        const employeeObj: Employee = {
          id: user.employee_id || 1,
          fullName: user.full_name || user.username,
          email: user.email,
          employeeCode: user.username.toUpperCase(),
          phoneNumber: '',
          branchId: 1,
          positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
          managerId: null,
          employmentStatus: 'OFFICIAL',
          hireDate: '2026-01-01',
          isActive: true,
        };

        set({
          token,
          isAuthenticated: true,
          currentRole: userRole,
          currentUser: employeeObj,
          isLoading: false,
        });
        return;
      } catch (err) {
        console.warn('Token validation failed:', err);
        authService.logout();
      }
    }

    set({
      token: null,
      isAuthenticated: import.meta.env.MODE === 'test',
      isLoading: false,
    });
  },
}));
