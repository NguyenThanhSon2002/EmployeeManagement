import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Layers,
  Palmtree,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '@/shared/store/useUIStore';
import { ROUTE_PATHS } from '@/routes/route-paths';

interface NavSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'VẬN HÀNH & ĐIỀU ĐỘ',
    items: [
      {
        path: ROUTE_PATHS.SCHEDULE,
        label: 'Lịch Phân Ca',
        icon: <CalendarDays size={18} />,
      },
      {
        path: ROUTE_PATHS.DASHBOARD,
        label: 'Tổng Quan',
        icon: <LayoutDashboard size={18} />,
      },
      {
        path: ROUTE_PATHS.ATTENDANCE,
        label: 'Chấm Công',
        icon: <Clock size={18} />,
      },
    ],
  },
  {
    title: 'QUẢN TRỊ ĐỘI NGŨ',
    items: [
      {
        path: ROUTE_PATHS.EMPLOYEES,
        label: 'Nhân Sự',
        icon: <Users size={18} />,
      },
      {
        path: ROUTE_PATHS.BRANCHES,
        label: 'Chi Nhánh',
        icon: <Building2 size={18} />,
      },
      {
        path: ROUTE_PATHS.SHIFTS,
        label: 'Mẫu Ca',
        icon: <Layers size={18} />,
      },
      {
        path: ROUTE_PATHS.LEAVES,
        label: 'Nghỉ Phép',
        icon: <Palmtree size={18} />,
      },
    ],
  },
  {
    title: 'PHÂN TÍCH & THIẾT LẬP',
    items: [
      {
        path: ROUTE_PATHS.REPORTS,
        label: 'Báo Cáo',
        icon: <BarChart3 size={18} />,
      },
      {
        path: ROUTE_PATHS.SETTINGS,
        label: 'Cài Đặt',
        icon: <Settings size={18} />,
      },
    ],
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
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '0' : '0 16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                letterSpacing: '-0.5px',
              }}
            >
              EMS
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 4 }}>
                EMS Workforce
                <Sparkles size={12} color="#F59E0B" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Enterprise Platform
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: '#F8FAFC',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            {!sidebarCollapsed && (
              <div
                style={{
                  padding: '4px 16px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </div>
            )}
            {sidebarCollapsed && sIdx > 0 && (
              <div
                style={{
                  height: 1,
                  backgroundColor: 'var(--color-border-subtle)',
                  margin: '8px 12px',
                }}
              />
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {section.items.map((item) => (
                <li key={item.path} style={{ margin: '2px 8px' }}>
                  <NavLink
                    to={item.path}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '13.5px',
                      borderLeft: isActive && !sidebarCollapsed ? '3px solid var(--color-primary)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)',
                      position: 'relative',
                    })}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
