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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={
              employee.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={employee.fullName}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              border: '1px solid var(--color-border)',
              opacity: isResigned ? 0.6 : 1,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 'var(--font-caption)',
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
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 6 }}>
              <span>{employee.employeeCode}</span>
              {isResigned && <span style={{ color: 'var(--color-error)' }}>(Đã nghỉ)</span>}
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar */}
        {!isResigned && (
          <div style={{ marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Tuần này:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: isOverWeeklyLimit ? 'var(--color-error)' : 'var(--color-text-primary)',
                }}
              >
                {weeklyHours.toFixed(1)}h / 48h
              </span>
            </div>
            <div
              style={{
                height: 4,
                backgroundColor: 'var(--color-border-subtle)',
                borderRadius: varRadiusFull(),
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: isOverWeeklyLimit ? 'var(--color-error)' : 'var(--color-primary)',
                  transition: 'width 0.2s ease',
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

function varRadiusFull(): string {
  return '9999px';
}
