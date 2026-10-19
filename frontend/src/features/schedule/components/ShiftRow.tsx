import React from 'react';
import type { ShiftTemplate, ShiftAssignment, Employee, ScheduleConflict } from '@/types/domain.types';
import { ShiftGridCell } from './ShiftGridCell';
import { formatDateIso } from '@/utils/date.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { Clock, Users, Moon } from 'lucide-react';

interface ShiftRowProps {
  template: ShiftTemplate;
  weekDays: Date[];
  assignmentsMap: Record<string, ShiftAssignment[]>;
  employees: Employee[];
  conflictsMap: Record<string, ScheduleConflict[]>;
  todayDateStr: string;
  canEdit: boolean;
  onOpenAssignDrawer: (shiftTemplateId: number, workDate: string) => void;
  onRemoveAssignment: (assignmentId: number) => void;
}

export const ShiftRow: React.FC<ShiftRowProps> = ({
  template,
  weekDays,
  assignmentsMap,
  employees,
  conflictsMap,
  todayDateStr,
  canEdit,
  onOpenAssignDrawer,
  onRemoveAssignment,
}) => {
  const { netHours } = calculateShiftDurations(
    template.startTime,
    template.endTime,
    template.breakMinutes,
    template.isCrossMidnight
  );

  // Flatten all assignments once for fast filtering
  const allAssignments = React.useMemo(() => {
    return Object.values(assignmentsMap).flat();
  }, [assignmentsMap]);

  return (
    <div role="row" style={{ display: 'contents' }}>
      {/* 1. Sticky Column: Shift Template Identity & Info */}
      <div
        role="rowheader"
        className="employee-sticky-cell shift-sticky-cell"
        style={{
          borderLeft: `5px solid ${template.colorCode || 'var(--color-primary)'}`,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
            {template.shiftName}
          </span>
        </div>

        {/* Time and duration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Clock size={13} style={{ flexShrink: 0 }} />
          <span>
            {template.startTime} - {template.endTime}
            {template.isCrossMidnight && (
              <span style={{ color: '#722ED1', marginLeft: 3 }}>
                <Moon size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> +1
              </span>
            )}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>•</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {netHours.toFixed(1)}h
          </span>
        </div>

        {/* Staffing Quota Target */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <Users size={12} />
          <span>
            Định biên: <strong style={{ color: 'var(--color-text-secondary)' }}>{template.minStaffing}</strong>
            {template.maxStaffing ? ` - ${template.maxStaffing}` : ''} NV
          </span>
        </div>
      </div>

      {/* 2. Columns 2..8: Days of the week */}
      {weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const isToday = dateStr === todayDateStr;

        // Filter assignments matching this template and date, excluding resigned or inactive employees
        const cellAssignments = allAssignments.filter((a) => {
          if (a.workShiftId !== template.id || a.workDate !== dateStr || a.status === 'CANCELLED') {
            return false;
          }
          const emp = employees.find((e) => e.id === a.employeeId);
          if (!emp || emp.employmentStatus === 'RESIGNED' || emp.isActive === false) {
            return false;
          }
          return true;
        });

        return (
          <ShiftGridCell
            key={`${template.id}_${dateStr}`}
            template={template}
            workDate={dateStr}
            assignments={cellAssignments}
            employees={employees}
            conflictsMap={conflictsMap}
            isToday={isToday}
            canEdit={canEdit}
            onOpenAssignDrawer={() => onOpenAssignDrawer(template.id, dateStr)}
            onRemoveAssignment={(assignmentId, e) => {
              e.stopPropagation();
              onRemoveAssignment(assignmentId);
            }}
          />
        );
      })}
    </div>
  );
};
