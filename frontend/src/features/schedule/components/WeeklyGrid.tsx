import React from 'react';
import type { Employee, ShiftAssignment, ScheduleConflict, LeaveRequest, CompanyHoliday } from '@/types/domain.types';
import { GridHeader } from './GridHeader';
import { EmployeeRow } from './EmployeeRow';
import { getWeekDays, formatDateIso } from '@/utils/date.utils';

interface WeeklyGridProps {
  baseMonday: Date;
  employees: Employee[];
  assignmentsMap: Record<string, ShiftAssignment>;
  conflictsMap: Record<string, ScheduleConflict[]>;
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  canEdit: boolean;
  onOpenAssign: (employeeId: number, workDate: string) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  baseMonday,
  employees,
  assignmentsMap,
  conflictsMap,
  approvedLeaves,
  holidays,
  canEdit,
  onOpenAssign,
}) => {
  const weekDays = getWeekDays(baseMonday);
  const todayDateStr = formatDateIso(new Date());

  if (employees.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 'var(--space-xxl) var(--space-lg)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 'var(--space-sm)' }}>🔍</div>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--space-xs)' }}>
          Không tìm thấy nhân viên phù hợp
        </h3>
        <p style={{ fontSize: 'var(--font-body)' }}>
          Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn bộ lọc cảnh báo.
        </p>
      </div>
    );
  }

  return (
    <div
      role="grid"
      aria-label="Bảng phân ca làm việc theo tuần"
      aria-rowcount={employees.length + 1}
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

      {/* Employee Rows */}
      {employees.map((emp) => (
        <EmployeeRow
          key={emp.id}
          employee={emp}
          weekDays={weekDays}
          assignmentsMap={assignmentsMap}
          conflictsMap={conflictsMap}
          approvedLeaves={approvedLeaves}
          holidays={holidays}
          todayDateStr={todayDateStr}
          canEdit={canEdit}
          onOpenAssign={onOpenAssign}
        />
      ))}
    </div>
  );
};
