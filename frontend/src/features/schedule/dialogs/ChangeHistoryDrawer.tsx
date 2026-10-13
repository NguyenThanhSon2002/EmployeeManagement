import React from 'react';
import type { ChangeHistoryEntry } from '@/types/domain.types';
import { formatDateVi } from '@/utils/date.utils';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { History, X } from 'lucide-react';

interface ChangeHistoryDrawerProps {
  isOpen: boolean;
  history: ChangeHistoryEntry[];
  onClose: () => void;
}

export const ChangeHistoryDrawer: React.FC<ChangeHistoryDrawerProps> = ({
  isOpen,
  history,
  onClose,
}) => {
  const drawerRef = useModalFocusTrap<HTMLElement>({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        ref={drawerRef}
        className="drawer-panel"
        role="dialog"
        aria-labelledby="history-heading"
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
            <History size={20} color="var(--color-primary)" />
            <h2 id="history-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Nhật Ký Thay Đổi Lịch Đã Công Bố
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng nhật ký">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-muted)' }}>
              Chưa có điều chỉnh nào được thực hiện sau khi công bố lịch tuần.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((entry) => {
                let badgeClass = 'badge-info';
                let actionLabel = 'Thêm mới';
                if (entry.actionType === 'MODIFIED') {
                  badgeClass = 'badge-warning';
                  actionLabel = 'Chỉnh sửa';
                } else if (entry.actionType === 'DELETED') {
                  badgeClass = 'badge-error';
                  actionLabel = 'Đã xóa';
                }

                return (
                  <div
                    key={entry.id}
                    className="card"
                    style={{ padding: '10px 12px', fontSize: 'var(--font-caption)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className={`badge ${badgeClass}`}>{actionLabel}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(entry.changedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {entry.employeeName} • Ngày {formatDateVi(entry.workDate)}
                    </div>

                    <div style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                      <strong>Lý do:</strong> {entry.changeReason}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Thực hiện bởi: {entry.changedByRole}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#fafafa',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            Đóng
          </button>
        </div>
      </aside>
    </>
  );
};
