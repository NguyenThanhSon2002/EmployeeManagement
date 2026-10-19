import React, { useState, useMemo } from 'react';
import type {
  Employee,
  ShiftTemplate,
  ShiftAssignment,
  ScheduleConflict,
  LeaveRequest,
  CompanyHoliday,
  DemoSettings,
  RoleType,
} from '@/types/domain.types';
import { formatDateVi, formatTimeVi } from '@/utils/date.utils';
import {
  validateAllShiftConflicts,
  getShiftAbsoluteTimeRange,
} from '@/utils/conflict-detector.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { X, AlertTriangle, AlertCircle, Trash2, CheckCircle2, Moon, Sun, Sunrise, Sunset, Info } from 'lucide-react';

interface AssignShiftDrawerProps {
  isOpen: boolean;
  employee: Employee | null;
  workDate: string; // YYYY-MM-DD
  existingAssignment: ShiftAssignment | null;
  existingDayAssignments?: ShiftAssignment[];
  shiftTemplates: ShiftTemplate[];
  allEmployeeAssignments: ShiftAssignment[];
  employeeLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  settings: DemoSettings;
  isPublishedWeek: boolean;
  currentRole: RoleType;
  onClose: () => void;
  onSave: (payload: {
    assignmentId?: number;
    workShiftId: number;
    overrideRule?: string | null;
    overrideReason?: string | null;
    changeReason?: string;
  }) => void;
  onDelete: (assignmentId: number, changeReason?: string) => void;
}

