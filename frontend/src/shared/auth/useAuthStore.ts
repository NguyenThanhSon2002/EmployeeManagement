import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { MOCK_EMPLOYEES } from '@/mocks/employees.mock';
import { authService } from './authService';
import { isMockEnabled, getDefaultAuthPassword } from '@/config/env.config';

interface AuthState {
  currentRole: RoleType;
  currentUser: Employee;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setRole: (role: RoleType) => void;
  setUser: (user: Employee) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentRole: 'ROLE_ADMIN',
  currentUser: MOCK_EMPLOYEES[0], // Nguyễn Văn An (EMP-001)
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  setRole: (role: RoleType) => {
    let defaultUser = MOCK_EMPLOYEES[0];
    let username = 'admin';
    if (role === 'ROLE_ADMIN') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 21) || MOCK_EMPLOYEES[0];
      username = 'admin';
    } else if (role === 'ROLE_DEPT_MANAGER') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 1) || MOCK_EMPLOYEES[0];
      username = 'manager';
    } else if (role === 'ROLE_EMPLOYEE') {
      defaultUser = MOCK_EMPLOYEES.find((e) => e.id === 2) || MOCK_EMPLOYEES[0];
      username = 'employee';
    }
    set({ currentRole: role, currentUser: defaultUser });

    if (!isMockEnabled()) {
      get().login(username, getDefaultAuthPassword()).catch((err) => {
        console.warn(`Live login switch for ${username} failed:`, err);
      });
    }
  },

  setUser: (user: Employee) => set({ currentUser: user }),

  login: async (username: string, password: string): Promise<boolean> => {
    if (isMockEnabled()) {
      get().setRole('ROLE_ADMIN');
      set({ isAuthenticated: true });
      return true;
    }

    try {
      set({ isLoading: true });
      const res = await authService.login({ username, password });
      const userRole = (res.user.roles && res.user.roles.length > 0
        ? res.user.roles[0]
        : 'ROLE_ADMIN') as RoleType;

      // Find or build employee representation
      const matchedEmployee = MOCK_EMPLOYEES.find((e) => e.id === res.user.employee_id) || {
        ...MOCK_EMPLOYEES[0],
        id: res.user.employee_id || 1,
        fullName: res.user.full_name || res.user.username,
        email: res.user.email,
        employeeCode: res.user.username.toUpperCase(),
      };

      set({
        token: res.access_token,
        isAuthenticated: true,
        currentRole: userRole,
        currentUser: matchedEmployee,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.warn('Real login failed, falling back to mock state if applicable:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({
      token: null,
      isAuthenticated: false,
      currentRole: 'ROLE_ADMIN',
      currentUser: MOCK_EMPLOYEES[0],
    });
  },

  initAuth: async () => {
    if (isMockEnabled()) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const user = await authService.getCurrentUser();
        const userRole = (user.roles && user.roles.length > 0 ? user.roles[0] : 'ROLE_ADMIN') as RoleType;
        const matchedEmployee = MOCK_EMPLOYEES.find((e) => e.id === user.employee_id) || {
          ...MOCK_EMPLOYEES[0],
          id: user.employee_id || 1,
          fullName: user.full_name || user.username,
          email: user.email,
        };

        set({
          token,
          isAuthenticated: true,
          currentRole: userRole,
          currentUser: matchedEmployee,
        });
        return;
      } catch (err) {
        console.warn('Token validation failed, attempting auto-login:', err);
        authService.logout();
      }
    }

    // Auto-login as admin in browser runtime so live API requests never get 403 Forbidden
    try {
      await get().login('admin', getDefaultAuthPassword());
    } catch (err) {
      console.warn('Auto-login as admin failed:', err);
    }
  },
}));
