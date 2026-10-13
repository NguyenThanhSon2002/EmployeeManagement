import React from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { Palmtree, Flag, AlertTriangle } from 'lucide-react';

interface ScheduleLegendProps {
  shiftTemplates: ShiftTemplate[];
}

export const ScheduleLegend: React.FC<ScheduleLegendProps> = ({ shiftTemplates }) => {
  return (
    <div
      className="card"
      style={{
        marginTop: 'var(--space-md)',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        fontSize: 'var(--font-caption)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {/* Shift Colors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Chú giải mẫu ca:</span>
        {shiftTemplates.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: t.colorCode,
                border: '1px solid rgba(0,0,0,0.15)',
              }}
            />
            <span>
              {t.shiftName} ({t.startTime}-{t.endTime}
              {t.isCrossMidnight ? ' +1' : ''})
            </span>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--shift-leave-bg)',
              border: '1px solid var(--shift-leave-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palmtree size={10} color="var(--shift-leave-text)" />
          </span>
          <span>Nghỉ phép năm</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--shift-holiday-bg)',
              border: '1px solid var(--shift-holiday-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flag size={10} color="var(--shift-holiday-text)" />
          </span>
          <span>Ngày lễ công ty</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} color="var(--color-warning)" />
          <span>Cảnh báo xung đột (⚠️)</span>
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)' }}>
        <span>Phím tắt:</span>
        <span>
          <kbd style={{ padding: '2px 5px', border: '1px solid var(--color-border)', borderRadius: 3, background: '#fafafa' }}>Enter</kbd> Xem/Gán
        </span>
        <span>
          <kbd style={{ padding: '2px 5px', border: '1px solid var(--color-border)', borderRadius: 3, background: '#fafafa' }}>Esc</kbd> Đóng
        </span>
      </div>
    </div>
  );
};
