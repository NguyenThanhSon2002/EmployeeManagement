import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { getDefaultLandingRoute } from '@/routes/route-paths';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CalendarCheck2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [username, setUsername] = useState(() => localStorage.getItem('saved_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLoading) return;
    setErrorMessage(null);

    const userClean = username.trim();
    if (!userClean) {
      setErrorMessage('Vui lòng nhập mã nhân viên hoặc tài khoản.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu đăng nhập.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(userClean, password);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('saved_username', userClean);
        } else {
          localStorage.removeItem('saved_username');
        }

        addToast({
          type: 'success',
          title: 'Đăng nhập thành công',
          message: `Chào mừng trở lại hệ thống, ${userClean}!`,
        });
        const role = useAuthStore.getState().currentRole;
        navigate(getDefaultLandingRoute(role), { replace: true });
      } else {
        setErrorMessage('Tên tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ backend.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-root-container">
      <style>{`
        .login-root-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-layout, #F8FAFC);
          font-family: var(--font-family, 'Be Vietnam Pro', 'Inter', -apple-system, sans-serif);
          padding: 24px 16px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background-color: var(--color-surface, #FFFFFF);
          border-radius: var(--radius-xl, 16px);
          border: 1px solid var(--color-border, #E2E8F0);
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
          padding: 36px 32px;
          margin-top: 24px;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px 20px;
          }
        }

        .input-group-field {
          height: 44px;
          width: 100%;
          padding: 0 14px 0 42px;
          border-radius: 10px;
          border: 1px solid var(--color-border, #E2E8F0);
          background-color: var(--color-surface, #FFFFFF);
          color: var(--color-text-primary, #0F172A);
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          box-sizing: border-box;
        }

        .input-group-field:focus {
          outline: none;
          border-color: var(--color-primary, #2563EB);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .input-group-field::placeholder {
          color: var(--color-text-muted, #94A3B8);
          font-size: 13.5px;
        }

        .btn-submit-main {
          height: 46px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-size: 14.5px;
          font-weight: 700;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .btn-submit-main:hover:not(:disabled) {
          background: linear-gradient(180deg, #1D4ED8 0%, #1E40AF 100%);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
          transform: translateY(-1px);
        }

        .btn-submit-main:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit-main:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-pwd-toggle:focus-visible {
          outline: 2px solid var(--color-primary, #2563EB);
          border-radius: 4px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Top Header: System Title & Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.35)',
          }}
        >
          <CalendarCheck2 size={26} />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--color-text-primary, #0F172A)',
            letterSpacing: '-0.02em',
            margin: '14px 0 6px',
          }}
        >
          Hệ Thống Quản Lý Phân Ca & Nhân Sự
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #64748B)', margin: 0 }}>
          Đăng nhập để truy cập tài khoản làm việc
        </p>
      </div>

      {/* White Centered Login Card */}
      <div className="login-card">
        {/* Error Alert with ARIA */}
        {errorMessage && (
          <div
            id="login-error-alert"
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor: 'var(--color-error-bg, #FEF2F2)',
              border: '1px solid var(--color-error-border, #FECACA)',
              borderRadius: '8px',
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '13px',
              color: '#B91C1C',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ lineHeight: 1.4 }}>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Username / Employee Code Field */}
          <div>
            <label
              htmlFor="login-username-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #334155)',
                marginBottom: 6,
              }}
            >
              Tài khoản / Mã nhân viên
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--color-text-muted, #94A3B8)"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="login-username-input"
                type="text"
                className="input-group-field"
                placeholder="Ví dụ: EMP-001 hoặc admin"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting || isLoading}
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? 'login-error-alert' : undefined}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="login-password-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #334155)',
                marginBottom: 6,
              }}
            >
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--color-text-muted, #94A3B8)"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                className="input-group-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                style={{ paddingRight: 40 }}
                disabled={isSubmitting || isLoading}
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? 'login-error-alert' : undefined}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || isLoading}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
                  color: 'var(--color-text-muted, #94A3B8)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--color-text-secondary, #475569)',
                cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={isSubmitting || isLoading}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: 'var(--color-primary, #2563EB)',
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
                }}
              />
              Duy trì đăng nhập
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-submit-main"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang xác thực tài khoản...
              </>
            ) : (
              <>
                Đăng nhập hệ thống <ArrowRight size={17} />
              </>
            )}
          </button>

          {/* Default Password Hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: '12px',
              color: 'var(--color-text-muted, #64748B)',
              textAlign: 'center',
              lineHeight: 1.4,
              paddingTop: 4,
            }}
          >
            <span>
              💡 Mật khẩu mặc định: Mã nhân viên viết thường + <strong>@123</strong> (Ví dụ: <code style={{ backgroundColor: 'var(--color-bg-subtle, #F1F5F9)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', color: 'var(--color-text-primary, #0F172A)' }}>emp001@123</code>)
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
