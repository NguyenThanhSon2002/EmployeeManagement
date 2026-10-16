import React from 'react';
import { CalendarCheck, Clock, AlertTriangle, UserX, Filter } from 'lucide-react';

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
      }}
    >
      {/* Card 1: Total Shifts */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CalendarCheck size={22} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tổng Số Ca Tuần Này
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {totalShifts}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ca</span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Net Hours */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock size={22} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tổng Giờ Làm Việc (Net)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {totalHours.toFixed(1)}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>giờ</span>
          </div>
        </div>
      </div>

      {/* Card 3: Conflicts (Clickable Filter Card) */}
      <button
        type="button"
        onClick={onToggleConflictFilter}
        className="card card-interactive"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textAlign: 'left',
          backgroundColor: onlyShowConflicts ? '#FFFBEB' : 'var(--color-surface)',
          borderColor: onlyShowConflicts ? '#F59E0B' : 'var(--color-border)',
          boxShadow: onlyShowConflicts ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)',
          position: 'relative',
        }}
        title="Nhấp để bật/tắt lọc chỉ các nhân viên có cảnh báo xung đột"
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Cảnh Báo Xung Đột</span>
            {onlyShowConflicts && <Filter size={11} color="#D97706" />}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: conflictCount > 0 ? '#D97706' : '#10B981', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {conflictCount}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: onlyShowConflicts ? '#D97706' : 'var(--color-text-muted)' }}>
              {onlyShowConflicts ? '(Đang lọc ⚠️)' : 'vấn đề'}
            </span>
          </div>
        </div>
      </button>

      {/* Card 4: Understaffed Days */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: understaffedDaysCount > 0 ? '#FEF2F2' : '#F1F5F9',
            color: understaffedDaysCount > 0 ? '#EF4444' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UserX size={22} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ngày Thiếu Định Biên
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: understaffedDaysCount > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {understaffedDaysCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};
