import React from 'react';
import type {
  Employee,
  ShiftTemplate,
  ShiftAssignment,
  ScheduleConflict,
  CompanyHoliday,
} from '@/types/domain.types';
import { GridHeader } from './GridHeader';
import { ShiftRow } from './ShiftRow';
import { getWeekDays, formatDateIso } from '@/utils/date.utils';

interface WeeklyGridProps {
  baseMonday: Date;
  shiftTemplates: ShiftTemplate[];
  employees: Employee[];
  assignmentsMap: Record<string, ShiftAssignment[]>;
  conflictsMap: Record<string, ScheduleConflict[]>;
  holidays: CompanyHoliday[];
  canEdit: boolean;
  onlyShowConflicts?: boolean;
  onOpenAssignStaff: (shiftTemplateId: number, workDate: string) => void;
  onRemoveAssignment: (assignmentId: number) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  baseMonday,
  shiftTemplates,
  employees,
  assignmentsMap,
  conflictsMap,
  holidays,
  canEdit,
  onlyShowConflicts = false,
  onOpenAssignStaff,
  onRemoveAssignment,
}) => {
  const weekDays = getWeekDays(baseMonday);
  const todayDateStr = formatDateIso(new Date());

  const activeTemplates = shiftTemplates.filter((t) => t.isActive);

  if (activeTemplates.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 'var(--space-xxl) var(--space-lg)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 'var(--space-sm)' }}>⏱️</div>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--space-xs)' }}>
          Chưa có mẫu ca làm việc nào
        </h3>
        <p style={{ fontSize: 'var(--font-body)' }}>
          Vui lòng kích hoạt hoặc thêm mới các mẫu ca (Shift Templates) để bắt đầu phân công nhân sự.
        </p>
      </div>
    );
  }

  return (
    <div
      role="grid"
      aria-label="Bảng phân ca làm việc theo mẫu ca tuần"
      aria-rowcount={activeTemplates.length + 1}
      aria-colcount={8}
      className="schedule-grid-container"
    >
      {/* 8-Column Matrix Header */}
      <GridHeader
        weekDays={weekDays}
        todayDateStr={todayDateStr}
        holidays={holidays}
        assignmentsMap={assignmentsMap}
      />

      {/* Shift Rows */}
      {activeTemplates.map((template) => (
        <ShiftRow
          key={template.id}
          template={template}
          weekDays={weekDays}
          assignmentsMap={assignmentsMap}
          employees={employees}
          conflictsMap={conflictsMap}
          todayDateStr={todayDateStr}
          canEdit={canEdit}
          onlyShowConflicts={onlyShowConflicts}
          onOpenAssignDrawer={onOpenAssignStaff}
          onRemoveAssignment={onRemoveAssignment}
        />
      ))}
    </div>
  );
};
