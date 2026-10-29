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
  onlyShowConflicts?: boolean;
  onOpenAssignDrawer: (shiftTemplateId: number, workDate: string) => void;
  onRemoveAssignment: (assignmentId: number) => void;
  onOpenOverrideModal?: (assignment: ShiftAssignment) => void;
  onOpenSwapModal?: (assignment: ShiftAssignment) => void;
}

export const ShiftRow: React.FC<ShiftRowProps> = ({
  template,
  weekDays,
  assignmentsMap,
  employees,
  conflictsMap,
  todayDateStr,
  canEdit,
  onlyShowConflicts = false,
  onOpenAssignDrawer,
  onRemoveAssignment,
  onOpenOverrideModal,
  onOpenSwapModal,
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
          borderLeft: `4px solid ${template.colorCode || '#2563EB'}`,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', letterSpacing: '-0.01em' }}>
            {template.shiftName}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#2563EB',
              backgroundColor: '#EFF6FF',
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid #DBEAFE',
            }}
          >
            {netHours.toFixed(1)}h
          </span>
        </div>

        {/* Time and duration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '12px',
            color: '#64748B',
            fontWeight: 500,
          }}
        >
          <Clock size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span>
            {template.startTime} - {template.endTime}
            {template.isCrossMidnight && (
              <span style={{ color: '#7C3AED', marginLeft: 4, fontWeight: 600 }}>
                <Moon size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 1 }} />+1
              </span>
            )}
          </span>
        </div>

        {/* Staffing Quota Target */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <Users size={12} color="#94A3B8" />
          <span>
            Định biên: <strong style={{ color: '#1E293B' }}>{template.minStaffing}</strong>
            {template.maxStaffing ? ` - ${template.maxStaffing}` : ''} NV
          </span>
        </div>
      </div>

      {/* 2. Columns 2..8: Days of the week */}
      {weekDays.map((day) => {
        const dateStr = formatDateIso(day);
        const isToday = dateStr === todayDateStr;

        // Filter assignments matching this template and date, sorted chronologically (id ascending)
        const cellAssignments = allAssignments
          .filter((a) => {
            if (a.workShiftId !== template.id || a.workDate !== dateStr || a.status === 'CANCELLED') {
              return false;
            }
            const emp = employees.find((e) => e.id === a.employeeId);
            if (!emp || emp.employmentStatus === 'RESIGNED' || emp.isActive === false) {
              return false;
            }
            return true;
          })
          .sort((a, b) => (a.id || 0) - (b.id || 0));

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
            onlyShowConflicts={onlyShowConflicts}
            onOpenAssignDrawer={() => onOpenAssignDrawer(template.id, dateStr)}
            onRemoveAssignment={(assignmentId, e) => {
              e.stopPropagation();
              onRemoveAssignment(assignmentId);
            }}
            onOpenOverrideModal={onOpenOverrideModal}
            onOpenSwapModal={onOpenSwapModal}
          />
        );
      })}
    </div>
  );
};
