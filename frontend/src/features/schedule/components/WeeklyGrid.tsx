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
  onOpenOverrideModal?: (assignment: ShiftAssignment) => void;
  onOpenSwapModal?: (assignment: ShiftAssignment) => void;
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
  onOpenOverrideModal,
  onOpenSwapModal,
}) => {
  const weekDays = getWeekDays(baseMonday);
  const todayDateStr = formatDateIso(new Date());

  const activeTemplates = React.useMemo(() => {
    return shiftTemplates.filter((t) => t.isActive);
  }, [shiftTemplates]);

  // Phòng ngự: Tự động gom các phân công ca ngoại lệ/lệch ID để hiển thị hàng ca tương ứng, không để ca bị ẩn
  const fallbackTemplates = React.useMemo(() => {
    const existingIds = new Set(activeTemplates.map((t) => Number(t.id)));
    const missing: ShiftTemplate[] = [];

    for (const list of Object.values(assignmentsMap)) {
      for (const a of list) {
        if (a.status !== 'CANCELLED' && a.workShiftId && !existingIds.has(Number(a.workShiftId))) {
          existingIds.add(Number(a.workShiftId));
          missing.push({
            id: Number(a.workShiftId),
            shiftCode: `EXTRA_${a.workShiftId}`,
            shiftName: a.snapshotShiftName ? `${a.snapshotShiftName} (Ngoại lệ)` : `Ca khác (#${a.workShiftId})`,
            startTime: a.snapshotStartTime || '08:00',
            endTime: a.snapshotEndTime || '17:00',
            breakMinutes: a.snapshotBreakMinutes ?? 0,
            isCrossMidnight: a.snapshotCrossMidnight ?? false,
            colorCode: a.snapshotColorCode || '#64748B',
            textColor: '#FFFFFF',
            minStaffing: 0,
            maxStaffing: 99,
            applicableDays: '1,2,3,4,5,6,7',
            isActive: true,
          });
        }
      }
    }
    return missing;
  }, [assignmentsMap, activeTemplates]);

  const displayTemplates = React.useMemo(() => {
    return [...activeTemplates, ...fallbackTemplates];
  }, [activeTemplates, fallbackTemplates]);

  if (displayTemplates.length === 0) {
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
      aria-rowcount={displayTemplates.length + 1}
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
      {displayTemplates.map((template) => (
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
          onOpenOverrideModal={onOpenOverrideModal}
          onOpenSwapModal={onOpenSwapModal}
        />
      ))}
    </div>
  );
};
