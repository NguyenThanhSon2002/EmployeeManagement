import React, { useState, useEffect, useRef } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isSameWeek,
  addMonths,
  subMonths,
  format,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  viewMode: 'WEEK' | 'MONTH';
  onSelectDate: (selectedDate: Date) => void;
  onToday: () => void;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  isOpen,
  onClose,
  currentDate,
  viewMode,
  onSelectDate,
  onToday,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeMonth, setActiveMonth] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const displayMonth = activeMonth || startOfMonth(currentDate);

  // Click outside and ESC key handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveMonth(null);
        setHoveredDate(null);
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMonth(null);
        setHoveredDate(null);
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDaysHeader = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div
      ref={popoverRef}
      className="date-picker-popover date-picker-popover-animated"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 100,
        width: 290,
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 10px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--color-border, #E2E8F0)',
        padding: '12px 14px',
        userSelect: 'none',
      }}
    >
      {/* Popover Header: Month Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMonth(subMonths(displayMonth, 1))}
          title="Tháng trước"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--color-border, #E2E8F0)',
            backgroundColor: '#F8FAFC',
            color: 'var(--color-text-secondary, #64748B)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--color-text-primary, #1E293B)' }}>
          Tháng {format(displayMonth, 'MM/yyyy')}
        </span>

        <button
          type="button"
          onClick={() => setActiveMonth(addMonths(displayMonth, 1))}
          title="Tháng sau"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--color-border, #E2E8F0)',
            backgroundColor: '#F8FAFC',
            color: 'var(--color-text-secondary, #64748B)',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday Labels Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {weekDaysHeader.map((w, index) => (
          <span
            key={w}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: index >= 5 ? '#EF4444' : 'var(--color-text-tertiary, #94A3B8)',
            }}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          rowGap: 2,
        }}
        onMouseLeave={() => setHoveredDate(null)}
      >
        {days.map((day) => {
          const inCurrentMonth = isSameMonth(day, displayMonth);
          const isSelectedWeek =
            viewMode === 'WEEK' && isSameWeek(day, currentDate, { weekStartsOn: 1 });
          const isHoveredWeek =
            viewMode === 'WEEK' &&
            hoveredDate &&
            isSameWeek(day, hoveredDate, { weekStartsOn: 1 });
          const isSelectedDay = isSameDay(day, currentDate);
          const isCurrentDay = isToday(day);
          const dayOfWeek = day.getDay(); // 0 is Sunday, 1 is Monday

          let bg = 'transparent';
          if (isSelectedWeek) {
            bg = '#EEF2FF'; // Light Indigo
          } else if (isHoveredWeek) {
            bg = '#F1F5F9'; // Light Slate
          }

          let borderRadius = '0';
          if (dayOfWeek === 1) {
            borderRadius = '6px 0 0 6px'; // Monday start
          } else if (dayOfWeek === 0) {
            borderRadius = '0 6px 6px 0'; // Sunday end
          }

          return (
            <div
              key={day.toISOString()}
              className="popover-day-cell"
              style={{
                backgroundColor: bg,
                borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 0',
              }}
              onMouseEnter={() => setHoveredDate(day)}
            >
              <button
                type="button"
                className="popover-day-btn"
                onClick={() => {
                  setActiveMonth(null);
                  setHoveredDate(null);
                  onSelectDate(day);
                  onClose();
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: isCurrentDay ? '1.5px solid var(--color-primary, #3B82F6)' : 'none',
                  backgroundColor: isSelectedDay
                    ? 'var(--color-primary, #3B82F6)'
                    : 'transparent',
                  color: isSelectedDay
                    ? '#FFFFFF'
                    : inCurrentMonth
                    ? 'var(--color-text-primary, #1E293B)'
                    : 'var(--color-text-tertiary, #94A3B8)',
                  fontSize: '12px',
                  fontWeight: isSelectedDay || isCurrentDay ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={`Chọn ngày ${format(day, 'dd/MM/yyyy')}`}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Popover Footer: Today Shortcut & Close */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--color-border-subtle, #F1F5F9)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveMonth(null);
            setHoveredDate(null);
            onToday();
            onClose();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 26,
            padding: '0 8px',
            fontSize: '11.5px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--color-border, #E2E8F0)',
            backgroundColor: '#F8FAFC',
            color: 'var(--color-text-primary, #1E293B)',
            cursor: 'pointer',
          }}
        >
          <CalendarIcon size={12} color="var(--color-primary, #3B82F6)" />
          Hôm nay
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMonth(null);
            setHoveredDate(null);
            onClose();
          }}
          style={{
            height: 26,
            padding: '0 8px',
            fontSize: '11.5px',
            fontWeight: 500,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary, #64748B)',
            cursor: 'pointer',
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
