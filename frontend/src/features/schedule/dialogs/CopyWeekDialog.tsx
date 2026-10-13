import React, { useState } from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { Copy, X, Check } from 'lucide-react';

interface CopyWeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => void;
}

export const CopyWeekDialog: React.FC<CopyWeekDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const [mode, setMode] = useState<'SKIP_OCCUPIED' | 'REPLACE_ALL'>('SKIP_OCCUPIED');

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="copy-dialog-heading"
        aria-modal="true"
        style={{ width: 500 }}
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
            <Copy size={20} color="var(--color-primary)" />
            <h2 id="copy-dialog-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Sao Chép Lịch Từ Tuần Trước
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
            Hệ thống sẽ lấy toàn bộ phân ca của <strong>Tuần trước (đã công bố)</strong> và sao chép tương ứng vào <strong>Tuần hiện tại</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Mode 1: Skip Occupied */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: mode === 'SKIP_OCCUPIED' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: mode === 'SKIP_OCCUPIED' ? 'var(--color-info-bg)' : 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="copyMode"
                checked={mode === 'SKIP_OCCUPIED'}
                onChange={() => setMode('SKIP_OCCUPIED')}
                style={{ accentColor: 'var(--color-primary)', marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
                  Bỏ qua các ô đã có ca (Khuyến nghị)
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Giữ nguyên các ca và đơn phép đã có của tuần này, chỉ điền lịch tuần trước vào các ô còn trống.
                </div>
              </div>
            </label>

            {/* Mode 2: Replace All */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: mode === 'REPLACE_ALL' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: mode === 'REPLACE_ALL' ? 'var(--color-info-bg)' : 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="copyMode"
                checked={mode === 'REPLACE_ALL'}
                onChange={() => setMode('REPLACE_ALL')}
                style={{ accentColor: 'var(--color-primary)', marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)', color: 'var(--color-text-primary)' }}>
                  Ghi đè toàn bộ lịch tuần này
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Xóa toàn bộ các ca hiện có và thay thế bằng mẫu tuần trước (các ngày có đơn nghỉ phép vẫn được bảo toàn).
                </div>
              </div>
            </label>
          </div>
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
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onConfirm(mode);
              onClose();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={16} />
            Tiến hành sao chép
          </button>
        </div>
      </div>
    </>
  );
};
