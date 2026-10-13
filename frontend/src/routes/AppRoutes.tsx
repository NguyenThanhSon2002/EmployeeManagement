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
import { ROUTE_PATHS } from './route-paths';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTE_PATHS.HOME} element={<Navigate to={ROUTE_PATHS.SCHEDULE} replace />} />
        
        {/* Core Scheduling Matrix (SCR-11 & SCR-12) */}
        <Route path={ROUTE_PATHS.SCHEDULE} element={<SchedulePage />} />
        <Route path={ROUTE_PATHS.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTE_PATHS.EMPLOYEES} element={<EmployeeListPage />} />
        <Route path={ROUTE_PATHS.EMPLOYEE_DETAIL} element={<EmployeeDetailPage />} />
        <Route path={ROUTE_PATHS.ATTENDANCE} element={<AttendanceOverviewPage />} />
        <Route path={ROUTE_PATHS.SHIFTS} element={<ShiftTemplatesPage />} />
        <Route path={ROUTE_PATHS.LEAVES} element={<LeaveRequestsPage />} />
        <Route path={ROUTE_PATHS.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTE_PATHS.SETTINGS} element={<SettingsPage />} />

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
