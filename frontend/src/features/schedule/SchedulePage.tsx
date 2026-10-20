import React, { useState, useMemo } from 'react';
import { addDays, format, parseISO, startOfMonth, addMonths } from 'date-fns';
import { getWeekDays, getCurrentMonday } from '@/utils/date.utils';
import { useScheduleStore } from './store/useScheduleStore';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { useUIStore } from '@/shared/store/useUIStore';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import { ScheduleToolbar } from './components/ScheduleToolbar';
import { ScheduleSummaryCards } from './components/ScheduleSummaryCards';
import { ScheduleFiltersBar } from './components/ScheduleFiltersBar';
import { WeeklyGrid } from './components/WeeklyGrid';
import { MonthViewGrid } from './components/MonthViewGrid';
import { EmployeeWeeklyHoursTable } from './components/EmployeeWeeklyHoursTable';
import { AssignStaffDrawer } from './dialogs/AssignStaffDrawer';
import { BulkAssignDialog } from './dialogs/BulkAssignDialog';
import { CopyWeekDialog } from './dialogs/CopyWeekDialog';
import { PublishConfirmDialog } from './dialogs/PublishConfirmDialog';
import { UnpublishConfirmDialog } from './dialogs/UnpublishConfirmDialog';
import { ChangeHistoryDrawer } from './dialogs/ChangeHistoryDrawer';
import { buildWeeklyRosterCsv, downloadCsvFile } from '@/utils/csv-exporter.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import type { ShiftAssignment } from '@/types/domain.types';
import './schedule.css';

