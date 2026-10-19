import React from 'react';
import type { ScheduleConflict } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { Send, X, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface PublishConfirmDialogProps {
  isOpen: boolean;
  conflicts: Record<string, ScheduleConflict[]>;
  onClose: () => void;
  onConfirm: () => void;
}

export const PublishConfirmDialog: React.FC<PublishConfirmDialogProps> = ({
  isOpen,
  conflicts,
  onClose,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  if (!isOpen) return null;

  // Check if any mandatory conflict exists
  const allConflicts = Object.values(conflicts).flat();
  const mandatoryConflicts = allConflicts.filter((c) => c.severity === 'MANDATORY');
  const warningConflicts = allConflicts.filter((c) => c.severity === 'WARNING');

  const hasMandatory = mandatoryConflicts.length > 0;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="publish-dialog-heading"
        aria-modal="true"
        style={{ width: 480 }}
      >
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} color={hasMandatory ? 'var(--color-error)' : 'var(--color-primary)'} />
            <h2 id="publish-dialog-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Công Bố Lịch Làm Việc Tuần
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-lg)' }}>
          {hasMandatory ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                color: 'var(--shift-night-text)',
                display: 'flex',
                gap: 10,
              }}
            >
              <AlertOctagon size={24} color="var(--color-error)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>KHÔNG THỂ CÔNG BỐ LỊCH!</div>
                <div style={{ fontSize: 'var(--font-caption)', marginTop: 4 }}>
                  Hệ thống phát hiện còn <strong>{mandatoryConflicts.length} lỗi phân ca nghiêm trọng</strong> (trùng giờ làm việc hoặc nhân viên đã thôi việc).
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: 'var(--color-text-secondary)' }}>
                  Vui lòng kiểm tra và sửa các ô vi phạm trước khi xuất bản lịch cho toàn thể nhân viên.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                Bạn có chắc chắn muốn <strong>công bố chính thức</strong> lịch phân ca tuần này?
              </p>
              <ul style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)', paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Toàn bộ nhân viên chi nhánh sẽ nhìn thấy ca làm việc của mình trên cổng portal.</li>
                <li>Mọi thay đổi tiếp theo sau khi công bố sẽ yêu cầu nhập lý do giải trình và lưu vết kiểm toán.</li>
                {warningConflicts.length > 0 && (
                  <li style={{ color: '#d48806', fontWeight: 500 }}>
                    Lưu ý: Tuần hiện có {warningConflicts.length} ca có cảnh báo chính sách đã được duyệt đặc cách.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            backgroundColor: '#fafafa',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            {hasMandatory ? 'Đóng lại' : 'Hủy bỏ'}
          </button>
          {!hasMandatory && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} />
              Xác nhận công bố
            </button>
          )}
        </div>
      </div>
    </>
  );
};
