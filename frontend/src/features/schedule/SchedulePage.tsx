import React, { useState, useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { formatDateVi } from '@/utils/date.utils';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { MOCK_DEPARTMENTS } from '@/data/mock/departments.mock';
import { ScheduleToolbar } from './components/ScheduleToolbar';
import { ScheduleSummaryCards } from './components/ScheduleSummaryCards';
import { ScheduleFiltersBar } from './components/ScheduleFiltersBar';
import { WeeklyGrid } from './components/WeeklyGrid';
import { MonthViewGrid } from './components/MonthViewGrid';
import { MobileDayView } from './components/MobileDayView';
import { ScheduleLegend } from './components/ScheduleLegend';
import { AssignShiftDrawer } from './dialogs/AssignShiftDrawer';
import { BulkAssignDialog } from './dialogs/BulkAssignDialog';
import { CopyWeekDialog } from './dialogs/CopyWeekDialog';
import { PublishConfirmDialog } from './dialogs/PublishConfirmDialog';
import { ChangeHistoryDrawer } from './dialogs/ChangeHistoryDrawer';
import { buildWeeklyRosterCsv, downloadCsvFile } from '@/utils/csv-exporter.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
    resetDemoData,
  } = useScheduleStore();

  const { currentRole } = useAuthStore();
  const { settings } = useSettingsStore();
  const { addToast } = useUIStore();
  const isMobile = useIsMobile(768);

  // Dialog & Drawer Visibility State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: number; workDate: string } | null>(null);

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const baseMonday = useMemo(() => parseISO(currentStartDate), [currentStartDate]);

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

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Department filter (if not 0)
      if (filterOptions.departmentId && emp.departmentId !== filterOptions.departmentId) {
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
        const hasMatchingShift = Object.values(assignments).some((a) => {
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

    for (const a of Object.values(assignments)) {
      if (a.workDate >= currentStartDate && a.workDate <= sundayStr && a.status !== 'CANCELLED') {
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
      totalHours: hoursCount,
      conflictCount: conflictsTotal,
      understaffedDaysCount: understaffed,
    };
  }, [assignments, conflicts, currentStartDate, baseMonday]);

  // Drawer Opening
  const handleOpenAssign = (employeeId: number, workDate: string) => {
    setSelectedCell({ employeeId, workDate });
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCell(null);
  };

  // Selected cell data for Drawer
  const activeEmployee = selectedCell
    ? employees.find((e) => e.id === selectedCell.employeeId) || null
    : null;

  const activeAssignment = selectedCell
    ? assignments[`${selectedCell.employeeId}_${selectedCell.workDate}`] || null
    : null;

  const activeEmployeeAssignments = activeEmployee
    ? Object.values(assignments).filter((a) => a.employeeId === activeEmployee.id)
    : [];

  const activeEmployeeLeaves = activeEmployee
    ? approvedLeaves.filter((l) => l.employeeId === activeEmployee.id)
    : [];

  // Save Shift Handler
  const handleSaveShift = (payload: {
    workShiftId: number;
    overrideRule?: string | null;
    overrideReason?: string | null;
    changeReason?: string;
  }) => {
    if (!selectedCell) return;

    const res = assignShift({
      employeeId: selectedCell.employeeId,
      workShiftId: payload.workShiftId,
      workDate: selectedCell.workDate,
      overrideRule: payload.overrideRule,
      overrideReason: payload.overrideReason,
      changeReason: payload.changeReason,
      actorRole: currentRole,
    });

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Phân ca thành công',
        message: `Đã lưu ca làm việc ngày ${formatDateVi(selectedCell.workDate)}.`,
      });
      handleCloseDrawer();
    } else {
      addToast({
        type: 'error',
        title: 'Không thể phân ca',
        message: res.error || 'Đã có lỗi xảy ra',
      });
    }
  };

  // Delete Shift Handler
  const handleDeleteShift = (changeReason?: string) => {
    if (!activeAssignment) return;

    deleteAssignment(activeAssignment.id, changeReason, currentRole);
    addToast({
      type: 'info',
      title: 'Đã xóa phân ca',
      message: `Đã hủy phân ca ngày ${formatDateVi(activeAssignment.workDate)}.`,
    });
    handleCloseDrawer();
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === filterOptions.departmentId) || null;
    const csvContent = buildWeeklyRosterCsv({
      monday: baseMonday,
      department: dept,
      employees: filteredEmployees,
      assignments: Object.values(assignments),
    });

    const filename = `Lich_Phan_Ca_${format(baseMonday, 'yyyyMMdd')}.csv`;
    downloadCsvFile(csvContent, filename);

    addToast({
      type: 'success',
      title: 'Đã xuất file CSV',
      message: `File ${filename} đã được tải về máy tính (chuẩn UTF-8 BOM).`,
    });
  };

  // Copy Week Handler
  const handleConfirmCopyWeek = (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => {
    const res = copyWeek(mode);
    addToast({
      type: 'success',
      title: 'Sao chép tuần hoàn tất',
      message: `Đã sao chép ${res.copiedCount} ca, bỏ qua ${res.skippedCount} ca đã có.`,
    });
  };

  // Publish Schedule Handler
  const handleConfirmPublish = () => {
    publishSchedule();
    addToast({
      type: 'success',
      title: 'Công bố lịch thành công',
      message: 'Lịch tuần đã được chuyển sang trạng thái PUBLISHED chính thức.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 1. Schedule Toolbar */}
      <ScheduleToolbar
        baseMonday={baseMonday}
        departments={MOCK_DEPARTMENTS}
        selectedDeptId={filterOptions.departmentId}
        scheduleStatus={scheduleStatus}
        viewMode={viewMode}
        currentRole={currentRole}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onSelectDept={(deptId) => setFilters({ departmentId: deptId })}
        onToggleViewMode={setViewMode}
        onOpenPublish={() => setPublishDialogOpen(true)}
        onOpenCopyWeek={() => setCopyDialogOpen(true)}
        onOpenBulkAssign={() => setBulkDialogOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        onResetDemo={() => {
          resetDemoData();
          addToast({
            type: 'info',
            title: 'Khôi phục dữ liệu demo',
            message: 'Toàn bộ dữ liệu phân ca đã được trả về trạng thái hạt giống ban đầu.',
          });
        }}
      />

      {/* 2. Summary KPI Cards */}
      <ScheduleSummaryCards
        totalShifts={totalShifts}
        totalHours={totalHours}
        conflictCount={conflictCount}
        understaffedDaysCount={understaffedDaysCount}
        onlyShowConflicts={filterOptions.onlyShowConflicts}
        onToggleConflictFilter={() => setFilters({ onlyShowConflicts: !filterOptions.onlyShowConflicts })}
      />

      {/* 3. Filters Bar */}
      <ScheduleFiltersBar
        searchTerm={filterOptions.searchTerm}
        shiftCodeFilter={filterOptions.shiftCodeFilter}
        onlyShowConflicts={filterOptions.onlyShowConflicts}
        shiftTemplates={shiftTemplates}
        totalEmployees={employees.length}
        filteredCount={filteredEmployees.length}
        onSearchChange={(searchTerm) => setFilters({ searchTerm })}
        onShiftFilterChange={(shiftCodeFilter) => setFilters({ shiftCodeFilter })}
        onToggleConflicts={(onlyShowConflicts) => setFilters({ onlyShowConflicts })}
        onResetFilters={() =>
          setFilters({ searchTerm: '', shiftCodeFilter: '', onlyShowConflicts: false })
        }
      />

      {/* 4. Matrix View (Week Grid or Month Grid) */}
      {viewMode === 'WEEK' ? (
        isMobile ? (
          <MobileDayView onOpenAssignDrawer={handleOpenAssign} />
        ) : (
          <WeeklyGrid
            baseMonday={baseMonday}
            employees={filteredEmployees}
            assignmentsMap={assignments}
            conflictsMap={conflicts}
            approvedLeaves={approvedLeaves}
            holidays={holidays}
            canEdit={currentRole !== 'ROLE_EMPLOYEE'}
            onOpenAssign={handleOpenAssign}
          />
        )
      ) : (
        <MonthViewGrid
          currentDate={baseMonday}
          employees={filteredEmployees}
          assignmentsMap={assignments}
          holidays={holidays}
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

      {/* 5. Color Legend & Shortcuts */}
      <ScheduleLegend shiftTemplates={shiftTemplates} />

      {/* 6. Drawers & Dialogs */}
      {/* SCR-12 Assign Shift Drawer */}
      <AssignShiftDrawer
        isOpen={drawerOpen}
        employee={activeEmployee}
        workDate={selectedCell?.workDate || ''}
        existingAssignment={activeAssignment}
        shiftTemplates={shiftTemplates}
        allEmployeeAssignments={activeEmployeeAssignments}
        employeeLeaves={activeEmployeeLeaves}
        holidays={holidays}
        settings={settings}
        isPublishedWeek={scheduleStatus === 'PUBLISHED'}
        currentRole={currentRole}
        onClose={handleCloseDrawer}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
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

      {/* Change History Drawer */}
      <ChangeHistoryDrawer
        isOpen={historyDrawerOpen}
        history={changeHistory}
        onClose={() => setHistoryDrawerOpen(false)}
      />
    </div>
  );
};
