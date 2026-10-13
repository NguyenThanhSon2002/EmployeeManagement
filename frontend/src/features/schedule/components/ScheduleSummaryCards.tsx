import React from 'react';
import { CalendarCheck, Clock, AlertTriangle, UserX } from 'lucide-react';

interface ScheduleSummaryCardsProps {
  totalShifts: number;
  totalHours: number;
  conflictCount: number;
  understaffedDaysCount: number;
  onlyShowConflicts: boolean;
  onToggleConflictFilter: () => void;
}

export const ScheduleSummaryCards: React.FC<ScheduleSummaryCardsProps> = ({
  totalShifts,
  totalHours,
  conflictCount,
  understaffedDaysCount,
  onlyShowConflicts,
  onToggleConflictFilter,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Card 1: Total Shifts */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-info-bg)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarCheck size={22} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            TỔNG SỐ CA TUẦN NÀY
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {totalShifts} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ca</span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Net Hours */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f6ffed',
            color: '#52c41a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={22} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            TỔNG GIỜ LÀM VIỆC (NET)
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {totalHours.toFixed(1)}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>giờ</span>
          </div>
        </div>
      </div>

      {/* Card 3: Conflicts (Clickable Filter) */}
      <button
        type="button"
        onClick={onToggleConflictFilter}
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          textAlign: 'left',
          backgroundColor: onlyShowConflicts ? '#fffbe6' : 'var(--color-surface)',
          border: onlyShowConflicts ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
          transition: 'all 0.15s ease',
        }}
        title="Nhấp để bật/tắt lọc chỉ các nhân viên có cảnh báo"
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fffbe6',
            color: '#faad14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            CẢNH BÁO XUNG ĐỘT
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: conflictCount > 0 ? '#d46b08' : '#52c41a' }}>
            {conflictCount}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
              {onlyShowConflicts ? '(Đang lọc ⚠️)' : 'mục'}
            </span>
          </div>
        </div>
      </button>

      {/* Card 4: Understaffed Days */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: understaffedDaysCount > 0 ? '#fff1f0' : 'var(--color-bg-layout)',
            color: understaffedDaysCount > 0 ? '#ff4d4f' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <UserX size={22} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            NGÀY THIẾU ĐỊNH BIÊN
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: understaffedDaysCount > 0 ? '#cf1322' : 'var(--color-text-primary)' }}>
            {understaffedDaysCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};
