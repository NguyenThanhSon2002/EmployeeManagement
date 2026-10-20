import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EmployeeListPage } from '@/features/employees/EmployeeListPage';
import { EmployeeDetailPage } from '@/features/employees/EmployeeDetailPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ShiftTemplatesPage } from '@/features/shifts/ShiftTemplatesPage';
import { AttendanceOverviewPage } from '@/features/attendance/AttendanceOverviewPage';
import { LeaveRequestsPage } from '@/features/leaves/LeaveRequestsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { BranchesPage } from '@/features/branches/BranchesPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { ROUTE_PATHS, getDefaultLandingRoute } from './route-paths';
import type { RoleType } from '@/types/domain.types';

interface RouteWrapperProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 16,
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 14, color: '#94A3B8' }}>Đang xác thực phiên làm việc...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  return <>{children}</>;
};

interface RoleRouteProps {
  allowedRoles: RoleType[];
  children: React.ReactNode;
  fallbackPath?: string;
}

const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  children,
  fallbackPath = ROUTE_PATHS.SCHEDULE,
}) => {
  const { currentRole } = useAuthStore();

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { currentRole } = useAuthStore();
  return <Navigate to={getDefaultLandingRoute(currentRole)} replace />;
};

const PublicOnlyRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const { isAuthenticated, currentRole, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultLandingRoute(currentRole)} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route - Login */}
      <Route
        path={ROUTE_PATHS.LOGIN}
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Routes wrapped inside ProtectedRoute & AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTE_PATHS.HOME} element={<HomeRedirect />} />

        {/* Operational Routes */}
        <Route
          path={ROUTE_PATHS.DASHBOARD}
          element={
            <RoleRoute allowedRoles={['ROLE_DIRECTOR']}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route path={ROUTE_PATHS.SCHEDULE} element={<SchedulePage />} />
        <Route path={ROUTE_PATHS.EMPLOYEES} element={<EmployeeListPage />} />
        <Route path={ROUTE_PATHS.EMPLOYEE_DETAIL} element={<EmployeeDetailPage />} />
        <Route path={ROUTE_PATHS.BRANCHES} element={<BranchesPage />} />
        <Route path={ROUTE_PATHS.ATTENDANCE} element={<AttendanceOverviewPage />} />
        <Route path={ROUTE_PATHS.SHIFTS} element={<ShiftTemplatesPage />} />
        <Route path={ROUTE_PATHS.LEAVES} element={<LeaveRequestsPage />} />
        <Route
          path={ROUTE_PATHS.REPORTS}
          element={
            <RoleRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_MANAGER']}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTE_PATHS.SETTINGS}
          element={
            <RoleRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_MANAGER']}>
              <SettingsPage />
            </RoleRoute>
          }
        />

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div style={{ textAlign: 'center', padding: 'var(--space-xxl) 0' }}>
              <h2 style={{ fontSize: 'var(--font-h1)' }}>404 - Không tìm thấy trang</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
                Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
              </p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};
