import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import type { ShiftAssignment, Employee, CompanyHoliday } from '@/types/domain.types';
import { formatDateIso } from '@/utils/date.utils';

interface MonthViewGridProps {
  currentDate: Date;
  employees: Employee[];
  assignmentsMap: Record<string, ShiftAssignment>;
  holidays: CompanyHoliday[];
  onSelectDay: (dateStr: string) => void;
}

export const MonthViewGrid: React.FC<MonthViewGridProps> = ({
  currentDate,
  employees,
  assignmentsMap,
  holidays,
  onSelectDay,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const today = new Date();

  return (
    <div className="card" style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
      <div style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
          Lịch Phân Ca Toàn Tháng {format(currentDate, 'MM/yyyy')}
        </h3>
        <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
          Tổng quân số: {employees.length} nhân viên
        </div>
      </div>

      {/* 7 Columns: T2..CN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
          gap: 1,
          backgroundColor: 'var(--color-border)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map((name) => (
          <div
            key={name}
            style={{
              padding: '8px 10px',
              backgroundColor: '#fafafa',
              fontWeight: 600,
              fontSize: 'var(--font-caption)',
              textAlign: 'center',
            }}
          >
            {name}
          </div>
        ))}

        {days.map((d) => {
          const dateStr = formatDateIso(d);
          const inCurrentMonth = isSameMonth(d, monthStart);
          const isToday = isSameDay(d, today);
          const holiday = holidays.find((h) => h.holidayDate === dateStr);

          // Count active shifts on this date
          const dayAssignments = Object.values(assignmentsMap).filter(
            (a) => a.workDate === dateStr && a.status !== 'CANCELLED'
          );

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              style={{
                minHeight: 110,
                backgroundColor: isToday ? '#f0f7ff' : inCurrentMonth ? '#fff' : '#fafafa',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                opacity: inCurrentMonth ? 1 : 0.6,
                transition: 'background-color 0.1s ease',
              }}
              title="Click để chuyển sang xem chi tiết tuần này"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--color-primary)' : inCurrentMonth ? 'inherit' : 'var(--color-text-muted)',
                  }}
                >
                  {format(d, 'd')}
                </span>
                {holiday && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '1px 4px',
                      borderRadius: 4,
                      backgroundColor: 'var(--shift-holiday-bg)',
                      color: 'var(--shift-holiday-text)',
                    }}
                  >
                    Lễ
                  </span>
                )}
              </div>

              {/* Headcount */}
              <div style={{ fontSize: 11, fontWeight: 600, color: dayAssignments.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {dayAssignments.length} ca trực
              </div>

              {/* Mini previews */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 'auto' }}>
                {dayAssignments.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: a.snapshotColorCode || 'var(--color-primary)',
                    }}
                    title={`${a.snapshotShiftName}`}
                  />
                ))}
                {dayAssignments.length > 4 && (
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                    +{dayAssignments.length - 4}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
