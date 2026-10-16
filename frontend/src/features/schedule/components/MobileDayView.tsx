import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { formatDateVi } from '@/utils/date.utils';
import { ChevronLeft, ChevronRight, Plus, Moon, AlertTriangle, Trash2, Edit } from 'lucide-react';

interface MobileDayViewProps {
  onOpenAssignDrawer: (employeeId: number, dateStr: string) => void;
}

export const MobileDayView: React.FC<MobileDayViewProps> = ({ onOpenAssignDrawer }) => {
  const {
    currentStartDate,
    assignments,
    conflicts,
    employees,
    approvedLeaves,
    filterOptions,
    deleteAssignment,
  } = useScheduleStore();
  const { currentRole } = useAuthStore();
  const { addToast } = useUIStore();

  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const baseMonday = new Date(currentStartDate);
  const selectedDate = addDays(baseMonday, selectedDayOffset);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const isReadOnly = currentRole === 'ROLE_EMPLOYEE';

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    if (filterOptions.departmentId && emp.departmentId !== filterOptions.departmentId) {
      return false;
    }
    if (filterOptions.searchTerm) {
      const q = filterOptions.searchTerm.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchCode = emp.employeeCode.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const handleDelete = (assignmentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAssignment(assignmentId, 'Xóa ca trên giao diện di động', currentRole);
    addToast({
      type: 'info',
      title: 'Đã xóa ca',
      message: 'Ca làm việc đã được xóa khỏi lịch.',
    });
  };

  return (
    <div className="mobile-day-view-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 7-Day Navigation Tabs Slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          padding: '6px 2px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          type="button"
          className="btn-icon"
          onClick={() => setSelectedDayOffset((prev) => Math.max(0, prev - 1))}
          disabled={selectedDayOffset === 0}
          style={{ flexShrink: 0 }}
        >
          <ChevronLeft size={18} />
        </button>

        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const dayDate = addDays(baseMonday, offset);
          const isSelected = selectedDayOffset === offset;
          const dayNum = dayDate.getDay();
          const dayLabel = dayNum === 0 ? 'CN' : `T${dayNum + 1}`;
          const dateLabel = format(dayDate, 'dd/MM');

          return (
            <button
              key={offset}
              type="button"
              onClick={() => setSelectedDayOffset(offset)}
              style={{
                flex: '1 0 54px',
                padding: '8px 4px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-card)',
                color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>{dayLabel}</span>
              <span style={{ fontSize: 12 }}>{dateLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          className="btn-icon"
          onClick={() => setSelectedDayOffset((prev) => Math.min(6, prev + 1))}
          disabled={selectedDayOffset === 6}
          style={{ flexShrink: 0 }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Header of selected day */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {formatDateVi(selectedDate)} ({selectedDateStr})
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {filteredEmployees.length} nhân sự
        </span>
      </div>

      {/* Employee List for the Day */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredEmployees.map((emp) => {
          const key = `${emp.id}_${selectedDateStr}`;
          const assignment = assignments[key];
          const hasConflict = !!conflicts[key] && conflicts[key].length > 0;
          const leave = approvedLeaves.find(
            (l) => l.employeeId === emp.id && selectedDateStr >= l.startDate && selectedDateStr <= l.endDate
          );

          return (
            <div
              key={emp.id}
              className="card"
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Employee info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 130 }}>
                <img
                  src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={emp.fullName}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.fullName}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp.employeeCode}</div>
                </div>
              </div>

              {/* Shift info or empty slot */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {leave ? (
                  <span
                    className="badge badge-success"
                    style={{ padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    🏖️ {leave.leaveTypeName}
                  </span>
                ) : assignment && assignment.status === 'ASSIGNED' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: assignment.snapshotColorCode,
                      color: '#000000',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {assignment.snapshotShiftName}
                        {assignment.snapshotCrossMidnight && (
                          <span style={{ color: '#722ed1', fontSize: 10 }}>
                            <Moon size={10} /> +1
                          </span>
                        )}
                        {hasConflict && (
                          <span title="Xung đột quy tắc xếp ca" style={{ color: '#d46b08' }}>
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                        {assignment.snapshotStartTime} - {assignment.snapshotEndTime}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: 24, height: 24 }}
                          onClick={() => onOpenAssignDrawer(emp.id, selectedDateStr)}
                          title="Sửa ca"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: 24, height: 24, color: '#cf1322' }}
                          onClick={(e) => handleDelete(assignment.id, e)}
                          title="Xóa ca"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenAssignDrawer(emp.id, selectedDateStr)}
                      style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                    >
                      <Plus size={14} /> Xếp ca
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
