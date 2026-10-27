import React, { useState, useEffect } from 'react';
import type { ShiftAssignment, Employee, ShiftTemplate, ScheduleConflict } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { formatDateVi } from '@/utils/date.utils';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  FileText,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  Trash2,
} from 'lucide-react';

export interface OverrideReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ShiftAssignment | null;
  employee: Employee | null;
  template: ShiftTemplate | null;
  conflicts?: ScheduleConflict[];
  onSaveReason: (
    assignmentId: number,
    overrideReason: string | null,
    overrideRule?: string
  ) => Promise<boolean | void> | void;
}

const MAX_WORDS = 1000;

const countWords = (text: string): number => {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
};

const PRESET_REASONS = [
  'Tăng cường ca đông khách',
  'Đào tạo kèm cặp nhân viên mới',
  'Trực thay nhân sự vắng đột xuất',
  'Phục vụ sự kiện / tiệc cao điểm',
];

export const OverrideReasonModal: React.FC<OverrideReasonModalProps> = ({
  isOpen,
  onClose,
  assignment,
  employee,
  template,
  conflicts = [],
  onSaveReason,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const wordCount = countWords(reason);
  const isOverLimit = wordCount > MAX_WORDS;

  useEffect(() => {
    if (isOpen && assignment) {
      setReason(assignment.overrideReason || '');
      setErrorMessage('');
    }
  }, [isOpen, assignment?.id]);

  if (!isOpen || !assignment) return null;

  const relevantConflicts = conflicts.filter(
    (c) =>
      c.employeeId === assignment.employeeId &&
      c.workDate === assignment.workDate
  );

  const capacityWarning = relevantConflicts.find(
    (c) => c.ruleCode === 'WARN_STAFFING_CAPACITY'
  );

  const handleSelectPreset = (text: string) => {
    setReason((prev) => {
      const current = prev.trim();
      if (!current) return text;
      if (current.includes(text)) return current;
      return `${current}; ${text}`;
    });
    setErrorMessage('');
  };

  const handleSave = async () => {
    const trimmed = reason.trim();
    const count = countWords(trimmed);
    if (count > MAX_WORDS) {
      setErrorMessage(`Nội dung giải trình không được vượt quá ${MAX_WORDS} từ (hiện tại: ${count} từ).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const finalReason = trimmed.length > 0 ? trimmed : null;
      const ruleCode = finalReason
        ? (capacityWarning ? 'WARN_STAFFING_CAPACITY' : (assignment.overrideRule || 'WARN_STAFFING_CAPACITY'))
        : undefined;
      const res = await onSaveReason(assignment.id, finalReason, ruleCode);
      if (res !== false) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu giải trình.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveReason = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await onSaveReason(assignment.id, null, undefined);
      if (res !== false) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi xóa giải trình.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = employee?.fullName || `Nhân viên #${assignment.employeeId}`;
  const shiftName = assignment.snapshotShiftName || template?.shiftName || 'Ca làm việc';
  const shiftTime = `${assignment.snapshotStartTime || template?.startTime || '--:--'} - ${
    assignment.snapshotEndTime || template?.endTime || '--:--'
  }`;

  return (
    <div
      className="drawer-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 'var(--z-modal, 1100)',
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
        aria-labelledby="override-dialog-heading"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none',
          width: 520,
          maxWidth: '95vw',
          maxHeight: '90vh',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 'calc(var(--z-modal, 1100) + 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h2
                id="override-dialog-heading"
                style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}
              >
                Giải Trình Phân Ca Đặc Cách
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                Ghi nhận lý do bổ sung nhân sự vượt định biên vào ca làm việc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card Thông Tin Nhân Sự & Ca Làm Việc */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserAvatar
                name={displayName}
                src={employee?.avatarUrl}
                size={34}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                  {displayName}
                  {employee?.employeeCode && (
                    <span style={{ fontSize: '12px', color: '#64748B', marginLeft: 6, fontWeight: 400 }}>
                      ({employee.employeeCode})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: 1 }}>
                  {assignment.branchName || 'Chi nhánh hiện tại'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                paddingTop: 8,
                borderTop: '1px solid #CBD5E1',
                fontSize: '12px',
                color: '#334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color="#2563EB" />
                <span style={{ fontWeight: 600 }}>{shiftName}</span>
                <span>({shiftTime})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} color="#64748B" />
                <span>{formatDateVi(assignment.workDate)}</span>
              </div>
            </div>
          </div>

          {/* Cảnh Báo Vượt Định Biên Nếu Có */}
          {capacityWarning ? (
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                color: '#92400E',
                fontSize: '12.5px',
                lineHeight: 1.4,
              }}
            >
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>Cảnh báo vượt định biên:</strong>
                {capacityWarning.message}
              </div>
            </div>
          ) : relevantConflicts.length > 0 ? (
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                color: '#92400E',
                fontSize: '12.5px',
                lineHeight: 1.4,
              }}
            >
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>Cảnh báo xếp ca:</strong>
                {relevantConflicts.map((c, idx) => (
                  <div key={idx}>• {c.message}</div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
                fontSize: '12px',
                alignItems: 'center',
              }}
            >
              <CheckCircle2 size={16} color="#16A34A" />
              <span>Ghi nhận giải trình hoặc ghi chú đặc thù cho ca làm việc này.</span>
            </div>
          )}

          {/* Mẫu Lý Do Nhanh (Preset Chips) */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: 8,
              }}
            >
              <Sparkles size={14} color="#F59E0B" />
              Gợi ý lý do giải trình nhanh:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#93C5FD';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Ô Nhập Nội Dung Giải Trình */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                htmlFor="override-reason-textarea"
                style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}
              >
                Nội dung giải trình <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {reason.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setReason('');
                      setErrorMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Xóa trắng
                  </button>
                )}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isOverLimit ? 600 : 400,
                    color:
                      reason.trim().length === 0
                        ? '#64748B'
                        : isOverLimit
                        ? '#EF4444'
                        : '#16A34A',
                  }}
                >
                  {reason.trim().length === 0
                    ? '(Để trống = Bỏ giải trình)'
                    : `${wordCount}/${MAX_WORDS} từ ${isOverLimit ? '(Vượt quá 1000 từ)' : ''}`}
                </span>
              </div>
            </div>
            <textarea
              id="override-reason-textarea"
              rows={4}
              value={reason}
              spellCheck={false}
              autoComplete="off"
              autoFocus
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Nhập lý do phân bổ đặc cách hoặc bổ sung nhân sự vào ca này (cho phép tự do chỉnh sửa, tối đa 1000 từ)..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: errorMessage ? '1px solid #EF4444' : '1px solid #CBD5E1',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!errorMessage) e.target.style.borderColor = '#2563EB';
              }}
              onBlur={(e) => {
                if (!errorMessage) e.target.style.borderColor = '#CBD5E1';
              }}
            />
            {errorMessage && (
              <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0 0' }}>
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            {Boolean(assignment.overrideReason) && (
              <button
                type="button"
                onClick={handleRemoveReason}
                disabled={isSubmitting}
                style={{
                  padding: '7px 12px',
                  fontSize: '12.5px',
                  color: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 6,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 500,
                }}
              >
                <Trash2 size={14} />
                Xóa giải trình
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '7px 14px',
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={
                isSubmitting ||
                isOverLimit ||
                (!assignment.overrideReason && reason.trim().length === 0)
              }
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor:
                  isSubmitting ||
                  isOverLimit ||
                  (!assignment.overrideReason && reason.trim().length === 0)
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  isSubmitting ||
                  isOverLimit ||
                  (!assignment.overrideReason && reason.trim().length === 0)
                    ? 0.6
                    : 1,
              }}
            >
              {isSubmitting
                ? 'Đang lưu...'
                : reason.trim().length === 0
                ? 'Lưu (Bỏ giải trình)'
                : 'Lưu giải trình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
