import React from 'react';
import type { Employee, ShiftAssignment, ScheduleConflict, LeaveRequest, CompanyHoliday } from '@/types/domain.types';
import { ScheduleCell } from './ScheduleCell';
import { sumWeeklyScheduledHours } from '@/utils/schedule-calc.utils';
import { formatDateIso } from '@/utils/date.utils';

interface EmployeeRowProps {
  employee: Employee;
  weekDays: Date[];
  assignmentsMap: Record<string, ShiftAssignment>;
  conflictsMap: Record<string, ScheduleConflict[]>;
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  todayDateStr: string;
  canEdit: boolean;
  onOpenAssign: (employeeId: number, workDate: string) => void;
}

export const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  weekDays,
  assignmentsMap,
  conflictsMap,
  approvedLeaves,
  holidays,
  todayDateStr,
  canEdit,
  onOpenAssign,
}) => {
  // Collect all assignments for this employee in this week
  const employeeWeekAssignments: ShiftAssignment[] = [];
  for (const day of weekDays) {
    const key = `${employee.id}_${formatDateIso(day)}`;
    const a = assignmentsMap[key];
    if (a) employeeWeekAssignments.push(a);
  }

  const weeklyHours = sumWeeklyScheduledHours(employeeWeekAssignments);
  const isOverWeeklyLimit = weeklyHours > 48.0;
  const progressPercent = Math.min(100, (weeklyHours / 48.0) * 100);

  const isResigned = !employee.isActive || employee.employmentStatus === 'RESIGNED';

  return (
    <div role="row" style={{ display: 'contents' }}>
      {/* Sticky Column: Employee Identity & Weekly Hours Progress */}
      <div role="rowheader" className="employee-sticky-cell">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={
              employee.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={employee.fullName}
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              border: '2px solid var(--color-border)',
              opacity: isResigned ? 0.6 : 1,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isResigned ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={employee.fullName}
            >
              {employee.fullName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500 }}>{employee.employeeCode}</span>
              {isResigned && (
                <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: 10 }}>
                  (Đã nghỉ)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar */}
        {!isResigned && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Kế hoạch tuần:</span>
              <span
                style={{
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: isOverWeeklyLimit ? '#DC2626' : 'var(--color-text-primary)',
                }}
              >
                {weeklyHours.toFixed(1)}h / 48h
              </span>
            </div>
            <div
              style={{
                height: 5,
                backgroundColor: '#F1F5F9',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: isOverWeeklyLimit
                    ? 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)'
                    : 'linear-gradient(90deg, #60A5FA 0%, #2563EB 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 7 Calendar Day Cells */}
      {weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const cellKey = `${employee.id}_${dateStr}`;
        const assignment = assignmentsMap[cellKey] || null;
        const conflicts = conflictsMap[cellKey] || [];
        const leave =
          approvedLeaves.find(
            (l) => l.employeeId === employee.id && dateStr >= l.startDate && dateStr <= l.endDate
          ) || null;
        const holiday = holidays.find((h) => h.holidayDate === dateStr) || null;

        return (
          <ScheduleCell
            key={cellKey}
            employeeId={employee.id}
            workDate={dateStr}
            assignment={assignment}
            conflicts={conflicts}
            approvedLeave={leave}
            holiday={holiday}
            isToday={dateStr === todayDateStr}
            isLocked={isResigned}
            canEdit={canEdit && !isResigned}
            onOpenAssign={() => onOpenAssign(employee.id, dateStr)}
          />
        );
      })}
    </div>
  );
};
