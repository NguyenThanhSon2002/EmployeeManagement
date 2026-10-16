import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import type { RoleType } from '@/types/domain.types';
import { ShieldCheck, UserCheck, User, ChevronDown } from 'lucide-react';

interface RoleOption {
  role: RoleType;
  label: string;
  badge: string;
  icon: React.ReactNode;
}

const ROLES: RoleOption[] = [
  {
    role: 'ROLE_ADMIN',
    label: 'Quản Trị Viên (Admin)',
    badge: 'Toàn quyền điều hành',
    icon: <ShieldCheck size={16} color="#2563EB" />,
  },
  {
    role: 'ROLE_DEPT_MANAGER',
    label: 'Trưởng Nhóm / Quản Lý',
    badge: 'Duyệt đơn & Phân ca',
    icon: <UserCheck size={16} color="#10B981" />,
  },
  {
    role: 'ROLE_EMPLOYEE',
    label: 'Nhân Viên (Employee)',
    badge: 'Chỉ xem lịch & Điểm danh',
    icon: <User size={16} color="#F59E0B" />,
  },
];

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole } = useAuthStore();
  const { addToast } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = ROLES.find((r) => r.role === currentRole) || ROLES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-default"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Chuyển đổi vai trò người dùng"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: '12.5px',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {activeOption.icon}
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{activeOption.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 250,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-dropdown)',
            padding: 6,
            animation: 'scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid var(--color-border-subtle)',
              marginBottom: 4,
            }}
          >
            Mô phỏng góc nhìn người dùng:
          </div>
          {ROLES.map((item) => {
            const isSelected = item.role === currentRole;
            return (
              <button
                key={item.role}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setRole(item.role);
                  setIsOpen(false);
                  addToast({
                    type: 'info',
                    title: 'Chuyển đổi vai trò',
                    message: `Đang kết nối phiên làm việc với vai trò: ${item.label}`,
                  });
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontSize: '12.5px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {item.icon}
                  <div>
                    <div style={{ fontWeight: isSelected ? 600 : 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: isSelected ? 0.8 : 1 }}>
                      {item.badge}
                    </div>
                  </div>
                </div>
                {isSelected && <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
