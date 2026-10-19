import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { ROUTE_PATHS } from '@/routes/route-paths';
import {
  Lock,
  Eye,
  EyeOff,
  CalendarCheck2,
  ShieldCheck,
  Briefcase,
  UserCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Activity,
  CheckCircle2,
  HelpCircle,
  X,
  Sparkles,
  ChevronRight,
  Mail,
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

  // Modals
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (userToLogin = username, passToLogin = password) => {
    setErrorMessage(null);
    if (!userToLogin.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản hoặc email công việc.');
      return;
    }
    if (!passToLogin) {
      setErrorMessage('Vui lòng nhập mật khẩu đăng nhập.');
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
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ backend.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (uname: string, pword: string) => {
    setUsername(uname);
    setPassword(pword);
    setShowDemoModal(false);
    handleLogin(uname, pword);
  };

  const handleGoogleLogin = () => {
    // Demo Google SSO authentication
    handleQuickLogin('admin', 'Admin@123');
  };

  return (
    <div className="login-page-root">
      {/* Dynamic Scoped CSS for Split Layout & Animations */}
      <style>{`
        .login-page-root {
          min-height: 100vh;
          display: flex;
          background-color: #0B1120;
          font-family: var(--font-family, 'Be Vietnam Pro', 'Inter', -apple-system, sans-serif);
          overflow-x: hidden;
        }

        .login-hero-pane {
          flex: 1.15;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 44px 52px;
          background-color: #0B1120;
          background-image: 
            radial-gradient(1000px circle at 15% 20%, rgba(37, 99, 235, 0.28) 0%, transparent 60%),
            radial-gradient(800px circle at 85% 85%, rgba(14, 165, 233, 0.18) 0%, transparent 60%);
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
        }

        .login-hero-pane::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .login-form-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: #FFFFFF;
          padding: 40px 48px;
          position: relative;
          min-width: 440px;
        }

        .login-form-inner {
          width: 100%;
          max-width: 420px;
          margin: auto;
          padding: 20px 0;
        }

        .glass-metric-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 2;
        }

        .input-group-field {
          height: 44px;
          width: 100%;
          padding: 0 14px 0 42px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #0F172A;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .input-group-field:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .input-group-field::placeholder {
          color: #94A3B8;
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

        .btn-google-sso {
          height: 44px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #1E293B;
          font-size: 13.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .btn-google-sso:hover {
          background-color: #F8FAFC;
          border-color: #CBD5E1;
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.96); }
        }

        .pulse-beacon {
          animation: pulse-subtle 2.5s infinite ease-in-out;
        }

        @media (max-width: 1024px) {
          .login-hero-pane {
            display: none !important;
          }
          .login-form-pane {
            min-width: 100% !important;
            padding: 32px 24px !important;
          }
        }
      `}</style>

      {/* =================================================================== */}
      {/* LEFT COLUMN: HERO SHOWCASE & TELEMETRY (Inspired by Reference UI) */}
      {/* =================================================================== */}
      <div className="login-hero-pane">
        {/* Top Header: Brand & Version */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
              }}
            >
              <CalendarCheck2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  HRMS Phân Ca
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#93C5FD',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                  }}
                >
                  Cloud
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: 11.5,
              color: '#94A3B8',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            Enterprise Suite • v3.4
          </div>
        </div>

        {/* Center: Main Pitch & Metric Dashboard Card */}
        <div style={{ margin: 'auto 0', zIndex: 2, padding: '24px 0' }}>
          {/* Tag pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 9999,
              backgroundColor: 'rgba(37, 99, 235, 0.18)',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#60A5FA',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            <Sparkles size={13} />
            HỆ THỐNG ĐIỀU PHỐI NHÂN SỰ THÔNG MINH
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.18,
              letterSpacing: '-0.03em',
              margin: '0 0 14px',
            }}
          >
            Mọi công cụ phân ca.
            <br />
            Tập trung trên một nền tảng.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.6,
              color: '#94A3B8',
              maxWidth: 480,
              margin: '0 0 32px',
            }}
          >
            Tự động hóa lịch trực, loại bỏ hoàn toàn xung đột thời gian làm việc và kiểm soát chuẩn hóa
            100% quy chuẩn nghỉ ngơi theo Luật Lao Động 2019.
          </p>

          {/* Telemetry / Live Metric Card Preview */}
          <div className="glass-metric-card">
            {/* Card Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8',
                  }}
                >
                  <Activity size={14} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                  Giám sát phân ca thời gian thực
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: '#34D399',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 6px #10B981',
                    }}
                  />
                  Đồng bộ 8 chi nhánh
                </span>
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#38BDF8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '3px 9px',
                  borderRadius: 9999,
                }}
              >
                +99.4% chính xác
              </div>
            </div>

            {/* Metric Row with Sparkline Wave */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#64748B',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  TỔNG GIỜ CÔNG ĐIỀU PHỐI
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                  }}
                >
                  1,420,890 <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8' }}>giờ/năm</span>
                </div>
              </div>

              {/* Glowing SVG Wave Sparkline */}
              <div style={{ width: 150, height: 42 }}>
                <svg width="150" height="42" viewBox="0 0 150 42" fill="none">
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38BDF8" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38BDF8" stopOpacity="0.25" />
                      <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M2 30 C 25 35, 45 8, 70 20 C 95 32, 115 10, 148 14 L 148 42 L 2 42 Z"
                    fill="url(#areaGrad)"
                  />
                  <path
                    d="M2 30 C 25 35, 45 8, 70 20 C 95 32, 115 10, 148 14"
                    stroke="url(#sparklineGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="148" cy="14" r="3.5" fill="#38BDF8" />
                </svg>
              </div>
            </div>

            {/* Bottom 3 Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                paddingTop: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B' }}>TỶ LỆ CHECK-IN</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginTop: 3 }}>
                  99.2% <span style={{ fontSize: 10.5, color: '#34D399', fontWeight: 600 }}>+1.8%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B' }}>LUẬT LAO ĐỘNG</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginTop: 3 }}>
                  100% <span style={{ fontSize: 10.5, color: '#94A3B8' }}>tuân thủ</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B' }}>NHÂN SỰ CA TRỰC</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginTop: 3 }}>
                  148 <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>/ 148 sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Operational Status & System Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block',
              }}
            />
            Hệ thống máy chủ vận hành 24/7 ổn định
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              An toàn dữ liệu
            </button>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              Trạng thái dịch vụ
            </button>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              Bảo mật
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT COLUMN: REFINED MODERN LOGIN FORM */}
      {/* =================================================================== */}
      <div className="login-form-pane">
        {/* Top Right Action: Support / Contact */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#64748B' }}>Chưa có tài khoản truy cập?</span>
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 6,
              padding: 0,
              fontSize: 13,
            }}
          >
            Liên hệ Phòng HR / IT
          </button>
        </div>

        {/* Center Form Section */}
        <div className="login-form-inner">
          {/* Form Header */}
          <div style={{ marginBottom: 26 }}>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                margin: '0 0 8px',
              }}
            >
              Chào mừng trở lại
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Đăng nhập để điều phối ca làm việc và quản lý nhân sự theo Luật Lao Động 2019.
            </p>
          </div>

          {/* Single Sign-on: Google Workspace */}
          <button
            type="button"
            className="btn-google-sso"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isLoading}
          >
            {/* Multi-colored Google SVG Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Tiếp tục với Google Workspace
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '22px 0',
              gap: 14,
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#94A3B8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              HOẶC ĐĂNG NHẬP VỚI TÀI KHOẢN
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: '13px',
                color: '#B91C1C',
                marginBottom: 20,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ lineHeight: 1.4 }}>{errorMessage}</span>
            </div>
          )}

          {/* Core Credentials Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* Username / Email Field */}
            <div>
              <label
                htmlFor="login-username-input"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: 6,
                }}
              >
                Tài khoản hoặc Email công việc
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#94A3B8"
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
                  placeholder="name@company.com hoặc username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <label
                  htmlFor="login-password-input"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12.5px',
                    color: '#2563EB',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#94A3B8"
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
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                  disabled={isSubmitting || isLoading}
                  autoComplete="current-password"
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#475569',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: '#2563EB',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                Duy trì đăng nhập trong 30 ngày
              </label>
            </div>

            {/* Primary Action Button */}
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
          </form>

          {/* Secondary Enterprise / Demo Access Option */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13,
                fontWeight: 500,
                color: '#64748B',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ShieldCheck size={16} color="#3B82F6" />
              Đăng nhập qua Enterprise SSO / Tài khoản mẫu
            </button>
          </div>
        </div>

        {/* Bottom Security Compliance & Terms */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid #F1F5F9',
            fontSize: 12,
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="#10B981" />
            <span>Mã hóa SSL 256-bit</span>
            <span>•</span>
            <span>Tuân thủ Luật LĐ 2019</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
              }}
            >
              Điều khoản dịch vụ
            </button>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
              }}
            >
              Chính sách bảo mật
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: ELEGANT DEMO ROLE SELECTOR (Clean, On-Demand, No Ugly Clutter) */}
      {/* =================================================================== */}
      {showDemoModal && (
        <div className="modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, padding: '28px 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Chọn vai trò trải nghiệm hệ thống
                  </h3>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0' }}>
                    1-Click để tự động điền và đăng nhập nhanh vào tài khoản:
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowDemoModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Role Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {/* Option 1: Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#EDE9FE',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Giám đốc (Director)</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#7C3AED', backgroundColor: '#F5F3FF', padding: '1px 6px', borderRadius: 4 }}>Toàn quyền</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Toàn quyền điều hành hệ thống, nhân sự, tài khoản và xem báo cáo đa chi nhánh
                  </div>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>

              {/* Option 2: Branch Manager */}
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'Admin@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#FFEDD5',
                    color: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Quản lý cơ sở (Manager)</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#EA580C', backgroundColor: '#FFF7ED', padding: '1px 6px', borderRadius: 4 }}>Quản lý cơ sở</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Xếp ca tuần theo chi nhánh, duyệt chấm công, giải trình và quản lý nhân sự cơ sở
                  </div>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>

              {/* Option 3: Employee */}
              <button
                type="button"
                onClick={() => handleQuickLogin('employee', 'Admin@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserCheck size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Nhân viên (Employee)</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#059669', backgroundColor: '#F0FDF4', padding: '1px 6px', borderRadius: 4 }}>Cá nhân</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Xem ca làm cá nhân, đăng ký lịch khả dụng theo ma trận, chấm công và gửi đơn
                  </div>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: HR / IT SUPPORT INFORMATION */}
      {/* =================================================================== */}
      {showSupportModal && (
        <div className="modal-backdrop" onClick={() => setShowSupportModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, padding: '26px 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HelpCircle size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Trung tâm Hỗ trợ Doanh nghiệp
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowSupportModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Tài khoản người dùng trên hệ thống HRMS được quản trị và cấp phát tập trung theo danh sách nhân sự chính thức của công ty.
            </p>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 13,
                color: '#334155',
              }}
            >
              <div><strong>Email hỗ trợ IT:</strong> it-support@company.com</div>
              <div><strong>Phòng Nhân sự (HR):</strong> hr-admin@company.com</div>
              <div><strong>Hotline nội bộ:</strong> Ext. 1088 (08:00 - 18:00)</div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSupportModal(false)}
              style={{ width: '100%', marginTop: 20 }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: FORGOT PASSWORD GUIDANCE */}
      {/* =================================================================== */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, padding: '26px 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Khôi phục mật khẩu tài khoản
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowForgotModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Nhằm đảm bảo an toàn thông tin và tính toàn vẹn của lịch phân ca trực, mật khẩu tài khoản nội bộ chỉ được cấp lại thông qua phê duyệt của Quản trị viên hệ thống hoặc Trưởng bộ phận.
            </p>

            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 12.5,
                color: '#1E40AF',
                lineHeight: 1.5,
              }}
            >
              💡 Vui lòng gửi yêu cầu đặt lại mật khẩu kèm mã nhân viên (EMP Code) đến hộp thư <strong>it-support@company.com</strong> để được xử lý trong vòng 15 phút.
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForgotModal(false)}
              style={{ width: '100%', marginTop: 20 }}
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
