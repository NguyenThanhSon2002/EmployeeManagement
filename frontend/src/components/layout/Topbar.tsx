import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/store/useAuthStore';
import { RoleSwitcher } from './RoleSwitcher';
import { Clock } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

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
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
      }}
    >
      {/* Left: System Status / Portal Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div>
          <div style={{ fontSize: 'var(--font-body-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Hệ Thống Quản Lý Phân Ca & Nhân Sự
          </div>
          <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)' }}>
            Phân hệ: Phòng Vận hành Dịch vụ (DEPT-OPS)
          </div>
        </div>
      </div>

      {/* Right Controls: Real-time Clock, RoleSwitcher, User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        {/* Real-time Clock GMT+7 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            backgroundColor: 'var(--color-bg-layout)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
          }}
          title="Thời gian hệ thống chuẩn GMT+7"
        >
          <Clock size={14} color="var(--color-primary)" />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {timeFormatted}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
          <span style={{ textTransform: 'capitalize' }}>{dateFormatted}</span>
        </div>

        {/* Interactive Role Switcher */}
        <RoleSwitcher />

        {/* User Profile Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser.fullName}
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              border: '2px solid var(--color-border)',
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 'var(--font-caption)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {currentUser.fullName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {currentUser.employeeCode}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
