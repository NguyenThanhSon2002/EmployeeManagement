import React, { useState } from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import {
  KeyRound,
  X,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  PhoneCall,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useModalFocusTrap<HTMLDivElement>({ isOpen, onClose });
  const { addToast } = useUIStore();

  const [identifier, setIdentifier] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setIdentifier('');
    setNote('');
    setErrorMsg(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Vui lòng nhập Mã nhân viên hoặc Email đăng ký tài khoản.');
      return;
    }

    setIsLoading(true);

    // Giả lập gửi yêu cầu hỗ trợ nội bộ tới Admin/HR
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      addToast({
        type: 'success',
        title: 'Đã tiếp nhận yêu cầu',
        message: 'Yêu cầu cấp lại mật khẩu của bạn đã được gửi tới Ban quản trị.',
      });
    }, 700);
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetForm();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-modal-title"
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 10px 10px -5px rgba(15, 23, 42, 0.1)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInModal 0.2s ease-out',
        }}
      >
        <style>{`
          @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h2
                id="forgot-password-modal-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                Quên mật khẩu?
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
                Yêu cầu cấp lại mật khẩu tài khoản làm việc
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            aria-label="Đóng popup"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                Đã tiếp nhận yêu cầu!
              </h3>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                Yêu cầu cấp lại mật khẩu của tài khoản <strong>{identifier}</strong> đã được gửi tới Quản trị viên & Phòng Nhân sự. Chúng tôi sẽ liên hệ hỗ trợ bạn trong thời gian sớm nhất.
              </p>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 12.5,
                  color: '#64748B',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 20,
                  border: '1px solid #E2E8F0',
                }}
              >
                <PhoneCall size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                <span>
                  Trường hợp cần hỗ trợ khẩn cấp để kịp vào ca làm, vui lòng liên hệ trực tiếp Quản lý chi nhánh hoặc Hotline phòng IT: <strong>1900 6868</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                Đã hiểu & Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {errorMsg && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#B91C1C',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12.5,
                  color: '#475569',
                  lineHeight: 1.45,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <HelpCircle size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                <span>
                  Hệ thống phân ca nội bộ yêu cầu xác minh danh tính qua Quản trị viên/HR để đảm bảo an toàn bảo mật.
                </span>
              </div>

              <div>
                <label
                  htmlFor="forgot-identifier"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Mã nhân viên hoặc Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    id="forgot-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="VD: emp001 hoặc nv.son@company.com"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px 0 38px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="forgot-note"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Ghi chú bổ sung (tùy chọn)
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: 12,
                      color: '#94A3B8',
                    }}
                  />
                  <textarea
                    id="forgot-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Quên mật khẩu ca làm việc tại Chi nhánh 1, số điện thoại liên hệ..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1.6,
                    height: 42,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi yêu cầu hỗ trợ'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
