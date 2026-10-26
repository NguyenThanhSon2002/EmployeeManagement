import React, { useState, useMemo } from 'react';
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
  checkShiftOverlap,
  checkRestTimeBetweenShifts,
  checkTravelBufferBetweenBranches,
  getShiftAbsoluteTimeRange,
} from '@/utils/conflict-detector.utils';
import { calculateShiftDurations, sumWeeklyScheduledHours } from '@/utils/schedule-calc.utils';
import {
  X,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Moon,
  Info,
  UserCheck,
  Users,
  Star,
} from 'lucide-react';
import { useAvailabilityStore } from '@/features/employees/store/useAvailabilityStore';
import { useUIStore } from '@/shared/store/useUIStore';

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
  settings,
  canEdit,
  onAssignEmployee,
  onRemoveAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set());
  const [overrideReasons, setOverrideReasons] = useState<Record<number, string>>({});
  const [filterMode, setFilterMode] = useState<'AVAILABLE' | 'ALL'>('AVAILABLE');

  const isAvailable = useAvailabilityStore((s) => s.isAvailable);
  const isPreferredShift = useAvailabilityStore((s) => s.isPreferredShift);
  const addToast = useUIStore((s) => s.addToast);

  // Day of week: 1 = Monday, ..., 7 = Sunday
  const dayOfWeek = useMemo(() => {
    if (!workDate) return 1;
    const dateObj = new Date(workDate + 'T00:00:00');
    const jsDay = dateObj.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, [workDate]);

  // Reset or initialize selections ONLY when drawer opens or shift/date changes
  React.useEffect(() => {
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

  // Compute shift details
  const shiftInfo = useMemo(() => {
    if (!shiftTemplate || !workDate) return null;
    const { netHours } = calculateShiftDurations(
      shiftTemplate.startTime,
      shiftTemplate.endTime,
      shiftTemplate.breakMinutes,
      shiftTemplate.isCrossMidnight
    );
    const timeRange = {
      workDate,
      startTime: shiftTemplate.startTime,
      endTime: shiftTemplate.endTime,
      isCrossMidnight: shiftTemplate.isCrossMidnight,
      ...getShiftAbsoluteTimeRange(
        workDate,
        shiftTemplate.startTime,
        shiftTemplate.endTime,
        shiftTemplate.isCrossMidnight
      ),
    };
    return { netHours, timeRange };
  }, [shiftTemplate, workDate]);

  // Currently assigned assignments for this template and date
  const currentAssignedMap = useMemo(() => {
    const map = new Map<number, ShiftAssignment>();
    if (!shiftTemplate || !workDate) return map;
    for (const a of allAssignments) {
      if (
        Number(a.workShiftId) === Number(shiftTemplate.id) &&
        a.workDate === workDate &&
        a.status !== 'CANCELLED'
      ) {
        map.set(Number(a.employeeId), a);
      }
    }
    return map;
  }, [shiftTemplate?.id, workDate, allAssignments]);

  // Filter employees and compute conflict status for each
  const employeeStatusList = useMemo(() => {
    if (!shiftTemplate || !workDate || !shiftInfo) return [];

    return employees
      .filter((emp) => emp.employmentStatus !== 'RESIGNED' && emp.positionId !== 1)
      .map((emp) => {
        const isAlreadyInThisShift = currentAssignedMap.has(Number(emp.id));
        const isAvailableForShift = isAvailable(
          Number(emp.id),
          dayOfWeek,
          Number(shiftTemplate.id)
        );
        const isPreferred = isPreferredShift(
          Number(emp.id),
          Number(shiftTemplate.id)
        );

      // Leaves
      const leave = approvedLeaves.find(
        (l) =>
          Number(l.employeeId) === Number(emp.id) &&
          workDate >= l.startDate &&
          workDate <= l.endDate &&
          l.status === 'APPROVED'
      );

      // Other shifts of this employee (exclude this current shift if assigned)
      const thisAssignment = currentAssignedMap.get(Number(emp.id));
      const otherShifts = allAssignments.filter(
        (a) =>
          Number(a.employeeId) === Number(emp.id) &&
          a.status !== 'CANCELLED' &&
          (!thisAssignment || a.id !== thisAssignment.id)
      );

      // Weekly hours
      const weeklyHours = sumWeeklyScheduledHours(otherShifts);

      // 1. Check Overlap on the same day
      const sameDayShifts = otherShifts.filter((s) => s.workDate === workDate);
      const overlapCheck = checkShiftOverlap(shiftInfo.timeRange, sameDayShifts);

      // 2. Check Travel Buffer Between Branches (< 45m)
      const travelCheck = checkTravelBufferBetweenBranches(
        shiftInfo.timeRange,
        otherShifts,
        undefined,
        undefined,
        45
      );

      // External shift info on the same day if any
      const sameDayExternalShift = sameDayShifts.find((s) => s.isExternal);

      // 3. Check Rest Interval (< 12h)
      const restCheck = checkRestTimeBetweenShifts(
        shiftInfo.timeRange,
        otherShifts,
        settings?.minRestBetweenShiftsHours || 12
      );

      // 4. Check Daily Hours Limit (> 12h)
      let sameDayOtherHours = 0;
      for (const s of sameDayShifts) {
        const { netHours } = calculateShiftDurations(
          s.snapshotStartTime,
          s.snapshotEndTime,
          s.snapshotBreakMinutes,
          s.snapshotCrossMidnight
        );
        sameDayOtherHours += netHours;
      }
      const totalDailyHours = sameDayOtherHours + shiftInfo.netHours;
      const isDailyExceeded = totalDailyHours > 12.0;

      return {
        emp,
        isAlreadyInThisShift,
        isAvailableForShift,
        isPreferred,
        leave,
        hasOverlap: overlapCheck.hasOverlap,
        overlapMessage: overlapCheck.message,
        hasTravelWarning: travelCheck.hasBufferConflict,
        travelMessage: travelCheck.message,
        travelConflictShift: travelCheck.conflictingShift,
        sameDayExternalShift,
        hasRestWarning: restCheck.isRestViolated,
        restMessage: restCheck.message,
        restHours: restCheck.actualRestHours,
        isDailyExceeded,
        totalDailyHours,
        weeklyHours,
        hasWarning: restCheck.isRestViolated || isDailyExceeded || travelCheck.hasBufferConflict,
      };
    });
  }, [
    employees,
    shiftTemplate,
    workDate,
    shiftInfo,
    currentAssignedMap,
    approvedLeaves,
    allAssignments,
    settings,
    dayOfWeek,
    isAvailable,
    isPreferredShift,
  ]);

  // Count available staff
  const availableCount = useMemo(() => {
    return employeeStatusList.filter(
      (item) => item.isAvailableForShift || item.isAlreadyInThisShift
    ).length;
  }, [employeeStatusList]);
  const totalCount = employeeStatusList.length;

  // Filtered by availability mode and search term, sorted with preferred candidates first
  const filteredList = useMemo(() => {
    let list = employeeStatusList;
    if (filterMode === 'AVAILABLE') {
      list = list.filter((item) => item.isAvailableForShift || item.isAlreadyInThisShift);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.emp.fullName.toLowerCase().includes(term) ||
          item.emp.employeeCode.toLowerCase().includes(term)
      );
    }

    // Sort priority:
    // 1. Currently selected (đã chọn)
    // 2. Preferred shift (ca ưu tiên của nhân viên)
    // 3. Available for shift (khả dụng)
    // 4. Overlap status (không trùng giờ lên trước)
    // 5. Warning status (không cảnh báo lên trước)
    // 6. Weekly hours ascending
    return [...list].sort((a, b) => {
      const aSelected = selectedEmpIds.has(Number(a.emp.id)) ? 1 : 0;
      const bSelected = selectedEmpIds.has(Number(b.emp.id)) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;

      const aPreferred = a.isPreferred ? 1 : 0;
      const bPreferred = b.isPreferred ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;

      const aAvailable = a.isAvailableForShift ? 1 : 0;
      const bAvailable = b.isAvailableForShift ? 1 : 0;
      if (aAvailable !== bAvailable) return bAvailable - aAvailable;

      const aOverlap = a.hasOverlap ? 1 : 0;
      const bOverlap = b.hasOverlap ? 1 : 0;
      if (aOverlap !== bOverlap) return aOverlap - bOverlap;

      const aWarning = a.hasWarning ? 1 : 0;
      const bWarning = b.hasWarning ? 1 : 0;
      if (aWarning !== bWarning) return aWarning - bWarning;

      return a.weeklyHours - b.weeklyHours;
    });
  }, [employeeStatusList, filterMode, searchTerm, selectedEmpIds]);

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
      // Adding a new employee: check maxStaffing limit
      if (selectedEmpIds.size >= maxStaffing) {
        addToast({
          type: 'warning',
          title: 'Đã đạt định biên tối đa',
          message: `Ca ${shiftTemplate.shiftName} có định biên tối đa ${maxStaffing} nhân sự. Hãy bỏ chọn nhân sự hiện tại trước khi thêm người mới.`,
        });
        return;
      }
      setSelectedEmpIds((prev) => new Set(prev).add(idNum));
    } else {
      // Deselect employee
      setSelectedEmpIds((prev) => {
        const next = new Set(prev);
        next.delete(idNum);
        return next;
      });
    }
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
        const customReason = overrideReasons[empId]?.trim();
        const reason = customReason || (hasWarning ? 'Phê duyệt phân ca part-time theo nhu cầu' : null);

        onAssignEmployee({
          employeeId: Number(empId),
          workShiftId: Number(shiftTemplate.id),
          workDate,
          overrideRule: hasWarning ? 'BR-006' : null,
          overrideReason: reason,
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
      onClick={onClose}
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
                  backgroundColor: shiftTemplate.colorCode || '#2563EB',
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
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isQuotaMet
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  color: isOverQuota ? '#DC2626' : isQuotaMet ? '#059669' : '#D97706',
                }}
              >
                {isOverQuota
                  ? `▲ Vượt định biên (${currentSelectedCount}/${maxStaffing})`
                  : isQuotaMet
                  ? `✓ Đủ định biên (${currentSelectedCount}/${minStaffing}${minStaffing !== maxStaffing ? ` - ${maxStaffing}` : ''} NV)`
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
          {/* Segmented Control: Phù hợp ca vs Tất cả nhân sự */}
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
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, maxWidth: 300, marginInline: 'auto' }}>
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
              {filteredList.map((item) => {
                const isSelected = selectedEmpIds.has(Number(item.emp.id));
                const isOverlapped = item.hasOverlap;
                const isCapacityReached = !isSelected && selectedEmpIds.size >= maxStaffing;
                const isDisabled = isOverlapped || isCapacityReached;

                return (
                  <div
                    key={item.emp.id}
                    onClick={() => handleToggleEmployee(item.emp.id, item.hasOverlap)}
                    title={
                      isCapacityReached
                        ? `Ca làm việc đã đủ định biên tối đa (${maxStaffing} NV). Bỏ chọn nhân viên hiện tại để đổi người.`
                        : isOverlapped
                        ? item.overlapMessage || 'Trùng giờ với ca khác'
                        : undefined
                    }
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: isSelected
                        ? '1.5px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isSelected
                        ? 'rgba(37, 99, 235, 0.04)'
                        : isOverlapped
                        ? '#F8FAFC'
                        : '#FFFFFF',
                      padding: '12px 14px',
                      transition: 'all 0.15s ease',
                      opacity: isDisabled ? 0.65 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {/* Checkbox and info */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flex: 1,
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleEmployee(item.emp.id, item.hasOverlap);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: 18,
                            height: 18,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            accentColor: 'var(--color-primary)',
                          }}
                        />

                        {/* Avatar */}
                        {item.emp.avatarUrl ? (
                          <img
                            src={item.emp.avatarUrl}
                            alt={item.emp.fullName}
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {item.emp.fullName.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                              {item.emp.fullName}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              ({item.emp.employeeCode})
                            </span>
                            {item.emp.hasMultiBranch && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  backgroundColor: '#EFF6FF',
                                  color: '#1D4ED8',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  border: '1px solid #BFDBFE',
                                }}
                                title="Nhân viên làm việc luân phiên/kiêm nhiệm nhiều cơ sở"
                              >
                                Đa cơ sở
                              </span>
                            )}
                            {item.emp.employmentStatus === 'ON_LEAVE' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  backgroundColor: '#FEF3C7',
                                  color: '#D97706',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #FDE68A',
                                }}
                                title="Nhân viên đang trong thời gian nghỉ chế độ / tạm hoãn"
                              >
                                Nghỉ chế độ
                              </span>
                            )}
                            {item.isPreferred && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  backgroundColor: '#FEF3C7',
                                  color: '#B45309',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #FDE68A',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                                title="Nhân viên đã đăng ký ưu tiên nhận làm ca này"
                              >
                                <Star size={10} fill="#B45309" color="#B45309" />
                                Ưu tiên ca này
                              </span>
                            )}
                            <a
                              href={`/employees/${item.emp.id}?tab=AVAILABILITY`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: 11,
                                color: 'var(--color-primary, #2563EB)',
                                textDecoration: 'none',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                padding: '1px 4px',
                                borderRadius: 4,
                                backgroundColor: '#EFF6FF',
                              }}
                              title="Mở tab đăng ký lịch khả dụng của nhân viên này"
                            >
                              Lịch rảnh ↗
                            </a>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>Đã xếp tuần: <strong>{item.weeklyHours.toFixed(1)}h / 48h</strong></span>
                            {item.emp.homeBranchName && (
                              <span style={{ color: '#64748B' }}>
                                • Cơ sở gốc: {item.emp.homeBranchName.replace('Chi nhánh ', 'CN ')}
                              </span>
                            )}
                          </div>
                          {item.sameDayExternalShift && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#1E40AF',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #DBEAFE',
                                padding: '2px 6px',
                                borderRadius: 4,
                                marginTop: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>📍</span>
                              <span>
                                Đang có ca tại <strong>{item.sameDayExternalShift.branchName || 'cơ sở khác'}</strong> ({item.sameDayExternalShift.snapshotStartTime.slice(0, 5)} - {item.sameDayExternalShift.snapshotEndTime.slice(0, 5)})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {/* Availability Tag */}
                        {item.isAvailableForShift ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#059669',
                              backgroundColor: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <CheckCircle2 size={11} color="#059669" /> Phù hợp ca
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              border: '1px solid #FDE68A',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="Nhân viên chưa khai báo sẵn sàng cho ca này"
                          >
                            <AlertTriangle size={11} color="#B45309" /> Ngoài lịch đăng ký
                          </span>
                        )}

                        {item.leave && (
                          <span
                            className="badge badge-success"
                            style={{ fontSize: 11, padding: '2px 6px' }}
                            title={`Đã duyệt nghỉ phép: ${item.leave.leaveTypeName}`}
                          >
                            🏖️ Nghỉ phép
                          </span>
                        )}

                        {isOverlapped && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#DC2626',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title={item.overlapMessage || 'Trùng giờ ca khác'}
                          >
                            <AlertCircle size={11} /> Trùng ca khác
                          </span>
                        )}

                        {!isOverlapped && item.hasTravelWarning && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#D97706',
                              backgroundColor: '#FEF3C7',
                              border: '1px solid #FDE68A',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title={item.travelMessage || 'Khoảng đệm di chuyển giữa 2 cơ sở dưới 45 phút'}
                          >
                            <AlertTriangle size={11} color="#D97706" /> Di chuyển &lt;45p
                          </span>
                        )}

                        {!isOverlapped && item.hasRestWarning && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#D97706',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title={item.restMessage || 'Nghỉ giữa ca dưới 12h'}
                          >
                            <AlertTriangle size={11} /> Nghỉ {item.restHours.toFixed(1)}h (&lt;12h)
                          </span>
                        )}

                        {!isOverlapped && item.isDailyExceeded && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#D97706',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            &gt;12h/ngày ({item.totalDailyHours.toFixed(1)}h)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Override justification input (optional for part-time, helpful for manager) */}
                    {isSelected && item.hasWarning && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: '1px dashed #FDE68A',
                          backgroundColor: '#FEFCE8',
                          padding: 8,
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#B45309', fontWeight: 600 }}>
                          <Info size={12} />
                          Ghi chú đặc cách / Ca 2 (Không bắt buộc):
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập ghi chú đặc cách nếu có (hoặc để trống)..."
                          value={overrideReasons[item.emp.id] || ''}
                          onChange={(e) =>
                            setOverrideReasons((prev) => ({ ...prev, [item.emp.id]: e.target.value }))
                          }
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            padding: '4px 8px',
                            borderColor: '#FCD34D',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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
