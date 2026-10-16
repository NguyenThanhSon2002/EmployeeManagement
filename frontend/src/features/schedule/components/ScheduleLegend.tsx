import React from 'react';
import type { ShiftTemplate } from '@/types/domain.types';
import { Palmtree, Flag, AlertTriangle, Keyboard } from 'lucide-react';

interface ScheduleLegendProps {
  shiftTemplates: ShiftTemplate[];
}

export const ScheduleLegend: React.FC<ScheduleLegendProps> = ({ shiftTemplates }) => {
  return (
    <div
      className="card"
      style={{
        marginTop: 'var(--space-md)',
        padding: '12px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
      }}
    >
      {/* Shift Colors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Chú giải mẫu ca:</span>
        {shiftTemplates.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: t.colorCode,
                border: '1px solid rgba(0,0,0,0.18)',
              }}
            />
            <span style={{ fontWeight: 500 }}>
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
            <Palmtree size={9} color="var(--shift-leave-text)" />
          </span>
          <span style={{ fontWeight: 500 }}>Nghỉ phép năm</span>
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
            <Flag size={9} color="var(--shift-holiday-text)" />
          </span>
          <span style={{ fontWeight: 500 }}>Ngày lễ công ty</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={13} color="#D97706" />
          <span style={{ fontWeight: 500 }}>Cảnh báo xung đột (⚠️)</span>
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', fontSize: 11.5 }}>
        <Keyboard size={14} style={{ opacity: 0.7 }} />
        <span>Phím tắt:</span>
        <span>
          <kbd style={{ padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 4, background: '#F8FAFC', fontWeight: 600, color: 'var(--color-text-primary)' }}>Enter</kbd> Xem/Gán
        </span>
        <span>
          <kbd style={{ padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 4, background: '#F8FAFC', fontWeight: 600, color: 'var(--color-text-primary)' }}>Esc</kbd> Đóng
        </span>
      </div>
    </div>
  );
};
