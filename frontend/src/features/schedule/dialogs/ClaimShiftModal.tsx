import React, { useState } from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  UserCheck,
} from 'lucide-react';

export interface ClaimShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ShiftTemplate | null;
  workDate: string;
  onConfirm: (selfVolunteeredConfirm?: boolean) => Promise<{
    success: boolean;
    error?: string;
    warningMessage?: string;
    needsConfirm?: boolean;
  }>;
}

export const ClaimShiftModal: React.FC<ClaimShiftModalProps> = ({
  isOpen,
  onClose,
  template,
  workDate,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const { currentUser } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isVolunteered, setIsVolunteered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setWarningMessage(null);
      setIsVolunteered(false);
      setErrorMessage(null);
    }
  }, [isOpen, template, workDate]);

  if (!isOpen || !template) return null;

  const handleClaim = async (volunteeredConfirm: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onConfirm(volunteeredConfirm);
      if (res.success) {
        onClose();
      } else if (res.needsConfirm) {
        setWarningMessage(
          res.warningMessage ||
            'Khoảng cách nghỉ giữa ca làm việc này và ca liền kề dưới mức tiêu chuẩn. Bạn có đồng ý tự nguyện nhận ca không?'
        );
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none',
          width: 500,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F0F9FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3
                id="claim-modal-title"
                style={{ fontSize: 16, fontWeight: 700, color: '#0369A1', margin: 0 }}
              >
                Đăng Ký Nhận Ca Trống
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                Tự thêm lịch làm việc của bạn vào ca còn thiếu định biên.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Shift Details Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                {template.shiftName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                }}
              >
                Định biên: {template.minStaffing} - {template.maxStaffing || template.minStaffing} NV
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 10,
                fontSize: 13,
                color: '#475569',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={15} color="#0284C7" />
                <span>Ngày: <strong>{workDate}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={15} color="#0284C7" />
                <span>
                  Giờ làm: <strong>{template.startTime} - {template.endTime}</strong>
                  {template.isCrossMidnight && ' (+1 ngày)'}
                </span>
              </div>
            </div>

            {currentUser && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px dashed #CBD5E1',
                  fontSize: 12,
                  color: '#64748B',
                }}
              >
                Nhân sự đăng ký: <strong style={{ color: '#0F172A' }}>{currentUser.fullName}</strong> ({currentUser.employeeCode || 'NV'})
              </div>
            )}
          </div>

          {/* Hard Error Banner */}
          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 13,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>Không thể nhận ca</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Voluntary Confirmation Warning Banner */}
          {warningMessage && (
            <div
              style={{
                padding: '14px',
                borderRadius: 12,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong style={{ display: 'block', color: '#92400E', marginBottom: 2 }}>
                    Cảnh báo thời gian nghỉ giữa 2 ca
                  </strong>
                  <span>{warningMessage}</span>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#78350F',
                  cursor: 'pointer',
                  paddingTop: 6,
                  borderTop: '1px dashed #FCD34D',
                }}
              >
                <input
                  type="checkbox"
                  checked={isVolunteered}
                  onChange={(e) => setIsVolunteered(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Tôi xác nhận tự nguyện đăng ký ca làm này và đảm bảo sức khỏe.
              </label>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn btn-default"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ height: 36, padding: '0 16px', fontSize: 13, borderRadius: 8 }}
          >
            Hủy
          </button>

          {warningMessage ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isVolunteered || isSubmitting}
              onClick={() => handleClaim(true)}
              style={{
                height: 36,
                padding: '0 16px',
                fontSize: 13,
                borderRadius: 8,
                backgroundColor: isVolunteered ? '#D97706' : '#CBD5E1',
                borderColor: isVolunteered ? '#B45309' : '#CBD5E1',
                cursor: isVolunteered && !isSubmitting ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Xác nhận tự nguyện nhận ca
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={() => handleClaim(false)}
              style={{
                height: 36,
                padding: '0 18px',
                fontSize: 13,
                borderRadius: 8,
                backgroundColor: '#0284C7',
                borderColor: '#0369A1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Đăng ký ca này
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
