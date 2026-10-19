import React, { useEffect, useRef } from 'react';
import type { Employee, RoleType } from '@/types/domain.types';
import { User, Settings, LogOut, ShieldCheck, Briefcase } from 'lucide-react';

interface UserProfileDropdownProps {
  isOpen: boolean;
  user: Employee;
  role: RoleType;
  onClose: () => void;
  onLogout: () => void;
  onViewProfile: () => void;
  onOpenSettings?: () => void;
}

const getRoleBadge = (role: RoleType) => {
  switch (role) {
    case 'ROLE_DIRECTOR':
      return {
        label: 'Giám đốc',
        icon: <ShieldCheck size={12} />,
        bg: '#EDE9FE',
        color: '#6D28D9',
        border: '#DDD6FE',
      };
    case 'ROLE_MANAGER':
      return {
        label: 'Quản lý cơ sở',
        icon: <Briefcase size={12} />,
        bg: '#FFEDD5',
        color: '#C2410C',
        border: '#FED7AA',
      };
    case 'ROLE_EMPLOYEE':
    default:
      return {
        label: 'Nhân viên',
        icon: <User size={12} />,
        bg: '#F1F5F9',
        color: '#475569',
        border: '#E2E8F0',
      };
  }
};

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  user,
  role,
  onClose,
  onLogout,
  onViewProfile,
  onOpenSettings,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleBadge = getRoleBadge(role);

  return (
    <div
      ref={dropdownRef}
      className="card animate-fade-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 290,
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        border: '1px solid var(--color-border, #E2E8F0)',
        zIndex: 1100,
        overflow: 'hidden',
        padding: 0,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {/* Header Profile Identity */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <img
          src={
            user.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
          }
          alt={user.fullName}
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-full, 9999px)',
            objectFit: 'cover',
            border: '2px solid #E2E8F0',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-text-primary, #0F172A)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.fullName}
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--color-text-secondary, #64748B)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 1,
            }}
          >
            {user.email || user.employeeCode}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full, 9999px)',
              backgroundColor: roleBadge.bg,
              color: roleBadge.color,
              border: `1px solid ${roleBadge.border}`,
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {roleBadge.icon}
            <span>{roleBadge.label}</span>
          </div>
        </div>
      </div>

      {/* Menu Actions */}
      <div style={{ padding: '6px' }}>
        <button
          type="button"
          onClick={onViewProfile}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius-md, 6px)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--color-text-primary, #1E293B)',
            textAlign: 'left',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          role="menuitem"
        >
          <User size={16} color="var(--color-primary, #2563EB)" />
          <span>Hồ sơ của tôi</span>
        </button>

        {role === 'ROLE_DIRECTOR' && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-md, 6px)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--color-text-primary, #1E293B)',
              textAlign: 'left',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            role="menuitem"
          >
            <Settings size={16} color="#64748B" />
            <span>Cài đặt hệ thống</span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'var(--color-border-subtle, #F1F5F9)' }} />

      {/* Footer Logout Action */}
      <div style={{ padding: '6px' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius-md, 6px)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            color: '#DC2626',
            textAlign: 'left',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          role="menuitem"
        >
          <LogOut size={16} color="#DC2626" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );
};
