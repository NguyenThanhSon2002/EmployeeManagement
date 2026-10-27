import React, { useState } from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useUIStore } from '@/shared/store/useUIStore';
import { authService } from '@/shared/auth/authService';
import { employeeService } from '@/features/employees/api/employeeService';
import { KeyRound, Eye, EyeOff, X, Check, ShieldAlert } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** ID của nhân viên đang xem hồ sơ */
  employeeId: number;
  /** Tên đầy đủ của nhân viên */
  employeeName: string;
  /** Người dùng đang tự đổi mật khẩu cho chính mình */
  isSelf: boolean;
  /** Giám đốc đang reset mật khẩu cho nhân viên khác */
  isDirectorReset?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  isSelf,
  isDirectorReset = false,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const { addToast } = useUIStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (isSelf && !currentPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }

    if (isSelf && currentPassword === newPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSelf) {
        await authService.changePassword(currentPassword, newPassword);
        addToast({
          type: 'success',
          title: 'Đổi mật khẩu thành công',
          message: 'Mật khẩu tài khoản của bạn đã được cập nhật thành công.',
        });
      } else {
        await employeeService.resetPassword(employeeId, newPassword);
        addToast({
          type: 'success',
          title: 'Đặt lại mật khẩu thành công',
          message: `Đã cấp mật khẩu mới cho tài khoản của nhân viên ${employeeName}.`,
        });
      }

      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu';
      setErrorMsg(msg);
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-password-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isSelf ? '#F8FAFC' : '#FEF3C7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: isSelf ? '#EFF6FF' : '#FDE68A',
                color: isSelf ? '#2563EB' : '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3
                id="modal-password-title"
                style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}
              >
                {isSelf ? 'Cập Nhật Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                {isSelf
                  ? 'Đổi mật khẩu bảo vệ tài khoản cá nhân của bạn'
                  : `Cấp lại mật khẩu cho nhân viên ${employeeName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#94A3B8',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {isDirectorReset && !isSelf && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                fontSize: 12,
                color: '#92400E',
                marginBottom: 16,
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Quyền Quản trị viên:</strong> Bạn đang đặt lại mật khẩu cho tài khoản người dùng của nhân viên mà không cần mật khẩu cũ.
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                fontSize: 13,
                color: '#DC2626',
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Current Password (Chỉ hiển thị nếu tự đổi) */}
          {isSelf && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: 6,
                }}
              >
                Mật khẩu hiện tại <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    fontSize: 14,
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 12px',
                  fontSize: 14,
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus={!isSelf}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Xác nhận mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 12px',
                  fontSize: 14,
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: 'var(--color-primary, #2563EB)',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
