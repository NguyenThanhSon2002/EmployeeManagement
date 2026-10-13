import React from 'react';
import type { ShiftAssignment, ScheduleConflict, LeaveRequest, CompanyHoliday } from '@/types/domain.types';
import { ShiftCard } from './ShiftCard';
import { Plus, Palmtree, Lock } from 'lucide-react';

interface ScheduleCellProps {
  employeeId: number;
  workDate: string;
  assignment: ShiftAssignment | null;
  conflicts: ScheduleConflict[];
  approvedLeave: LeaveRequest | null;
  holiday: CompanyHoliday | null;
  isToday: boolean;
  isLocked: boolean;
  canEdit: boolean;
  onOpenAssign: () => void;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(({
  assignment,
  conflicts,
  approvedLeave,
  isToday,
  isLocked,
  canEdit,
  onOpenAssign,
}) => {
  let cellClass = 'schedule-cell';
  if (isToday) cellClass += ' today-cell';
  if (isLocked) cellClass += ' locked-cell';

  // 1. Inactive employee: locked cell
  if (isLocked) {
    return (
      <div
        role="gridcell"
        className={cellClass}
        title="Nhân viên đã thôi việc, không thể phân ca"
        aria-disabled="true"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
          <Lock size={16} />
        </div>
      </div>
    );
  }

  // 2. Approved leave
  if (approvedLeave) {
    return (
      <div
        role="gridcell"
        className={cellClass}
        aria-label={`Nghỉ phép: ${approvedLeave.leaveTypeName}`}
      >
        <div className="leave-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}>
            <Palmtree size={14} />
            <span>{approvedLeave.leaveTypeName}</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Đã duyệt (1 ngày)</div>
        </div>
      </div>
    );
  }

  // 3. Assigned shift
  if (assignment) {
    return (
      <div role="gridcell" className={cellClass}>
        <ShiftCard
          assignment={assignment}
          conflicts={conflicts}
          onClick={canEdit ? onOpenAssign : () => {}}
        />
      </div>
    );
  }

  // 4. Empty slot
  return (
    <div role="gridcell" className={cellClass}>
      {canEdit && (
        <button
          type="button"
          className="cell-add-btn"
          onClick={onOpenAssign}
          aria-label="Thêm phân ca mới"
          title="Click để phân ca"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
});

ScheduleCell.displayName = 'ScheduleCell';
