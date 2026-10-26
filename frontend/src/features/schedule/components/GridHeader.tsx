import React from 'react';
import type { CompanyHoliday, ShiftAssignment } from '@/types/domain.types';
import { formatDateVi, formatDateIso, getDayOfWeekVi } from '@/utils/date.utils';
import { Flag } from 'lucide-react';

interface GridHeaderProps {
  weekDays: Date[];
  todayDateStr: string;
  holidays: CompanyHoliday[];
  assignmentsMap: Record<string, ShiftAssignment[]>;
}

export const GridHeader: React.FC<GridHeaderProps> = ({
  weekDays,
  todayDateStr,
  holidays,
}) => {
  return (
    <div role="row" style={{ display: 'contents' }}>
      {/* Column 1: Sticky Column Header */}
      <div role="columnheader" className="schedule-header-cell sticky-col">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Mẫu Ca Làm Việc
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Định biên nhân sự
        </div>
      </div>

      {/* Columns 2..8: Monday through Sunday */}
      {weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const isToday = dateStr === todayDateStr;
        const dayOfWeekName = getDayOfWeekVi(day);
        const dayHoliday = holidays.find((h) => h.holidayDate === dateStr);

        let cellClass = 'schedule-header-cell';
        if (isToday) cellClass += ' today-column';

        return (
          <div key={dateStr} role="columnheader" className={cellClass}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: isToday ? '#2563EB' : '#1E293B' }}>
                {dayOfWeekName}
              </span>
              {isToday && (
                <span
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    letterSpacing: '0.02em',
                  }}
                >
                  Hôm nay
                </span>
              )}
            </div>

            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: 3, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              {formatDateVi(day)}
            </div>

            {/* Holiday Flag Badge */}
            {dayHoliday && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 4,
                  padding: '2px 8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
                title={dayHoliday.holidayName}
              >
                <Flag size={10} />
                <span>LỄ</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
