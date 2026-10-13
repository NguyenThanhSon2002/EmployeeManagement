import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
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
    badge: 'Toàn quyền',
    icon: <ShieldCheck size={16} color="#1677FF" />,
  },
  {
    role: 'ROLE_DEPT_MANAGER',
    label: 'Trưởng Nhóm / Quản Lý',
    badge: 'Duyệt & Phân ca',
    icon: <UserCheck size={16} color="#52C41A" />,
  },
  {
    role: 'ROLE_EMPLOYEE',
    label: 'Nhân Viên (Employee)',
    badge: 'Chỉ xem / Điểm danh',
    icon: <User size={16} color="#FAAD14" />,
  },
];

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole } = useAuthStore();
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
          gap: 'var(--space-xs)',
          height: 34,
          padding: '0 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--font-caption)',
        }}
      >
        {activeOption.icon}
        <span style={{ fontWeight: 600 }}>{activeOption.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            width: 240,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 'var(--z-dropdown)',
            padding: 4,
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: 'var(--font-badge)',
              color: 'var(--color-text-muted)',
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
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--color-info-bg)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontSize: 'var(--font-caption)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.icon}
                  <div>
                    <div style={{ fontWeight: isSelected ? 600 : 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.badge}</div>
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
