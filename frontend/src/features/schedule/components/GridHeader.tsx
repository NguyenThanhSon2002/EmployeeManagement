import React from 'react';
import type { CompanyHoliday, ShiftAssignment } from '@/types/domain.types';
import { formatDateVi, formatDateIso, getDayOfWeekVi } from '@/utils/date.utils';
import { Flag } from 'lucide-react';

interface GridHeaderProps {
  weekDays: Date[];
  todayDateStr: string;
  holidays: CompanyHoliday[];
  assignmentsMap: Record<string, ShiftAssignment>;
}

export const GridHeader: React.FC<GridHeaderProps> = ({
  weekDays,
  todayDateStr,
  holidays,
  assignmentsMap,
}) => {
  // Count total assigned staff per day
  const dailyStaffCount = (dateStr: string) => {
    let count = 0;
    for (const a of Object.values(assignmentsMap)) {
      if (a.workDate === dateStr && a.status !== 'CANCELLED') {
        count++;
      }
    }
    return count;
  };

  return (
    <div role="row" style={{ display: 'contents' }}>
      {/* Column 1: Sticky Column Header */}
      <div role="columnheader" className="schedule-header-cell sticky-col">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Nhân Viên & Định Biên
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Giới hạn trần: 48h/tuần
        </div>
      </div>

      {/* Columns 2..8: Monday through Sunday */}
      {weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const isToday = dateStr === todayDateStr;
        const dayOfWeekName = getDayOfWeekVi(day);
        const dayHoliday = holidays.find((h) => h.holidayDate === dateStr);
        const staffCount = dailyStaffCount(dateStr);

        let cellClass = 'schedule-header-cell';
        if (isToday) cellClass += ' today-column';

        return (
          <div key={dateStr} role="columnheader" className={cellClass}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: isToday ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                {dayOfWeekName}
              </span>
              {isToday && (
                <span
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Hôm nay
                </span>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
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
                  padding: '2px 7px',
                  backgroundColor: 'var(--shift-holiday-bg)',
                  border: '1px solid var(--shift-holiday-border)',
                  color: 'var(--shift-holiday-text)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
                title={dayHoliday.holidayName}
              >
                <Flag size={10} />
                <span>LỄ</span>
              </div>
            )}

            {/* Daily Headcount Indicator */}
            <div
              style={{
                marginTop: 5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: staffCount >= 2 ? '#ECFDF5' : '#FFFBEB',
                border: staffCount >= 2 ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                color: staffCount >= 2 ? '#047857' : '#B45309',
                fontSize: 10.5,
                fontWeight: 600,
              }}
              title={`Tổng cộng ${staffCount} nhân sự được xếp ca trong ngày`}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: staffCount >= 2 ? '#10B981' : '#F59E0B',
                }}
              />
              ĐB: {staffCount} người
            </div>
          </div>
        );
      })}
    </div>
  );
};
