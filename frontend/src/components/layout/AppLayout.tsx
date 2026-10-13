import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/store/useUIStore';
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
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 'var(--z-toast)',
          maxWidth: 380,
        }}
      >
        {toasts.map((toast) => {
          let borderColor = 'var(--color-info-border)';
          let bgColor = 'var(--color-surface)';
          let icon = <Info size={18} color="var(--color-primary)" />;

          if (toast.type === 'success') {
            borderColor = 'var(--color-success-border)';
            icon = <CheckCircle2 size={18} color="var(--color-success)" />;
          } else if (toast.type === 'warning') {
            borderColor = 'var(--color-warning-border)';
            icon = <AlertTriangle size={18} color="var(--color-warning)" />;
          } else if (toast.type === 'error') {
            borderColor = 'var(--color-error-border)';
            icon = <AlertCircle size={18} color="var(--color-error)" />;
          }

          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                fontSize: 'var(--font-caption)',
              }}
            >
              <span style={{ marginTop: 2 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                {toast.title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{toast.title}</div>}
                <div>{toast.message}</div>
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
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
