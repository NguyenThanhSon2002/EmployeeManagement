import type { RoleType } from '@/types/domain.types';

export const ROUTE_PATHS = {
  LOGIN: '/login',
  HOME: '/',
  SCHEDULE: '/schedule',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:id',
  BRANCHES: '/branches',
  ATTENDANCE: '/attendance',
  SHIFTS: '/shifts',
  LEAVES: '/leaves',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const getDefaultLandingRoute = (role?: RoleType): string => {
  return role === 'ROLE_DIRECTOR' ? ROUTE_PATHS.DASHBOARD : ROUTE_PATHS.SCHEDULE;
};
