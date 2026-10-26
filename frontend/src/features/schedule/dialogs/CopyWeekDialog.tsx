import React, { useEffect, useState } from 'react';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { Copy, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { scheduleService } from '../api/scheduleService';
import { useScheduleStore } from '../store/useScheduleStore';

interface CopyWeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => Promise<void> | void;
}

export const CopyWeekDialog: React.FC<CopyWeekDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const [mode, setMode] = useState<'SKIP_OCCUPIED' | 'REPLACE_ALL'>('SKIP_OCCUPIED');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const currentStartDate = useScheduleStore((s) => s.currentStartDate);
  const branchId = useScheduleStore((s) => s.filterOptions.branchId || 1);

  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const [targetCount, setTargetCount] = useState<number | null>(null);

  const currentMon = parseISO(currentStartDate);
  const currentSun = addDays(currentMon, 6);
  const prevMon = addDays(currentMon, -7);
  const prevSun = addDays(currentMon, -1);

  const prevRangeStr = `${format(prevMon, 'dd/MM/yyyy')} - ${format(prevSun, 'dd/MM/yyyy')}`;
  const currentRangeStr = `${format(currentMon, 'dd/MM/yyyy')} - ${format(currentSun, 'dd/MM/yyyy')}`;

  useEffect(() => {
    if (!isOpen) return;

    setMode('SKIP_OCCUPIED');
    setLoading(true);
    setSourceCount(null);
    setTargetCount(null);

    const prevMonStr = format(prevMon, 'yyyy-MM-dd');

    Promise.all([
      scheduleService.getWeeklySchedule(branchId, prevMonStr).catch(() => null),
      scheduleService.getWeeklySchedule(branchId, currentStartDate).catch(() => null),
    ])
      .then(([srcData, tgtData]) => {
        if (srcData && srcData.employees) {
          const totalSrc = srcData.employees.reduce((acc, e) => acc + (e.assignments?.length || 0), 0);
          setSourceCount(totalSrc);
        } else {
          setSourceCount(0);
        }

        if (tgtData && tgtData.employees) {
          const totalTgt = tgtData.employees.reduce((acc, e) => acc + (e.assignments?.length || 0), 0);
          setTargetCount(totalTgt);
        } else {
          setTargetCount(0);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, branchId, currentStartDate]);

  if (!isOpen) return null;

  const handleExecuteCopy = async () => {
    try {
      setSubmitting(true);
      await onConfirm(mode);
      onClose();
    } catch {
      // Handled by parent toast
    } finally {
      setSubmitting(false);
    }
  };

  const isSourceEmpty = sourceCount !== null && sourceCount === 0;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="copy-dialog-heading"
        aria-modal="true"
        style={{ width: 540 }}
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
          {/* Thông tin tuần nguồn & tuần đích */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--space-md)',
              fontSize: 'var(--font-caption)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Tuần nguồn (Sao chép từ):</span>
              <span style={{ fontWeight: 600 }}>
                {prevRangeStr}{' '}
                {loading ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>(đang kiểm tra...)</span>
                ) : sourceCount !== null ? (
                  <strong style={{ color: sourceCount > 0 ? 'var(--color-primary)' : '#DC2626' }}>
                    ({sourceCount} ca)
                  </strong>
                ) : null}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Tuần đích (Áp dụng vào):</span>
              <span style={{ fontWeight: 600 }}>
                {currentRangeStr}{' '}
                {loading ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>(đang kiểm tra...)</span>
                ) : targetCount !== null ? (
                  <strong style={{ color: '#10B981' }}>({targetCount} ca hiện có)</strong>
                ) : null}
              </span>
            </div>
          </div>

          {/* Cảnh báo nếu tuần nguồn rỗng */}
          {!loading && isSourceEmpty && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
                backgroundColor: '#FEF2F2',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: 'var(--font-caption)',
                marginBottom: 'var(--space-md)',
                alignItems: 'center',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Tuần trước chưa có ca làm việc nào!</strong> Bạn cần xếp ca cho tuần trước trước hoặc sử dụng tính năng <strong>Gán ca hàng loạt</strong> cho tuần này.
              </div>
            </div>
          )}

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
                cursor: isSourceEmpty ? 'not-allowed' : 'pointer',
                opacity: isSourceEmpty ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name="copyMode"
                disabled={isSourceEmpty}
                checked={mode === 'SKIP_OCCUPIED'}
                onChange={() => setMode('SKIP_OCCUPIED')}
                style={{ accentColor: 'var(--color-primary)', marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
                  Bỏ qua các ô đã có ca (Khuyến nghị)
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Giữ nguyên các ca đã xếp của tuần này, chỉ điền các ca tuần trước vào các ô còn trống.
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
                cursor: isSourceEmpty ? 'not-allowed' : 'pointer',
                opacity: isSourceEmpty ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name="copyMode"
                disabled={isSourceEmpty}
                checked={mode === 'REPLACE_ALL'}
                onChange={() => setMode('REPLACE_ALL')}
                style={{ accentColor: 'var(--color-primary)', marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)', color: 'var(--color-text-primary)' }}>
                  Ghi đè toàn bộ lịch tuần này
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Xóa toàn bộ các ca hiện có của tuần này và thay thế bằng mẫu phân ca của tuần trước.
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
          <button type="button" className="btn btn-default" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSourceEmpty || loading || submitting}
            onClick={handleExecuteCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang sao chép...
              </>
            ) : (
              <>
                <Check size={16} />
                Tiến hành sao chép
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
