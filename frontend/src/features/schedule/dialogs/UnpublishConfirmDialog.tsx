import React from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface UnpublishConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UnpublishConfirmDialog: React.FC<UnpublishConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="unpublish-dialog-heading"
        aria-modal="true"
        style={{ width: 480 }}
      >
        {/* Header */}
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
            <RotateCcw size={20} color="var(--color-warning, #D97706)" />
            <h2 id="unpublish-dialog-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Thu Hồi Công Bố Lịch
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 'var(--space-lg)' }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              marginBottom: 'var(--space-md)',
            }}
          >
            <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#92400E', fontSize: '13.5px' }}>
                Xác nhận hoàn tác trạng thái công bố
              </div>
              <div style={{ fontSize: '12.5px', color: '#B45309', marginTop: 4, lineHeight: 1.5 }}>
                Bạn có chắc muốn thu hồi lịch đã công bố để chuyển về bản nháp không?
              </div>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px 0' }}>Khi chuyển về <strong>Bản nháp</strong>:</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '13px' }}>
              <li>Bạn có thể tiếp tục tự do chỉnh sửa, gán ca hoặc xóa phân ca mà không ghi log phát sinh bổ sung.</li>
              <li>Lịch làm việc sẽ quay lại chế độ nội bộ quản lý cho đến khi bạn bấm công bố lại.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-sm)',
            backgroundColor: '#F8FAFC',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            Giữ nguyên lịch công bố
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              backgroundColor: '#D97706',
              borderColor: '#B45309',
              color: '#FFFFFF',
              gap: 6,
            }}
          >
            <RotateCcw size={15} />
            Xác nhận chuyển về bản nháp
          </button>
        </div>
      </div>
    </>
  );
};
