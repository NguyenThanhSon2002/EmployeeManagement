import { create } from 'zustand';
import type { Employee, RoleType } from '@/types/domain.types';
import { authService } from './authService';
import { getDefaultAuthPassword, isMockEnabled } from '@/config/env.config';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';

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
  'emp-021': {
    username: 'EMP-021',
    role: 'ROLE_DIRECTOR',
    employee: {
      id: 21,
      employeeCode: 'EMP-021',
      fullName: 'Đinh Thị Uyên',
      email: 'uyen.dinh@company.com',
      phoneNumber: '0921234567',
      branchId: 1,
      positionId: 1,
      managerId: null,
      employmentStatus: 'OFFICIAL',
      hireDate: '2020-01-01',
      isActive: true,
    },
  },
  'emp-001': {
    username: 'EMP-001',
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
  'emp-002': {
    username: 'EMP-002',
    role: 'ROLE_MANAGER',
    employee: {
      id: 2,
      employeeCode: 'EMP-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phoneNumber: '0902345678',
      branchId: 1,
      positionId: 2,
      managerId: null,
      employmentStatus: 'OFFICIAL',
      hireDate: '2023-05-15',
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
      id: 3,
      employeeCode: 'EMP-003',
      fullName: 'Lê Văn Cường',
      email: 'cuong.le@company.com',
      phoneNumber: '0903456789',
      branchId: 1,
      positionId: 3,
      managerId: 1,
      employmentStatus: 'PROBATION',
      hireDate: '2026-09-01',
      isActive: true,
    },
  },
};

export const verifyMockCredentials = (
  usernameInput: string,
  passwordInput?: string
): { role: RoleType; employee: Employee; username: string } | null => {
  const cleanUser = usernameInput.trim();
  const lowerUser = cleanUser.toLowerCase();

  let found = Object.values(CANONICAL_AUTH_USERS).find(
    (u) =>
      u.username.toLowerCase() === lowerUser ||
      u.employee.employeeCode.toLowerCase() === lowerUser ||
      u.employee.email.toLowerCase() === lowerUser
  );

  // Dynamic Single Source of Truth lookup from Directory Store
  const dirEmployees = useDirectoryStore.getState().employees || [];
  const normalizedInput = lowerUser.replace(/[^a-z0-9]/g, '');
  const dirEmp = dirEmployees.find(
    (e) =>
      e.employeeCode.toLowerCase() === lowerUser ||
      e.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedInput ||
      e.email?.toLowerCase() === lowerUser
  );

  if (dirEmp) {
    const dynamicRole: RoleType =
      dirEmp.positionId === 1
        ? 'ROLE_DIRECTOR'
        : dirEmp.positionId === 2
          ? 'ROLE_MANAGER'
          : 'ROLE_EMPLOYEE';

    found = {
      username: dirEmp.employeeCode,
      role: dynamicRole,
      employee: {
        ...dirEmp,
        positionId: dirEmp.positionId || (dynamicRole === 'ROLE_DIRECTOR' ? 1 : dynamicRole === 'ROLE_MANAGER' ? 2 : 3),
      },
    };
  }

  if (!found) {
    const match = cleanUser.match(/^EMP[-_]?(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const code = `EMP-${match[1].padStart(3, '0')}`;
      const role: RoleType = num === 21 ? 'ROLE_DIRECTOR' : [1, 2, 4, 8].includes(num) ? 'ROLE_MANAGER' : 'ROLE_EMPLOYEE';
      found = {
        username: code,
        role,
        employee: {
          id: num,
          employeeCode: code,
          fullName: `Nhân viên ${code}`,
          email: `${code.toLowerCase()}@company.com`,
          phoneNumber: '0900000000',
          branchId: 1,
          positionId: role === 'ROLE_DIRECTOR' ? 1 : role === 'ROLE_MANAGER' ? 2 : 3,
          managerId: role === 'ROLE_EMPLOYEE' ? 1 : null,
          employmentStatus: 'OFFICIAL',
          hireDate: '2023-01-01',
          isActive: true,
        },
      };
    }
  }

  if (!found) return null;

  if (passwordInput !== undefined) {
    const defaultCodePassword =
      found.employee.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '') + '@123';
    const isMasterPassword = passwordInput === getDefaultAuthPassword();
    const isCodePassword = passwordInput === defaultCodePassword;
    const isAdminPassword =
      (found.username === 'admin' || found.employee.employeeCode === 'EMP-021') &&
      passwordInput === 'Admin@123';

    if (!isMasterPassword && !isCodePassword && !isAdminPassword) {
      return null;
    }
  }

  return found;
};

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'ROLE_DIRECTOR',
  currentUser: CANONICAL_AUTH_USERS.admin.employee,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null,
  isAuthenticated:
    (typeof localStorage !== 'undefined' && !!localStorage.getItem('access_token')) ||
    import.meta.env?.MODE === 'test',
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
        const roles = res.user.roles || [];
        userRole = (roles.includes('ROLE_DIRECTOR') || roles.includes('ROLE_ADMIN')
          ? 'ROLE_DIRECTOR'
          : roles.includes('ROLE_MANAGER')
            ? 'ROLE_MANAGER'
            : 'ROLE_EMPLOYEE') as RoleType;
        accessToken = res.access_token;
        const assignedBranchId = res.user.branch_id || (res.user as any).branchId || 1;
        employeeObj = {
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
      } else {
        // Mock authentication check
        const found = verifyMockCredentials(username, password);
        if (!found) {
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
        if (!isMockEnabled()) {
          // In real API mode, stale mock tokens cannot authenticate with backend and cause 403 Forbidden
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
        const tokenUsername = token.replace('mock-token-', '');
        const found = verifyMockCredentials(tokenUsername);
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
        const roles = user.roles || [];
        const userRole = (roles.includes('ROLE_DIRECTOR') || roles.includes('ROLE_ADMIN')
          ? 'ROLE_DIRECTOR'
          : roles.includes('ROLE_MANAGER')
            ? 'ROLE_MANAGER'
            : 'ROLE_EMPLOYEE') as RoleType;
        const assignedBranchId = user.branch_id || (user as any).branchId || 1;
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
