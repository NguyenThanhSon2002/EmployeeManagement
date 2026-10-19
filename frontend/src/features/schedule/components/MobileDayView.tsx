import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useScheduleStore } from '../store/useScheduleStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { formatDateVi } from '@/utils/date.utils';
import type { ShiftAssignment } from '@/types/domain.types';
import { ChevronLeft, ChevronRight, Plus, Moon, AlertTriangle, Trash2, Edit } from 'lucide-react';

interface MobileDayViewProps {
  onOpenAssignDrawer: (employeeId: number, dateStr: string, targetAssignment?: ShiftAssignment | null) => void;
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
    if (filterOptions.branchId && emp.branchId !== filterOptions.branchId) {
      return false;
    }
    if (filterOptions.searchTerm) {
      const q = filterOptions.searchTerm.toLowerCase();
      return emp.fullName.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = (assignmentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phân ca này?')) {
      deleteAssignment(assignmentId);
      addToast({ type: 'info', message: 'Đã xóa phân ca thành công' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Day Selector Tabs (Mon..Sun) */}
      <div
        className="card"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          className="btn-icon"
          onClick={() => setSelectedDayOffset((prev) => Math.max(0, prev - 1))}
          disabled={selectedDayOffset === 0}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {selectedDayOffset === 0 ? 'Thứ Hai' : `Thứ ${selectedDayOffset + 2}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {formatDateVi(selectedDate)}
          </div>
        </div>

        <button
          type="button"
          className="btn-icon"
          onClick={() => setSelectedDayOffset((prev) => Math.min(6, prev + 1))}
          disabled={selectedDayOffset === 6}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Staff count header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Danh sách nhân sự ngày {formatDateVi(selectedDate)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {filteredEmployees.length} nhân sự
        </span>
      </div>

      {/* Employee List for the Day */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredEmployees.map((emp) => {
          const key = `${emp.id}_${selectedDateStr}`;
          const rawList = assignments[key];
          const empDayAssignments: ShiftAssignment[] = Array.isArray(rawList)
            ? rawList
            : (rawList ? [rawList as any] : []);
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {leave ? (
                  <span
                    className="badge badge-success"
                    style={{ padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    🏖️ {leave.leaveTypeName}
                  </span>
                ) : empDayAssignments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'flex-end' }}>
                    {empDayAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          backgroundColor: assignment.snapshotColorCode || '#EFF6FF',
                          color: '#000000',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 12,
                          fontWeight: 600,
                          minWidth: 180,
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
                              onClick={() => onOpenAssignDrawer(emp.id, selectedDateStr, assignment)}
                              title="Sửa ca này"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ width: 24, height: 24, color: '#cf1322' }}
                              onClick={(e) => handleDelete(assignment.id, e)}
                              title="Xóa ca này"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {!isReadOnly && empDayAssignments.length < 2 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onOpenAssignDrawer(emp.id, selectedDateStr, null)}
                        style={{ height: 26, padding: '0 8px', fontSize: 11, marginTop: 2 }}
                      >
                        <Plus size={12} /> + Ca 2
                      </button>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenAssignDrawer(emp.id, selectedDateStr, null)}
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
