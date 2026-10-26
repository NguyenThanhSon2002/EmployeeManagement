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
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      {/* Card 1: Total Shifts */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '9px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #DBEAFE',
          }}
        >
          <CalendarCheck size={19} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tổng ca tuần này
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {totalShifts}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>ca</span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Net Hours */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '9px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #A7F3D0',
          }}
        >
          <Clock size={19} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tổng giờ làm (Net)
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {totalHours.toFixed(1)}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>giờ</span>
          </div>
        </div>
      </div>

      {/* Card 3: Conflicts (Clickable Filter Card) */}
      <button
        type="button"
        onClick={onToggleConflictFilter}
        className="card card-interactive"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          textAlign: 'left',
          borderRadius: '10px',
          backgroundColor: onlyShowConflicts ? '#FFFBEB' : '#FFFFFF',
          borderColor: onlyShowConflicts ? '#F59E0B' : '#E2E8F0',
          boxShadow: onlyShowConflicts ? '0 0 0 2px rgba(245, 158, 11, 0.25)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Nhấp để bật/tắt lọc chỉ các nhân viên có cảnh báo xung đột"
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '9px',
            backgroundColor: conflictCount > 0 ? '#FEF2F2' : '#F8FAFC',
            color: conflictCount > 0 ? '#DC2626' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: conflictCount > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
          }}
        >
          <AlertTriangle size={19} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Cảnh báo xung đột</span>
            <span style={{ fontSize: 10, color: onlyShowConflicts ? '#D97706' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Filter size={10} />
              {onlyShowConflicts ? 'Đang lọc' : 'Lọc'}
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: conflictCount > 0 ? '#DC2626' : '#059669', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {conflictCount}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>trường hợp</span>
          </div>
        </div>
      </button>

      {/* Card 4: Understaffed Days */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '9px',
            backgroundColor: understaffedDaysCount > 0 ? '#FFFBEB' : '#ECFDF5',
            color: understaffedDaysCount > 0 ? '#D97706' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: understaffedDaysCount > 0 ? '1px solid #FDE68A' : '1px solid #A7F3D0',
          }}
        >
          <UserX size={19} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ngày thiếu định biên
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: understaffedDaysCount > 0 ? '#D97706' : '#059669', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {understaffedDaysCount}{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>/ 7 ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};
