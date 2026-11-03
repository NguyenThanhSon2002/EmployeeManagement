import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { authService } from './authService';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';

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

export const EMPTY_USER: Employee = {
  id: 0,
  employeeCode: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  branchId: 1,
  positionId: 1,
  managerId: null,
  employmentStatus: 'OFFICIAL',
  hireDate: '2026-01-01',
  isActive: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'ROLE_DIRECTOR',
  currentUser: EMPTY_USER,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: Employee) => set({ currentUser: user }),

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });

      const res = await authService.login({ username, password });
      const roles = res.user.roles || [];
      const userRole = (roles.includes('ROLE_DIRECTOR') || roles.includes('ROLE_ADMIN')
        ? 'ROLE_DIRECTOR'
        : roles.includes('ROLE_MANAGER')
          ? 'ROLE_MANAGER'
          : 'ROLE_EMPLOYEE') as RoleType;
      const accessToken = res.access_token;
      const assignedBranchId = res.user.branch_id || (res.user as any).branchId || 1;

      // Immediately bootstrap directory and settings now that access_token is available
      await Promise.all([
        useDirectoryStore.getState().fetchDirectory(),
        useSettingsStore.getState().fetchSettings(),
      ]).catch((err) => console.warn('Bootstrap warning on login:', err));

      let employeeObj: Employee = {
        id: res.user.employee_id || 1,
        fullName: res.user.full_name || res.user.username,
        email: res.user.email,
        employeeCode: res.user.username.toUpperCase(),
        phoneNumber: '',
        branchId: assignedBranchId,
        positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
        managerId: null,
        employmentStatus: 'OFFICIAL',
        hireDate: '2026-01-01',
        isActive: true,
      };

      const matchingDirEmp = useDirectoryStore.getState().employees?.find(
        (e) =>
          e.id === res.user.employee_id ||
          e.employeeCode.toLowerCase() === res.user.username.toLowerCase()
      );
      if (matchingDirEmp) {
        employeeObj = {
          ...matchingDirEmp,
          branchId: res.user.branch_id || (res.user as any).branchId || matchingDirEmp.branchId || 1,
          positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
        };
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
      console.error('Backend login failed:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      set({
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    set({
      token: null,
      isAuthenticated: false,
      currentRole: 'ROLE_DIRECTOR',
      currentUser: EMPTY_USER,
    });
  },

  initAuth: async () => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      // Clear legacy mock tokens
      if (token.startsWith('mock-token-')) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        const roles = user.roles || [];
        const userRole = (roles.includes('ROLE_DIRECTOR') || roles.includes('ROLE_ADMIN')
          ? 'ROLE_DIRECTOR'
          : roles.includes('ROLE_MANAGER')
            ? 'ROLE_MANAGER'
            : 'ROLE_EMPLOYEE') as RoleType;
        const assignedBranchId = user.branch_id || (user as any).branchId || 1;

        if (!useDirectoryStore.getState().isLoaded) {
          await Promise.all([
            useDirectoryStore.getState().fetchDirectory(),
            useSettingsStore.getState().fetchSettings(),
          ]).catch((err) => console.warn('Bootstrap warning in initAuth:', err));
        }

        let employeeObj: Employee = {
          id: user.employee_id || 1,
          fullName: user.full_name || user.username,
          email: user.email,
          employeeCode: user.username.toUpperCase(),
          phoneNumber: '',
          branchId: assignedBranchId,
          positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
          managerId: null,
          employmentStatus: 'OFFICIAL',
          hireDate: '2026-01-01',
          isActive: true,
        };

        const matchingDirEmp = useDirectoryStore.getState().employees?.find(
          (e) =>
            e.id === user.employee_id ||
            e.employeeCode.toLowerCase() === user.username.toLowerCase()
        );
        if (matchingDirEmp) {
          employeeObj = {
            ...matchingDirEmp,
            branchId: user.branch_id || (user as any).branchId || matchingDirEmp.branchId || 1,
            positionId: userRole === 'ROLE_DIRECTOR' ? 1 : userRole === 'ROLE_MANAGER' ? 2 : 3,
          };
        }

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
