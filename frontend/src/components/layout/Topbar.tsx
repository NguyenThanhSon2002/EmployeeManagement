import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { UserProfileDropdown } from './UserProfileDropdown';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ChevronDown } from 'lucide-react';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentUser, currentRole, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header
      className="glass-surface"
      style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Left: System Title */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
          Hệ Thống Quản Lý Phân Ca & Nhân Sự
        </span>
      </div>

      {/* Right Controls: User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Interactive User Profile Capsule & Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsDropdownOpen((prev) => !prev);
              }
            }}
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 4px',
              backgroundColor: isDropdownOpen ? '#F1F5F9' : 'var(--color-surface)',
              border: `1px solid ${isDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            title="Tùy chọn tài khoản cá nhân & Đăng xuất"
            role="button"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
          >
            <UserAvatar
              name={currentUser?.fullName || 'User'}
              src={currentUser?.avatarUrl}
              size={32}
              border="2px solid var(--color-primary-light)"
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                maxWidth: 160,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser?.fullName}
            </span>
            <ChevronDown
              size={14}
              color="var(--color-text-secondary)"
              style={{
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                marginLeft: 2,
              }}
            />
          </div>

          <UserProfileDropdown
            isOpen={isDropdownOpen}
            user={currentUser}
            role={currentRole}
            onClose={() => setIsDropdownOpen(false)}
            onLogout={() => {
              setIsDropdownOpen(false);
              logout();
              addToast({
                type: 'info',
                title: 'Đã đăng xuất',
                message: 'Phiên làm việc đã kết thúc. Hẹn gặp lại bạn!',
              });
              navigate('/login');
            }}
            onViewProfile={() => {
              setIsDropdownOpen(false);
              navigate(`/employees/${currentUser.id}`);
            }}
            onOpenSettings={() => {
              setIsDropdownOpen(false);
              navigate('/settings');
            }}
          />
        </div>
      </div>
    </header>
  );
};
