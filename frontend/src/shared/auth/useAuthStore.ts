import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { authService } from './authService';
import { getDefaultAuthPassword } from '@/config/env.config';

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

const DEFAULT_INITIAL_USER: Employee = {
  id: 21,
  employeeCode: 'EMP-021',
  fullName: 'Đinh Thị Uyên',
  email: 'admin@company.com',
  phoneNumber: '0921234567',
  branchId: 1,
  positionId: 3,
  managerId: null,
  employmentStatus: 'OFFICIAL',
  hireDate: '2020-01-01',
  isActive: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentRole: 'ROLE_DIRECTOR',
  currentUser: DEFAULT_INITIAL_USER,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token') || import.meta.env.MODE === 'test',
  isLoading: false,

  setRole: (role: RoleType) => {
    let username = 'admin';
    if (role === 'ROLE_DIRECTOR' || role === 'ROLE_ADMIN') {
      username = 'admin';
    } else if (role === 'ROLE_MANAGER' || role === 'ROLE_DEPT_MANAGER') {
      username = 'manager';
    } else if (role === 'ROLE_EMPLOYEE') {
      username = 'employee';
    }
    set({ currentRole: role });

    get().login(username, getDefaultAuthPassword()).catch((err) => {
      console.warn(`Live login switch for ${username} failed:`, err);
    });
  },

  setUser: (user: Employee) => set({ currentUser: user }),

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });
      const res = await authService.login({ username, password });
      const userRole = (res.user.roles && res.user.roles.length > 0
        ? res.user.roles[0]
        : 'ROLE_DIRECTOR') as RoleType;

      const employeeObj: Employee = {
        id: res.user.employee_id || 1,
        fullName: res.user.full_name || res.user.username,
        email: res.user.email,
        employeeCode: res.user.username.toUpperCase(),
        phoneNumber: '',
        branchId: 1,
        positionId: 1,
        managerId: null,
        employmentStatus: 'OFFICIAL',
        hireDate: '2026-01-01',
        isActive: true,
      };

      set({
        token: res.access_token,
        isAuthenticated: true,
        currentRole: userRole,
        currentUser: employeeObj,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.warn('Real login failed:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({
      token: null,
      isAuthenticated: false,
      currentRole: 'ROLE_DIRECTOR',
      currentUser: DEFAULT_INITIAL_USER,
    });
  },

  initAuth: async () => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const user = await authService.getCurrentUser();
        const userRole = (user.roles && user.roles.length > 0 ? user.roles[0] : 'ROLE_DIRECTOR') as RoleType;
        const employeeObj: Employee = {
          id: user.employee_id || 1,
          fullName: user.full_name || user.username,
          email: user.email,
          employeeCode: user.username.toUpperCase(),
          phoneNumber: '',
          branchId: 1,
          positionId: 1,
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

    // Do NOT auto-login as admin when token is null or invalid in production
    set({
      token: null,
      isAuthenticated: import.meta.env.MODE === 'test',
      isLoading: false,
    });
  },
}));
