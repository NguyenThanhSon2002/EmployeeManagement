import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Clock,
  Layers,
  Palmtree,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { ROUTE_PATHS } from '@/routes/route-paths';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  {
    path: ROUTE_PATHS.SCHEDULE,
    label: 'Lịch Phân Ca',
    icon: <CalendarDays size={20} />,
  },
  {
    path: ROUTE_PATHS.DASHBOARD,
    label: 'Tổng Quan',
    icon: <LayoutDashboard size={20} />,
  },
  {
    path: ROUTE_PATHS.EMPLOYEES,
    label: 'Nhân Sự',
    icon: <Users size={20} />,
  },
  {
    path: ROUTE_PATHS.ATTENDANCE,
    label: 'Chấm Công',
    icon: <Clock size={20} />,
  },
  {
    path: ROUTE_PATHS.SHIFTS,
    label: 'Mẫu Ca',
    icon: <Layers size={20} />,
  },
  {
    path: ROUTE_PATHS.LEAVES,
    label: 'Nghỉ Phép',
    icon: <Palmtree size={20} />,
  },
  {
    path: ROUTE_PATHS.REPORTS,
    label: 'Báo Cáo',
    icon: <BarChart3 size={20} />,
  },
  {
    path: ROUTE_PATHS.SETTINGS,
    label: 'Cài Đặt',
    icon: <Settings size={20} />,
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      aria-label="Thanh điều hướng chính"
      style={{
        width: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '0' : '0 var(--space-md)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              EMS
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-body-md)', lineHeight: 1.2 }}>
                EMS Portal
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Workforce Management
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: 'var(--space-xs) 0', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {MENU_ITEMS.map((item) => (
            <li key={item.path} style={{ margin: '2px 8px' }}>
              <NavLink
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-info-bg)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--font-body)',
                  borderLeft: isActive && !sidebarCollapsed ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Branding Info */}
      {!sidebarCollapsed && (
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <div>Phiên bản 1.0.0 (Demo)</div>
          <div>WCAG 2.1 AA Compliant</div>
        </div>
      )}
    </aside>
  );
};
