import React, { useState } from 'react';
import type { Employee, ShiftTemplate } from '@/types/domain.types';
import { formatDateIso } from '@/utils/date.utils';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';
import { X, Users, Check } from 'lucide-react';

interface BulkAssignDialogProps {
  isOpen: boolean;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  currentStartDate: string; // YYYY-MM-DD
  onClose: () => void;
  onSubmit: (payload: {
    employeeIds: number[];
    workShiftId: number;
    fromDate: string;
    toDate: string;
    overrideReason?: string;
  }) => void;
}

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
  isOpen,
  employees,
  shiftTemplates,
  currentStartDate,
  onClose,
  onSubmit,
}) => {
  const modalRef = useModalFocusTrap({ isOpen, onClose });
  const activeEmployees = employees.filter((e) => e.isActive && e.employmentStatus !== 'RESIGNED');

  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>(
    activeEmployees.map((e) => e.id)
  );
  const [selectedShiftId, setSelectedShiftId] = useState<number>(shiftTemplates[0]?.id || 1);
  const [fromDate, setFromDate] = useState<string>(currentStartDate);
  const [toDate, setToDate] = useState<string>(
    formatDateIso(new Date(new Date(currentStartDate).getTime() + 4 * 24 * 60 * 60 * 1000))
  );

  if (!isOpen) return null;

  const handleToggleAll = () => {
    if (selectedEmpIds.length === activeEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(activeEmployees.map((e) => e.id));
    }
  };

  const handleToggleEmployee = (id: number) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) return;

    onSubmit({
      employeeIds: selectedEmpIds,
      workShiftId: selectedShiftId,
      fromDate,
      toDate,
    });
    onClose();
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby="bulk-dialog-heading"
        aria-modal="true"
        style={{ width: 560 }}
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
            <Users size={20} color="var(--color-primary)" />
            <h2 id="bulk-dialog-heading" style={{ fontSize: 'var(--font-h3)', fontWeight: 600 }}>
              Gán Ca Làm Việc Hàng Loạt
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-lg)', overflowY: 'auto' }}>
          {/* Shift Selection */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-body-md)', marginBottom: 6 }}>
              Mẫu ca làm việc:
            </label>
            <select
              className="input-base"
              style={{ width: '100%' }}
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(Number(e.target.value))}
            >
              {shiftTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.shiftName} ({t.startTime} - {t.endTime}
                  {t.isCrossMidnight ? ' +1 ngày' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-md)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Từ ngày:
              </label>
              <input
                type="date"
                className="input-base"
                style={{ width: '100%' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-caption)', marginBottom: 4 }}>
                Đến ngày:
              </label>
              <input
                type="date"
                className="input-base"
                style={{ width: '100%' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontWeight: 600, fontSize: 'var(--font-body-md)' }}>
                Nhân sự áp dụng ({selectedEmpIds.length}/{activeEmployees.length}):
              </label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleToggleAll}
                style={{ padding: '0 4px', height: 28, fontSize: 'var(--font-caption)' }}
              >
                {selectedEmpIds.length === activeEmployees.length ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ'}
              </button>
            </div>

            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 6,
              }}
            >
              {activeEmployees.map((emp) => {
                const isChecked = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isChecked ? 'var(--color-surface-hover)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--font-caption)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEmployee(emp.id)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontWeight: 500 }}>{emp.fullName}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>({emp.employeeCode})</span>
                    {emp.employmentStatus === 'ON_LEAVE' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          padding: '1px 5px',
                          borderRadius: 4,
                          marginLeft: 'auto',
                        }}
                      >
                        Nghỉ chế độ
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </form>

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
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedEmpIds.length === 0}
            onClick={handleSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={16} />
            Áp dụng phân ca
          </button>
        </div>
      </div>
    </>
  );
};
