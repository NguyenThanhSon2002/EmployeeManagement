import React, { useMemo } from 'react';
import type { Employee, ScheduleConflict, ShiftAssignment } from '@/types/domain.types';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { Send, X, AlertOctagon, CheckCircle2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PublishConfirmDialogProps {
  isOpen: boolean;
  conflicts: Record<string, ScheduleConflict[]>;
  startDate: string;
  endDate: string;
  employees: Employee[];
  assignments: Record<string, ShiftAssignment[]>;
  onDeleteAssignment?: (assignmentId: number) => Promise<void> | void;
  onClose: () => void;
  onConfirm: () => void;
}

export const PublishConfirmDialog: React.FC<PublishConfirmDialogProps> = ({
  isOpen,
  conflicts,
  startDate,
  endDate,
  employees,
  assignments,
  onDeleteAssignment,
  onClose,
  onConfirm,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });

  // Map employee map for quick lookup
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Flatten all assignments list for quick lookup
  const allAssignments = useMemo(() => {
    return Object.values(assignments).flat();
  }, [assignments]);

  // Filter conflicts strictly within current week [startDate, endDate]
  const weekConflicts = useMemo(() => {
    const list: ScheduleConflict[] = [];
    for (const [key, conflictList] of Object.entries(conflicts)) {
      const parts = key.split('_');
      const workDate = parts.length > 1 ? parts[1] : '';
      if (workDate >= startDate && workDate <= endDate) {
        list.push(...conflictList);
      }
    }
    return list;
  }, [conflicts, startDate, endDate]);

  const mandatoryConflicts = useMemo(
    () => weekConflicts.filter((c) => c.severity === 'MANDATORY'),
    [weekConflicts]
  );
  const warningConflicts = useMemo(
    () => weekConflicts.filter((c) => c.severity === 'WARNING'),
    [weekConflicts]
  );

  const hasMandatory = mandatoryConflicts.length > 0;

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="publish-dialog-heading"
        aria-modal="true"
        style={{ width: 560, maxWidth: '95vw' }}
      >
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} color={hasMandatory ? 'var(--color-error)' : 'var(--color-primary)'} />
            <h2 id="publish-dialog-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Công Bố Lịch Làm Việc Tuần
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-lg)' }}>
          {hasMandatory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-error-bg)',
                  border: '1px solid var(--color-error-border)',
                  color: 'var(--shift-night-text)',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <AlertOctagon size={24} color="var(--color-error)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-error)' }}>
                    KHÔNG THỂ CÔNG BỐ LỊCH!
                  </div>
                  <div style={{ fontSize: 'var(--font-caption)', marginTop: 4 }}>
                    Hệ thống phát hiện còn <strong>{mandatoryConflicts.length} lỗi phân ca nghiêm trọng</strong> trong tuần hiện tại.
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color: 'var(--color-text-secondary)' }}>
                    Vui lòng giải quyết hoặc hủy các ca vi phạm dưới đây để mở khóa tính năng công bố lịch.
                  </div>
                </div>
              </div>

              {/* Danh sách ca vi phạm chi tiết */}
              <div
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingRight: 4,
                }}
              >
                {mandatoryConflicts.map((conflict, idx) => {
                  const emp = employeeMap.get(conflict.employeeId);
                  const matchingAssignment = allAssignments.find(
                    (a) =>
                      a.employeeId === conflict.employeeId &&
                      a.workDate === conflict.workDate &&
                      a.status !== 'CANCELLED'
                  );

                  let formattedDate = conflict.workDate;
                  try {
                    formattedDate = format(parseISO(conflict.workDate), 'EEEE, dd/MM/yyyy', { locale: vi });
                  } catch {
                    // Fallback to raw string
                  }

                  return (
                    <div
                      key={conflict.id || `conflict-${idx}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#fff',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                            {emp ? `${emp.fullName} (${emp.employeeCode})` : `Nhân viên #${conflict.employeeId}`}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                            }}
                          >
                            {formattedDate}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-error)',
                            marginTop: 3,
                            lineHeight: 1.4,
                          }}
                        >
                          {conflict.message}
                        </div>
                      </div>

                      {matchingAssignment && onDeleteAssignment && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onDeleteAssignment(matchingAssignment.id)}
                          title="Hủy ca làm việc vi phạm này"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error-border)',
                            backgroundColor: '#fff1f0',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            padding: '4px 8px',
                          }}
                        >
                          <Trash2 size={13} />
                          Hủy ca này
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                Bạn có chắc chắn muốn <strong>công bố chính thức</strong> lịch phân ca tuần này?
              </p>
              <ul style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)', paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Toàn bộ nhân viên chi nhánh sẽ nhìn thấy ca làm việc của mình trên cổng portal.</li>
                <li>Mọi thay đổi tiếp theo sau khi công bố sẽ yêu cầu nhập lý do giải trình và lưu vết kiểm toán.</li>
                {warningConflicts.length > 0 && (
                  <li style={{ color: '#d48806', fontWeight: 500 }}>
                    Lưu ý: Tuần hiện có {warningConflicts.length} ca có cảnh báo chính sách đã được duyệt đặc cách.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            backgroundColor: '#fafafa',
          }}
        >
          <button type="button" className="btn btn-default" onClick={onClose}>
            {hasMandatory ? 'Đóng lại' : 'Hủy bỏ'}
          </button>
          {!hasMandatory && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} />
              Xác nhận công bố
            </button>
          )}
        </div>
      </div>
    </>
  );
};
