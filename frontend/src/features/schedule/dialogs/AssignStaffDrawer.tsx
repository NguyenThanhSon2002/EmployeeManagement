import React, { useState, useEffect } from 'react';
import type {
  Employee,
  ShiftTemplate,
  ShiftAssignment,
  LeaveRequest,
  CompanyHoliday,
  DemoSettings,
} from '@/types/domain.types';
import { formatDateVi } from '@/utils/date.utils';
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Moon,
  UserCheck,
  Users,
} from 'lucide-react';
import { StaffEligibilityItem } from './StaffEligibilityItem';
import { useStaffEligibilityList } from '../hooks/useStaffEligibilityList';

interface AssignStaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shiftTemplate: ShiftTemplate | null;
  workDate: string; // YYYY-MM-DD
  employees: Employee[];
  allAssignments: ShiftAssignment[];
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  settings: DemoSettings;
  branchId?: number;
  branchName?: string;
  canEdit: boolean;
  onAssignEmployee: (payload: {
    employeeId: number;
    workShiftId: number;
    workDate: string;
    overrideRule?: string | null;
    overrideReason?: string | null;
  }) => void;
  onRemoveAssignment: (assignmentId: number) => void;
}

export const AssignStaffDrawer: React.FC<AssignStaffDrawerProps> = ({
  isOpen,
  onClose,
  shiftTemplate,
  workDate,
  employees = [],
  allAssignments = [],
  approvedLeaves = [],
  branchId,
  branchName,
  settings,
  canEdit,
  onAssignEmployee,
  onRemoveAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set());
  const [overrideReasons, setOverrideReasons] = useState<Record<number, string>>({});
  const [filterMode, setFilterMode] = useState<'AVAILABLE' | 'ALL'>('AVAILABLE');

  // Reset or initialize selections ONLY when drawer opens or shift/date changes
  useEffect(() => {
    if (isOpen && shiftTemplate && workDate) {
      const activeAssignments = allAssignments.filter(
        (a) =>
          Number(a.workShiftId) === Number(shiftTemplate.id) &&
          a.workDate === workDate &&
          a.status !== 'CANCELLED'
      );
      setSelectedEmpIds(new Set(activeAssignments.map((a) => Number(a.employeeId))));
      setOverrideReasons({});
      setSearchTerm('');
      setFilterMode('AVAILABLE');
    }
  }, [isOpen, shiftTemplate?.id, workDate]);

  const {
    shiftInfo,
    currentAssignedMap,
    employeeStatusList,
    availableCount,
    totalCount,
    filteredList,
  } = useStaffEligibilityList({
    employees,
    shiftTemplate,
    workDate,
    allAssignments,
    approvedLeaves,
    settings,
    branchId,
    branchName,
    selectedEmpIds,
    filterMode,
    searchTerm,
  });

  if (!isOpen || !shiftTemplate || !workDate || !shiftInfo) return null;

  const minStaffing = shiftTemplate.minStaffing || 1;
  const maxStaffing = shiftTemplate.maxStaffing || minStaffing;
  const currentSelectedCount = selectedEmpIds.size;
  const isQuotaMet = currentSelectedCount >= minStaffing && currentSelectedCount <= maxStaffing;
  const isOverQuota = currentSelectedCount > maxStaffing;

  const handleToggleEmployee = (empId: number, hasOverlap: boolean) => {
    if (hasOverlap || !canEdit) return;

    const idNum = Number(empId);
    if (!selectedEmpIds.has(idNum)) {
      setSelectedEmpIds((prev) => new Set(prev).add(idNum));
    } else {
      setSelectedEmpIds((prev) => {
        const next = new Set(prev);
        next.delete(idNum);
        return next;
      });
    }
  };

  const handleOverrideReasonChange = (empId: number, reason: string) => {
    setOverrideReasons((prev) => ({
      ...prev,
      [empId]: reason,
    }));
  };

  const handleSave = () => {
    if (!canEdit) return;

    // Process removals (unselected employees that were previously assigned)
    for (const [empId, assignment] of currentAssignedMap.entries()) {
      if (!selectedEmpIds.has(Number(empId))) {
        onRemoveAssignment(assignment.id);
      }
    }

    // Process additions (selected employees that were not previously assigned)
    for (const empId of selectedEmpIds) {
      if (!currentAssignedMap.has(Number(empId))) {
        const status = employeeStatusList.find((s) => Number(s.emp.id) === Number(empId));
        const hasWarning = status?.hasWarning;
        const isOverMax = selectedEmpIds.size > maxStaffing;
        const customReason = overrideReasons[empId]?.trim() || null;

        onAssignEmployee({
          employeeId: Number(empId),
          workShiftId: Number(shiftTemplate.id),
          workDate,
          overrideRule: isOverMax || hasWarning ? 'WARN_STAFFING_CAPACITY' : null,
          overrideReason: customReason,
        });
      }
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phân bổ nhân sự vào ca"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: shiftTemplate.textColor || shiftTemplate.colorCode || '#2563EB',
                }}
              />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {shiftTemplate.shiftName}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isOverQuota
                    ? 'rgba(37, 99, 235, 0.12)'
                    : isQuotaMet
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  color: isOverQuota ? '#1D4ED8' : isQuotaMet ? '#059669' : '#D97706',
                }}
              >
                {isOverQuota
                  ? `✓ Đã bổ sung (${currentSelectedCount}/${maxStaffing} NV - Tăng cường)`
                  : isQuotaMet
                  ? `✓ Đủ định biên (${currentSelectedCount}/${minStaffing}${
                      minStaffing !== maxStaffing ? ` - ${maxStaffing}` : ''
                    } NV)`
                  : `▲ Cần ${minStaffing} NV (${currentSelectedCount}/${minStaffing})`}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 6,
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>📅 {formatDateVi(workDate)}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} />
                {shiftTemplate.startTime} - {shiftTemplate.endTime}
                {shiftTemplate.isCrossMidnight && (
                  <span style={{ color: '#722ED1', fontSize: 11 }}>
                    <Moon size={11} style={{ display: 'inline' }} /> +1
                  </span>
                )}
                ({shiftInfo.netHours.toFixed(1)}h)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 4,
              borderRadius: 'var(--radius-md)',
            }}
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Search & Filter Bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border)' }}>
          {/* Segmented Control */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              padding: 4,
              backgroundColor: '#F1F5F9',
              borderRadius: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setFilterMode('AVAILABLE')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterMode === 'AVAILABLE' ? 700 : 500,
                border: filterMode === 'AVAILABLE' ? '1px solid var(--color-primary)' : '1px solid transparent',
                backgroundColor: filterMode === 'AVAILABLE' ? '#FFFFFF' : 'transparent',
                color: filterMode === 'AVAILABLE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: filterMode === 'AVAILABLE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <UserCheck size={14} color={filterMode === 'AVAILABLE' ? 'var(--color-primary)' : '#64748B'} />
              Phù hợp ca ({availableCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterMode === 'ALL' ? 700 : 500,
                border: filterMode === 'ALL' ? '1px solid var(--color-primary)' : '1px solid transparent',
                backgroundColor: filterMode === 'ALL' ? '#FFFFFF' : 'transparent',
                color: filterMode === 'ALL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: filterMode === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={14} color={filterMode === 'ALL' ? 'var(--color-primary)' : '#64748B'} />
              Tất cả nhân sự ({totalCount})
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên theo tên hoặc mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36, width: '100%', fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Đã chọn: <strong style={{ color: 'var(--color-primary)' }}>{currentSelectedCount}</strong> nhân sự
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              Mục tiêu định biên: <strong>{minStaffing}</strong> nhân viên
            </span>
          </div>
        </div>

        {/* 3. Employee List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {filteredList.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {filterMode === 'AVAILABLE' ? (
                <div>
                  <AlertCircle size={32} color="#F59E0B" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-main)' }}>
                    Không có nhân sự nào đăng ký ca này
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      marginTop: 4,
                      maxWidth: 300,
                      marginInline: 'auto',
                    }}
                  >
                    Chưa có nhân sự nào khai báo lịch rảnh cho {shiftTemplate.shiftName} vào ngày này.
                  </div>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => setFilterMode('ALL')}
                    style={{ marginTop: 12, fontSize: 12 }}
                  >
                    Xem tất cả nhân sự ({totalCount})
                  </button>
                </div>
              ) : (
                <div>Không tìm thấy nhân viên nào phù hợp.</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredList.map((item) => (
                <StaffEligibilityItem
                  key={item.emp.id}
                  item={item}
                  isSelected={selectedEmpIds.has(Number(item.emp.id))}
                  canEdit={canEdit}
                  overrideReason={overrideReasons[item.emp.id] || ''}
                  onToggle={handleToggleEmployee}
                  onOverrideReasonChange={handleOverrideReasonChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Đã chọn: <strong style={{ color: 'var(--color-primary)' }}>{currentSelectedCount}</strong> nhân sự
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Hủy Bỏ
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!canEdit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} />
              Lưu Phân Bổ ({currentSelectedCount} NV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
