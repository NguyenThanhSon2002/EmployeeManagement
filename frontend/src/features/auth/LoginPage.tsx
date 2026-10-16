import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { ROUTE_PATHS } from '@/routes/route-paths';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CalendarCheck2,
  ShieldCheck,
  Briefcase,
  UserCheck,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (userToLogin = username, passToLogin = password) => {
    setErrorMessage(null);
    if (!userToLogin.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản.');
      return;
    }
    if (!passToLogin) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(userToLogin.trim(), passToLogin);
      if (success) {
        addToast({
          type: 'success',
          title: 'Đăng nhập thành công',
          message: `Chào mừng trở lại hệ thống, ${userToLogin}!`,
        });
        navigate(ROUTE_PATHS.SCHEDULE);
      } else {
        setErrorMessage('Tên tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại backend.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (uname: string, pword: string) => {
    setUsername(uname);
    setPassword(pword);
    handleLogin(uname, pword);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        backgroundImage: `
          radial-gradient(at 10% 20%, rgba(37, 99, 235, 0.15) 0px, transparent 50%),
          radial-gradient(at 90% 80%, rgba(79, 70, 229, 0.15) 0px, transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'var(--font-family-base, sans-serif)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: 'var(--color-primary, #2563EB)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.15)',
            }}
          >
            <CalendarCheck2 size={28} />
          </div>

          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            HỆ THỐNG HRMS PHÂN CA
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Đăng nhập để điều phối ca làm việc và quản lý nhân sự theo Luật Lao Động 2019
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '13px',
              color: '#B91C1C',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {/* Username Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Tài khoản người dùng
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="input-base"
                placeholder="Nhập username (admin, manager, employee)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', paddingLeft: 38, height: 42, fontSize: 13.5 }}
                disabled={isSubmitting || isLoading}
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Mật khẩu bảo mật
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-base"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: 38, paddingRight: 38, height: 42, fontSize: 13.5 }}
                disabled={isSubmitting || isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-primary, #2563EB)', width: 15, height: 15 }}
              />
              Ghi nhớ phiên đăng nhập
            </label>
            <span style={{ fontSize: 12, color: 'var(--color-primary, #2563EB)', fontWeight: 500 }}>
              Mặc định: Admin@123
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoading}
            style={{
              height: 44,
              fontSize: 14,
              fontWeight: 700,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập hệ thống'
            )}
          </button>
        </form>

        {/* Quick Access Helper */}
        <div
          style={{
            marginTop: 26,
            padding: '14px 16px',
            backgroundColor: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⚡ Đăng nhập nhanh 1-Click (Tài khoản mẫu):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'Admin@123')}
              disabled={isSubmitting || isLoading}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border: '1px solid #DDD6FE',
                backgroundColor: '#EDE9FE',
                color: '#6D28D9',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'transform 0.1s ease',
              }}
              title="Đăng nhập tài khoản Quản trị viên"
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager', 'Admin@123')}
              disabled={isSubmitting || isLoading}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border: '1px solid #FED7AA',
                backgroundColor: '#FFEDD5',
                color: '#C2410C',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'transform 0.1s ease',
              }}
              title="Đăng nhập tài khoản Trưởng phòng"
            >
              <Briefcase size={16} />
              <span>Trưởng phòng</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('employee', 'Admin@123')}
              disabled={isSubmitting || isLoading}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'transform 0.1s ease',
              }}
              title="Đăng nhập tài khoản Nhân viên"
            >
              <UserCheck size={16} />
              <span>Nhân viên</span>
            </button>
          </div>
        </div>

        {/* Registration Notice */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            fontSize: '11.5px',
            color: '#64748B',
            lineHeight: 1.45,
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: '#94A3B8' }} />
          <span>
            Tài khoản nội bộ được quản trị và cấp quyền bởi Ban Giám đốc & Phòng Nhân sự. Để yêu cầu cấp mới tài khoản hoặc đổi quyền, vui lòng liên hệ Bộ phận IT/HR.
          </span>
        </div>
      </div>
    </div>
  );
};