export const SchedulePage: React.FC = () => {
  const {
    currentStartDate,
    scheduleStatus,
    assignments,
    conflicts,
    changeHistory,
    viewMode,
    filterOptions,
    employees,
    shiftTemplates,
    approvedLeaves,
    holidays,
    setWeek,
    setViewMode,
    setFilters,
    assignShift,
    deleteAssignment,
    bulkAssign,
    copyWeek,
    publishSchedule,
    unpublishSchedule,
    fetchWeeklySchedule,
  } = useScheduleStore();

  const { currentRole } = useAuthStore();
  const { settings } = useSettingsStore();
  const { addToast } = useUIStore();
  const { branches } = useDirectoryStore();

  // Auto-fetch weekly schedule from backend / storage
  React.useEffect(() => {
    fetchWeeklySchedule(filterOptions.branchId || 1, currentStartDate);
  }, [filterOptions.branchId, currentStartDate, fetchWeeklySchedule]);

  // Dialog & Drawer Visibility State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedShiftCell, setSelectedShiftCell] = useState<{
    shiftTemplateId: number;
    workDate: string;
  } | null>(null);

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const baseMonday = useMemo(() => parseISO(currentStartDate), [currentStartDate]);
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(parseISO(currentStartDate)));

  // Week Navigation Handlers
  const handlePrevWeek = () => {
    const prevMon = addDays(baseMonday, -7);
    setWeek(format(prevMon, 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    const nextMon = addDays(baseMonday, 7);
    setWeek(format(nextMon, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    const now = new Date();
    // Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currMonday = new Date(now.setDate(diff));
    setWeek(format(currMonday, 'yyyy-MM-dd'));
  };

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    const prevM = addMonths(monthDate, -1);
    setMonthDate(prevM);
    const firstDay = startOfMonth(prevM);
    const day = firstDay.getDay();
    const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(firstDay.getFullYear(), firstDay.getMonth(), diff);
    setWeek(format(mon, 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    const nextM = addMonths(monthDate, 1);
    setMonthDate(nextM);
    const firstDay = startOfMonth(nextM);
    const day = firstDay.getDay();
    const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(firstDay.getFullYear(), firstDay.getMonth(), diff);
    setWeek(format(mon, 'yyyy-MM-dd'));
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setMonthDate(startOfMonth(now));
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currMonday = new Date(now.setDate(diff));
    setWeek(format(currMonday, 'yyyy-MM-dd'));
  };

  const handleSelectDate = (selectedDate: Date) => {
    if (viewMode === 'WEEK') {
      const monday = getCurrentMonday(selectedDate);
      setWeek(format(monday, 'yyyy-MM-dd'));
      setMonthDate(startOfMonth(selectedDate));
    } else {
      const firstDay = startOfMonth(selectedDate);
      setMonthDate(firstDay);
      const monday = getCurrentMonday(firstDay);
      setWeek(format(monday, 'yyyy-MM-dd'));
    }
  };

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    const allAssignmentsList: ShiftAssignment[] = Object.values(assignments).flat();

    return employees.filter((emp) => {
      // 0. Exclude resigned staff completely from scheduling
      if (emp.employmentStatus === 'RESIGNED') {
        return false;
      }

      // 1. Branch filter (if not 0)
      if (filterOptions.branchId && emp.branchId !== filterOptions.branchId) {
        return false;
      }

      // 2. Search term (fullName or employeeCode)
      if (filterOptions.searchTerm) {
        const term = filterOptions.searchTerm.toLowerCase();
        const matchesName = emp.fullName.toLowerCase().includes(term);
        const matchesCode = emp.employeeCode.toLowerCase().includes(term);
        if (!matchesName && !matchesCode) return false;
      }

      // 3. Shift code filter
      if (filterOptions.shiftCodeFilter) {
        const hasMatchingShift = allAssignmentsList.some((a) => {
          if (a.employeeId !== emp.id || a.status === 'CANCELLED') return false;
          const template = shiftTemplates.find((t) => t.id === a.workShiftId);
          return template?.shiftCode === filterOptions.shiftCodeFilter;
        });
        if (!hasMatchingShift) return false;
      }

      // 4. Only show conflicts
      if (filterOptions.onlyShowConflicts) {
        const hasConflict = Object.keys(conflicts).some((key) => {
          return key.startsWith(`${emp.id}_`) && (conflicts[key]?.length || 0) > 0;
        });
        if (!hasConflict) return false;
      }

      return true;
    });
  }, [employees, filterOptions, assignments, conflicts, shiftTemplates]);

  // Summary Metrics Calculation
  const { totalShifts, totalHours, conflictCount, understaffedDaysCount } = useMemo(() => {
    const sundayDate = addDays(baseMonday, 6);
    const sundayStr = format(sundayDate, 'yyyy-MM-dd');

    let shiftsCount = 0;
    let hoursCount = 0;

    const dailyStaffCountMap: Record<string, number> = {};
    const allAssignmentsList: ShiftAssignment[] = Object.values(assignments).flat();

    for (const a of allAssignmentsList) {
      if (a.workDate >= currentStartDate && a.workDate <= sundayStr && a.status !== 'CANCELLED') {
        const emp = employees.find((e) => e.id === a.employeeId);
        if (!emp || emp.employmentStatus === 'RESIGNED' || emp.isActive === false) {
          continue;
        }
        shiftsCount++;
        const { netHours } = calculateShiftDurations(
          a.snapshotStartTime,
          a.snapshotEndTime,
          a.snapshotBreakMinutes,
          a.snapshotCrossMidnight
        );
        hoursCount += netHours;
        dailyStaffCountMap[a.workDate] = (dailyStaffCountMap[a.workDate] || 0) + 1;
      }
    }

    let understaffed = 0;
    for (let i = 0; i < 7; i++) {
      const d = format(addDays(baseMonday, i), 'yyyy-MM-dd');
      if ((dailyStaffCountMap[d] || 0) < 2) {
        understaffed++;
      }
    }

    // Total conflicts in this week
    let conflictsTotal = 0;
    for (const [key, confList] of Object.entries(conflicts)) {
      const [, date] = key.split('_');
      if (date >= currentStartDate && date <= sundayStr) {
        conflictsTotal += confList.length;
      }
    }

    return {
      totalShifts: shiftsCount,
      totalHours: Math.round(hoursCount * 10) / 10,
      conflictCount: conflictsTotal,
      understaffedDaysCount: understaffed,
    };
  }, [assignments, conflicts, currentStartDate, baseMonday, employees]);

  // Shift-Centric Drawer Opening Handlers
  const handleOpenAssignStaff = (shiftTemplateId: number, workDate: string) => {
    setSelectedShiftCell({ shiftTemplateId, workDate });
    setDrawerOpen(true);
  };

  const handleCloseAssignStaff = () => {
    setDrawerOpen(false);
    setSelectedShiftCell(null);
  };

  const activeShiftTemplate = selectedShiftCell
    ? shiftTemplates.find((t) => t.id === selectedShiftCell.shiftTemplateId) || null
    : null;

  const handleAssignEmployee = (payload: {
    employeeId: number;
    workShiftId: number;
    workDate: string;
    overrideRule?: string | null;
    overrideReason?: string | null;
  }) => {
    const res = assignShift({
      employeeId: payload.employeeId,
      workShiftId: payload.workShiftId,
      workDate: payload.workDate,
      overrideRule: payload.overrideRule,
      overrideReason: payload.overrideReason,
      actorRole: currentRole,
    });
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Phân ca thành công',
        message: 'Đã gán nhân viên vào ca làm việc.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Lỗi phân ca',
        message: res.error || 'Không thể phân ca',
      });
    }
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    deleteAssignment(assignmentId, undefined, currentRole);
    addToast({
      type: 'info',
      title: 'Đã gỡ nhân viên',
      message: 'Đã xóa nhân viên khỏi ca làm việc.',
    });
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    const branch = branches.find((b) => b.id === filterOptions.branchId) || null;
    const csvContent = buildWeeklyRosterCsv({
      monday: baseMonday,
      branch: branch,
      employees: filteredEmployees,
      assignments: Object.values(assignments).flat(),
    });

    const branchPrefix = branch?.branchCode ? `${branch.branchCode}_` : '';
    const filename = `Lich_Phan_Ca_${branchPrefix}${format(baseMonday, 'yyyyMMdd')}.csv`;
    downloadCsvFile(csvContent, filename);

    addToast({
      type: 'success',
      title: 'Đã xuất file CSV',
      message: `File ${filename} đã được tải về máy tính thành công.`,
    });
  };

  // Copy Week Handler
  const handleConfirmCopyWeek = (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => {
    const res = copyWeek(mode);
    addToast({
      type: 'success',
      title: 'Sao chép tuần hoàn tất',
      message: `Đã sao chép ${res.copiedCount} ca làm việc (Bỏ qua ${res.skippedCount} ca đã có).`,
    });
    setCopyDialogOpen(false);
  };

  // Publish Schedule Handler
  const handleConfirmPublish = () => {
    publishSchedule();
    addToast({
      type: 'success',
      title: 'Đã công bố lịch làm việc',
      message: 'Lịch phân ca tuần đã chuyển sang trạng thái PUBLISHED chính thức.',
    });
    setPublishDialogOpen(false);
  };

  // Unpublish Schedule Handler (Revert to Draft)
  const handleConfirmUnpublish = () => {
    unpublishSchedule();
    addToast({
      type: 'info',
      title: 'Đã thu hồi công bố',
      message: 'Lịch tuần đã được chuyển về trạng thái Bản nháp để bạn tiếp tục chỉnh sửa.',
    });
    setUnpublishDialogOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 1. Top Action Toolbar */}
      <ScheduleToolbar
        baseMonday={baseMonday}
        monthDate={monthDate}
        branches={branches}
        selectedBranchId={filterOptions.branchId || (branches[0]?.id || 1)}
        scheduleStatus={scheduleStatus}
        viewMode={viewMode}
        currentRole={currentRole}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
        onSelectDate={handleSelectDate}
        onSelectBranch={(branchId) => setFilters({ branchId })}
        onToggleViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'MONTH') {
            setMonthDate(startOfMonth(baseMonday));
          }
        }}
        onOpenPublish={() => setPublishDialogOpen(true)}
        onOpenUnpublish={() => setUnpublishDialogOpen(true)}
        onOpenCopyWeek={() => setCopyDialogOpen(true)}
        onOpenBulkAssign={() => setBulkDialogOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
      />

      {/* 2. Executive Summary Metrics Cards */}
      <ScheduleSummaryCards
        totalShifts={totalShifts}
        totalHours={totalHours}
        conflictCount={conflictCount}
        understaffedDaysCount={understaffedDaysCount}
        onlyShowConflicts={Boolean(filterOptions.onlyShowConflicts)}
        onToggleConflictFilter={() =>
          setFilters({ onlyShowConflicts: !filterOptions.onlyShowConflicts })
        }
      />

      {/* 3. Filter and Search Controls */}
      <ScheduleFiltersBar
        searchTerm={filterOptions.searchTerm || ''}
        shiftCodeFilter={filterOptions.shiftCodeFilter || ''}
        onlyShowConflicts={Boolean(filterOptions.onlyShowConflicts)}
        shiftTemplates={shiftTemplates}
        totalEmployees={employees.filter((e) => e.isActive && e.employmentStatus !== 'RESIGNED').length}
        filteredCount={filteredEmployees.length}
        onSearchChange={(val) => setFilters({ searchTerm: val })}
        onShiftFilterChange={(val) => setFilters({ shiftCodeFilter: val })}
        onToggleConflicts={(val) => setFilters({ onlyShowConflicts: val })}
        onResetFilters={() =>
          setFilters({ searchTerm: '', shiftCodeFilter: '', onlyShowConflicts: false })
        }
      />

      {/* 4. Matrix View (Shift-Centric Week Grid or Month Grid) */}
      <div
        key={`${viewMode}-${viewMode === 'WEEK' ? currentStartDate : format(monthDate, 'yyyy-MM')}`}
        className="schedule-view-animated"
      >
        {viewMode === 'WEEK' ? (
          <WeeklyGrid
            baseMonday={baseMonday}
            shiftTemplates={shiftTemplates}
            employees={filteredEmployees}
            assignmentsMap={assignments}
            conflictsMap={conflicts}
            holidays={holidays}
            canEdit={currentRole !== 'ROLE_EMPLOYEE'}
            onOpenAssignStaff={handleOpenAssignStaff}
            onRemoveAssignment={handleRemoveAssignment}
          />
        ) : (
          <MonthViewGrid
            currentDate={monthDate}
            employees={filteredEmployees}
            assignmentsMap={assignments}
            holidays={holidays}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onCurrentMonth={handleCurrentMonth}
            onSelectDay={(dateStr) => {
              const d = parseISO(dateStr);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              const mon = new Date(d.setDate(diff));
              setWeek(format(mon, 'yyyy-MM-dd'));
              setViewMode('WEEK');
            }}
          />
        )}
      </div>

      {/* 5. Employee Weekly Hours Summary Table (Part-time & Shifts Summary) */}
      <EmployeeWeeklyHoursTable
        employees={filteredEmployees}
        weekDays={getWeekDays(baseMonday)}
        assignmentsMap={assignments}
        searchTerm={filterOptions.searchTerm || ''}
      />

      {/* 6. Drawers & Dialogs */}
      {/* Shift-Centric Assign Staff Drawer */}
      <AssignStaffDrawer
        isOpen={drawerOpen}
        onClose={handleCloseAssignStaff}
        shiftTemplate={activeShiftTemplate}
        workDate={selectedShiftCell?.workDate || ''}
        employees={filteredEmployees}
        allAssignments={Object.values(assignments).flat()}
        approvedLeaves={approvedLeaves}
        holidays={holidays}
        settings={settings}
        canEdit={currentRole !== 'ROLE_EMPLOYEE'}
        onAssignEmployee={handleAssignEmployee}
        onRemoveAssignment={handleRemoveAssignment}
      />

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        isOpen={bulkDialogOpen}
        employees={filteredEmployees}
        shiftTemplates={shiftTemplates}
        currentStartDate={currentStartDate}
        onClose={() => setBulkDialogOpen(false)}
        onSubmit={(payload) => {
          bulkAssign({
            ...payload,
            actorRole: currentRole,
          });
          addToast({
            type: 'success',
            title: 'Gán hàng loạt hoàn tất',
            message: `Đã phân ca cho ${payload.employeeIds.length} nhân viên.`,
          });
        }}
      />

      {/* Copy Week Dialog */}
      <CopyWeekDialog
        isOpen={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        onConfirm={handleConfirmCopyWeek}
      />

      {/* Publish Confirm Dialog */}
      <PublishConfirmDialog
        isOpen={publishDialogOpen}
        conflicts={conflicts}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handleConfirmPublish}
      />

      {/* Unpublish Confirm Dialog */}
      <UnpublishConfirmDialog
        isOpen={unpublishDialogOpen}
        onClose={() => setUnpublishDialogOpen(false)}
        onConfirm={handleConfirmUnpublish}
      />

      {/* Change History Drawer */}
      <ChangeHistoryDrawer
        isOpen={historyDrawerOpen}
        history={changeHistory}
        onClose={() => setHistoryDrawerOpen(false)}
      />
    </div>
  );
};
