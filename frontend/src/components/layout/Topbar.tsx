import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { RoleSwitcher } from './RoleSwitcher';
import { UserProfileDropdown } from './UserProfileDropdown';
import { Clock, ChevronDown } from 'lucide-react';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentUser, currentRole, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = format(currentTime, 'HH:mm:ss');
  const dateFormatted = format(currentTime, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi });

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
      {/* Left: System Title, Branch Scope & Operational Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            Hệ Thống Quản Lý Phân Ca & Nhân Sự
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Chi nhánh Cầu Giấy (CN_CAUGIAY)
            </span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>Hệ thống sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Clock, Role Switcher, User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Real-time Clock GMT+7 with Tabular Monospace */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-xs)',
            fontSize: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
          }}
          title="Thời gian chuẩn hệ thống (GMT+7)"
        >
          <Clock size={14} color="var(--color-primary)" />
          <span
            style={{
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
            }}
          >
            {timeFormatted}
          </span>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <span style={{ textTransform: 'capitalize', fontSize: 12 }}>{dateFormatted}</span>
        </div>

        {/* Interactive Role Switcher */}
        <RoleSwitcher />

        {/* Interactive User Profile Capsule & Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
            }}
            title="Tùy chọn tài khoản cá nhân & Đăng xuất"
            role="button"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt={currentUser.fullName}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '2px solid var(--color-primary-light)',
              }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>
                {currentUser.employeeCode}
              </div>
            </div>
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