export const AssignShiftDrawer: React.FC<AssignShiftDrawerProps> = ({
  isOpen,
  employee,
  workDate,
  existingAssignment,
  existingDayAssignments = [],
  shiftTemplates,
  allEmployeeAssignments,
  employeeLeaves,
  holidays,
  settings,
  isPublishedWeek,
  onClose,
  onSave,
  onDelete,
}) => {
  const drawerRef = useModalFocusTrap<HTMLElement>({ isOpen, onClose });
  const [selectedShiftId, setSelectedShiftId] = useState<number>(
    existingAssignment ? existingAssignment.workShiftId : shiftTemplates[0]?.id || 1
  );
  const [confirmOverride, setConfirmOverride] = useState<boolean>(
    Boolean(existingAssignment?.overrideRule)
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    existingAssignment?.overrideReason || ''
  );
  const [changeReason, setChangeReason] = useState<string>('');

  // Selected template object
  const selectedTemplate = shiftTemplates.find((t) => t.id === selectedShiftId) || shiftTemplates[0];

  // Real-time conflict validation
  const validationConflicts: ScheduleConflict[] = useMemo(() => {
    if (!employee || !selectedTemplate) return [];

    const { startMs, endMs } = getShiftAbsoluteTimeRange(
      workDate,
      selectedTemplate.startTime,
      selectedTemplate.endTime,
      selectedTemplate.isCrossMidnight
    );

    const { netHours } = calculateShiftDurations(
      selectedTemplate.startTime,
      selectedTemplate.endTime,
      selectedTemplate.breakMinutes,
      selectedTemplate.isCrossMidnight
    );

    const shiftRange = {
      id: existingAssignment ? existingAssignment.id : undefined,
      workDate,
      startTime: selectedTemplate.startTime,
      endTime: selectedTemplate.endTime,
      isCrossMidnight: selectedTemplate.isCrossMidnight,
      startMs,
      endMs,
    };

    return validateAllShiftConflicts({
      employee,
      newShiftRange: shiftRange,
      newShiftNetHours: netHours,
      existingShifts: allEmployeeAssignments,
      employeeLeaves,
      holidays,
      settings,
    });
  }, [
    employee,
    selectedTemplate,
    workDate,
    existingAssignment,
    allEmployeeAssignments,
    employeeLeaves,
    holidays,
    settings,
  ]);

  if (!isOpen || !employee) return null;

  const mandatoryConflict = validationConflicts.find((c) => c.severity === 'MANDATORY');
  const warningConflicts = validationConflicts.filter((c) => c.severity === 'WARNING');
  const hasWarnings = warningConflicts.length > 0;

  // Validation rules for Save button enablement:
  // 1. Mandatory conflict blocks saving completely
  // 2. If warnings exist: requires confirmOverride === true AND overrideReason.trim().length >= 5
  // 3. If week is PUBLISHED: requires changeReason.trim().length >= 5
  const canSave =
    !mandatoryConflict &&
    (!hasWarnings || (confirmOverride && overrideReason.trim().length >= 5)) &&
    (!isPublishedWeek || changeReason.trim().length >= 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    onSave({
      assignmentId: existingAssignment ? existingAssignment.id : undefined,
      workShiftId: selectedShiftId,
      overrideRule: hasWarnings ? warningConflicts[0].ruleCode : null,
      overrideReason: hasWarnings ? overrideReason : null,
      changeReason: isPublishedWeek ? changeReason : undefined,
    });
  };

  const getShiftIcon = (t: ShiftTemplate) => {
    if (t.isCrossMidnight || t.startTime >= '22:00') return <Moon size={16} color="var(--shift-night-text)" />;
    if (t.startTime >= '14:00') return <Sunset size={16} color="var(--shift-afternoon-text)" />;
    if (t.startTime < '07:00') return <Sunrise size={16} color="var(--shift-early-text)" />;
    return <Sun size={16} color="var(--shift-morning-text)" />;
  };

  const otherShiftsInDay = existingDayAssignments.filter(
    (a) => existingAssignment === null || a.id !== existingAssignment.id
  );

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel (SCR-12) */}
      <aside
        ref={drawerRef}
        className="drawer-panel"
        role="dialog"
        aria-labelledby="drawer-heading"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id="drawer-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              {existingAssignment
                ? 'Chỉnh Sửa Phân Ca'
                : otherShiftsInDay.length > 0
                ? 'Gán Thêm Ca 2 Trong Ngày'
                : 'Gán Ca Làm Việc'}
            </h2>
            <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {employee.fullName} ({employee.employeeCode}) • Ngày {formatDateVi(workDate)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng gán ca"
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)' }}>
          {/* Banner notice if day already has 1 shift */}
          {otherShiftsInDay.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                marginBottom: 16,
                fontSize: '13px',
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Ca đã có trong ngày: </strong>
                {otherShiftsInDay.map((s) => `${s.snapshotShiftName} (${s.snapshotStartTime} - ${s.snapshotEndTime})`).join(', ')}.
                <div style={{ fontSize: 12, marginTop: 2, color: '#3B82F6' }}>
                  Hệ thống đang hỗ trợ phân bổ ca thứ 2. Vui lòng đảm bảo 2 ca không bị trùng giờ.
                </div>
              </div>
            </div>
          )}

          {/* Shift Selection List */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-body-md)', marginBottom: 8 }}>
              Chọn ca làm việc:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shiftTemplates.map((template) => {
                const isSelected = template.id === selectedShiftId;
                const { netHours } = calculateShiftDurations(
                  template.startTime,
                  template.endTime,
                  template.breakMinutes,
                  template.isCrossMidnight
                );

                return (
                  <label
                    key={template.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-info-bg)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="radio"
                        name="shiftTemplate"
                        value={template.id}
                        checked={isSelected}
                        onChange={() => setSelectedShiftId(template.id)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      {getShiftIcon(template)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
                          {template.shiftName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', gap: 8 }}>
                          <span>
                            {formatTimeVi(template.startTime)} - {formatTimeVi(template.endTime)}
                            {template.isCrossMidnight && ' (+1 ngày)'}
                          </span>
                          <span>•</span>
                          <span>{netHours}h công</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mandatory Conflict Error */}
          {mandatoryConflict && (
            <div
              style={{
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={20} color="var(--color-error)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-error)', fontSize: 'var(--font-body-md)' }}>
                  Xung đột nghiêm trọng (Chặn lưu):
                </div>
                <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-error)', marginTop: 4 }}>
                  {mandatoryConflict.message}
                </div>
              </div>
            </div>
          )}

          {/* Warning Conflict Notice */}
          {!mandatoryConflict && hasWarnings && (
            <div
              style={{
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#92400E', fontSize: 'var(--font-body-md)' }}>
                    Cảnh báo quy tắc xếp ca:
                  </div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 'var(--font-caption)', color: '#78350F' }}>
                    {warningConflicts.map((c, i) => (
                      <li key={i}>{c.message}</li>
                    ))}
                  </ul>

                  {/* Override Confirmation */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-warning-border)' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 'var(--font-caption)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={confirmOverride}
                        onChange={(e) => setConfirmOverride(e.target.checked)}
                        style={{ marginTop: 2 }}
                      />
                      <span>Xác nhận đặc cách vi phạm quy tắc này</span>
                    </label>

                    {confirmOverride && (
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 'var(--font-caption)',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          Lý do giải trình đặc cách (Tối thiểu 5 ký tự): <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <textarea
                          rows={2}
                          className="input-base"
                          style={{ width: '100%', height: 'auto', padding: '8px' }}
                          placeholder="Ví dụ: Nhân viên đăng ký tăng ca tự nguyện giải quyết đơn hàng gấp"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Published Schedule: Change Reason */}
          {isPublishedWeek && (
            <div
              style={{
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--color-info)', fontSize: 'var(--font-body-md)', marginBottom: 6 }}>
                Ghi chú điều chỉnh lịch đã công bố:
              </div>
              <input
                type="text"
                className="input-base"
                style={{ width: '100%' }}
                placeholder="Ví dụ: Đổi ca trực theo đề xuất của nhân viên"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
              <div style={{ fontSize: 11, textAlign: 'right', marginTop: 2, color: changeReason.trim().length < 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                {changeReason.trim().length}/5 ký tự
              </div>
            </div>
          )}
        </form>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          {existingAssignment ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDelete(existingAssignment.id, isPublishedWeek ? changeReason : undefined)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={16} />
              Xóa ca này
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-default" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSave}
              onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} />
              Lưu phân ca
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
