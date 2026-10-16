import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/shared/store/useUIStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-layout)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Canvas Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        {/* Sticky Topbar */}
        <Topbar />

        {/* Content View */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            maxWidth: 1600,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Modern Floating Toast Notification Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 'var(--z-toast)',
          maxWidth: 400,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let borderColor = 'var(--color-info-border)';
          let bgColor = 'rgba(255, 255, 255, 0.96)';
          let icon = <Info size={18} color="var(--color-primary)" />;

          if (toast.type === 'success') {
            borderColor = '#A7F3D0';
            icon = <CheckCircle2 size={18} color="#10B981" />;
          } else if (toast.type === 'warning') {
            borderColor = '#FDE68A';
            icon = <AlertTriangle size={18} color="#F59E0B" />;
          } else if (toast.type === 'error') {
            borderColor = '#FECACA';
            icon = <AlertCircle size={18} color="#EF4444" />;
          }

          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                fontSize: 'var(--font-caption)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                pointerEvents: 'auto',
                animation: 'slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span style={{ marginTop: 2, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                {toast.title && (
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: 2 }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4, fontSize: '12px' }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
