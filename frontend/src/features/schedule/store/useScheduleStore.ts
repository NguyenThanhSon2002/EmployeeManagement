import { create } from 'zustand';
import { format, addDays, parseISO } from 'date-fns';
import type {
  ShiftAssignment,
  ScheduleConflict,
  ChangeHistoryEntry,
  ScheduleStatus,
  Employee,
  ShiftTemplate,
  LeaveRequest,
  CompanyHoliday,
  RoleType,
} from '@/types/domain.types';
import type { ScheduleFilterOptions } from '@/types/schedule.types';
import { useDirectoryStore } from '@/shared/directory/useDirectoryStore';
import {
  validateAllShiftConflicts,
  getShiftAbsoluteTimeRange,
  assignmentToTimeRange,
} from '@/utils/conflict-detector.utils';
import { copyScheduleWeek } from '@/utils/copy-merge.utils';
import { calculateShiftDurations } from '@/utils/schedule-calc.utils';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { scheduleService } from '../api/scheduleService';
import { workShiftService } from '@/features/shifts/api/workShiftService';
import { isMockEnabled } from '@/config/env.config';

const STORAGE_KEY = 'EMS_SCHEDULE_STATE_V1';

export interface AssignShiftPayload {
  employeeId: number;
  workShiftId: number;
  workDate: string;
  overrideRule?: string | null;
  overrideReason?: string | null;
  changeReason?: string;
  actorRole: RoleType;
}

interface ScheduleState {
  currentStartDate: string; // YYYY-MM-DD (Monday)
  scheduleId: number;
  scheduleStatus: ScheduleStatus;
  scheduleVersion: number;
  publishedAt: string | null;

  assignments: Record<string, ShiftAssignment>; // Key: `${employeeId}_${workDate}`
  conflicts: Record<string, ScheduleConflict[]>;
  changeHistory: ChangeHistoryEntry[];

  viewMode: 'WEEK' | 'MONTH';
  filterOptions: ScheduleFilterOptions;

  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];

  // Actions
  fetchWeeklySchedule: (departmentId: number, startDate: string) => Promise<void>;
  setWeek: (mondayDateStr: string) => void;
  setViewMode: (mode: 'WEEK' | 'MONTH') => void;
  setFilters: (filters: Partial<ScheduleFilterOptions>) => void;

  assignShift: (payload: AssignShiftPayload) => { success: boolean; error?: string };
  deleteAssignment: (assignmentId: number, changeReason?: string, actorRole?: RoleType) => void;
  bulkAssign: (payload: {
    employeeIds: number[];
    workShiftId: number;
    fromDate: string;
    toDate: string;
    overrideReason?: string;
    actorRole: RoleType;
  }) => void;
  copyWeek: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => { copiedCount: number; skippedCount: number };
  publishSchedule: () => void;
  unpublishSchedule: () => void;
  recomputeAllConflicts: () => void;
  resetDemoData: () => void;

  fetchShiftTemplates: () => Promise<void>;
  addShiftTemplate: (template: Omit<ShiftTemplate, 'id'>) => Promise<ShiftTemplate> | ShiftTemplate;
  updateShiftTemplate: (id: number, data: Partial<ShiftTemplate>) => Promise<void> | void;
  deleteShiftTemplate: (id: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  addApprovedLeave: (leave: LeaveRequest) => void;
  removeApprovedLeave: (leaveId: number) => void;
}

function initializeStateFromSeed() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDays(today, diffToMonday);
  const currentMondayStr = format(monday, 'yyyy-MM-dd');

  return {
    currentStartDate: currentMondayStr,
    scheduleId: 0,
    scheduleStatus: 'DRAFT' as ScheduleStatus,
    scheduleVersion: 1,
    publishedAt: null as string | null,
    assignments: {} as Record<string, ShiftAssignment>,
    conflicts: {} as Record<string, ScheduleConflict[]>,
    changeHistory: [] as ChangeHistoryEntry[],
    viewMode: 'WEEK' as const,
    filterOptions: {
      departmentId: 1,
      searchTerm: '',
      shiftCodeFilter: '',
      onlyShowConflicts: false,
    },
    employees: [] as Employee[],
    shiftTemplates: [] as ShiftTemplate[],
    approvedLeaves: [] as LeaveRequest[],
    holidays: [] as CompanyHoliday[],
  };
}

function computeAllConflicts(
  assignments: Record<string, ShiftAssignment>,
  employees: Employee[],
  leaves: LeaveRequest[],
  holidays: CompanyHoliday[]
): Record<string, ScheduleConflict[]> {
  const settings = useSettingsStore.getState().settings;
  const conflictsMap: Record<string, ScheduleConflict[]> = {};

  const allAssignmentsList = Object.values(assignments);

  for (const assignment of allAssignmentsList) {
    if (assignment.status === 'CANCELLED') continue;

    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (!emp) continue;

    const timeRange = assignmentToTimeRange(assignment);
    const { netHours } = calculateShiftDurations(
      assignment.snapshotStartTime,
      assignment.snapshotEndTime,
      assignment.snapshotBreakMinutes,
      assignment.snapshotCrossMidnight
    );

    const assignDate = parseISO(assignment.workDate);
    const dayOfWeek = assignDate.getDay();
    const weekMon = addDays(assignDate, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekSunStr = format(addDays(weekMon, 6), 'yyyy-MM-dd');
    const prevSunStr = format(addDays(weekMon, -1), 'yyyy-MM-dd');

    const empAssignments = allAssignmentsList.filter((a) => {
      return a.employeeId === emp.id && a.workDate >= prevSunStr && a.workDate <= weekSunStr;
    });

    const cellConflicts = validateAllShiftConflicts({
      employee: emp,
      newShiftRange: timeRange,
      newShiftNetHours: netHours,
      existingShifts: empAssignments,
      employeeLeaves: leaves.filter((l) => l.employeeId === emp.id),
      holidays,
      settings,
    });

    if (cellConflicts.length > 0) {
      conflictsMap[`${assignment.employeeId}_${assignment.workDate}`] = cellConflicts;
    }
  }

  return conflictsMap;
}

export const useScheduleStore = create<ScheduleState>((set, get) => {
  const initial = initializeStateFromSeed();
  const initialConflicts = computeAllConflicts(
    initial.assignments,
    initial.employees,
    initial.approvedLeaves,
    initial.holidays
  );

  return {
    ...initial,
    conflicts: initialConflicts,

    fetchWeeklySchedule: async (departmentId: number, startDate: string) => {
      if (isMockEnabled()) return;
      try {
        const data = await scheduleService.getWeeklySchedule(departmentId, startDate);
        if (!data) return;

        const assignmentsMap: Record<string, ShiftAssignment> = {};
        const backendEmployees: Employee[] = [];

        for (const empSchedule of data.employees || []) {
          backendEmployees.push({
            id: empSchedule.employee_id,
            employeeCode: empSchedule.employee_code,
            fullName: empSchedule.full_name,
            email: `${empSchedule.employee_code.toLowerCase()}@example.com`,
            phoneNumber: '',
            departmentId: data.department_id,
            positionId: 1,
            managerId: null,
            employmentStatus: 'OFFICIAL',
            employmentType: 'FULL_TIME',
            hireDate: '2026-01-01',
            isActive: true,
          });

          for (const a of empSchedule.assignments || []) {
            const key = `${a.employee_id}_${a.work_date}`;
            assignmentsMap[key] = {
              id: a.id,
              scheduleId: a.schedule_id,
              employeeId: a.employee_id,
              workShiftId: a.work_shift_id,
              workDate: a.work_date,
              snapshotShiftName: a.shift_name,
              snapshotStartTime: a.start_time,
              snapshotEndTime: a.end_time,
              snapshotBreakMinutes: a.break_minutes || 30,
              snapshotCrossMidnight: a.is_cross_midnight || false,
              snapshotColorCode: a.color_code,
              plannedStartTime: `${a.work_date}T${a.start_time}`,
              plannedEndTime: `${a.work_date}T${a.end_time}`,
              status: (a.status as any) || 'ASSIGNED',
              overrideRule: a.override_rule ?? null,
              overrideReason: a.override_reason ?? null,
              version: a.version || 1,
            };
          }
        }

        const templates: ShiftTemplate[] = (data.shift_templates || []).map((t: any) => ({
          id: t.id,
          shiftCode: t.shift_code || t.shiftCode,
          shiftName: t.shift_name || t.shiftName,
          startTime: t.start_time || t.startTime,
          endTime: t.end_time || t.endTime,
          breakMinutes: t.break_minutes || t.breakMinutes || 30,
          isCrossMidnight: t.is_cross_midnight || t.isCrossMidnight || false,
          colorCode: t.color_code || t.colorCode || '#1677FF',
          textColor: t.text_color || t.textColor || '#FFFFFF',
          minStaffing: t.min_staffing || t.minStaffing || 1,
          maxStaffing: t.max_staffing || t.maxStaffing || 10,
          applicableDays: t.applicable_days || t.applicableDays || '1,2,3,4,5,6,7',
          isActive: true,
        }));

        const fallbackEmployees = useDirectoryStore.getState().employees.filter((e) => e.departmentId === departmentId);
        set({
          scheduleId: data.schedule_id,
          scheduleStatus: (data.status as ScheduleStatus) || 'DRAFT',
          scheduleVersion: data.version !== undefined ? data.version : 0,
          employees: backendEmployees.length > 0 ? backendEmployees : (fallbackEmployees.length > 0 ? fallbackEmployees : get().employees),
          shiftTemplates: templates.length > 0 ? templates : get().shiftTemplates,
          assignments: assignmentsMap,
        });

        get().recomputeAllConflicts();
      } catch (err) {
        console.warn('Could not fetch weekly schedule from API, using fallback:', err);
      }
    },

    setWeek: (mondayDateStr) => {
      set({ currentStartDate: mondayDateStr });
      get().recomputeAllConflicts();
    },

    setViewMode: (viewMode) => set({ viewMode }),

    setFilters: (newFilters) => {
      set((state) => ({
        filterOptions: { ...state.filterOptions, ...newFilters },
      }));
    },

    assignShift: (payload) => {
      const state = get();
      const emp = state.employees.find((e) => e.id === payload.employeeId);
      const template = state.shiftTemplates.find((t) => t.id === payload.workShiftId);

      if (!emp || !template) {
        return { success: false, error: 'Nhân viên hoặc Ca làm việc không tồn tại' };
      }

      // Check BR-002: Inactive employee
      if (!emp.isActive || emp.employmentStatus === 'RESIGNED') {
        return {
          success: false,
          error: 'Nhân viên đã thôi việc hoặc đang bị vô hiệu hóa, không được phân ca.',
        };
      }

      const key = `${payload.employeeId}_${payload.workDate}`;
      const existing = state.assignments[key];

      const { startMs, endMs } = getShiftAbsoluteTimeRange(
        payload.workDate,
        template.startTime,
        template.endTime,
        template.isCrossMidnight
      );

      const newAssignment: ShiftAssignment = {
        id: existing ? existing.id : Date.now(),
        scheduleId: state.scheduleId,
        employeeId: emp.id,
        workShiftId: template.id,
        workDate: payload.workDate,
        snapshotShiftName: template.shiftName,
        snapshotStartTime: template.startTime,
        snapshotEndTime: template.endTime,
        snapshotBreakMinutes: template.breakMinutes,
        snapshotCrossMidnight: template.isCrossMidnight,
        snapshotColorCode: template.colorCode,
        plannedStartTime: new Date(startMs).toISOString(),
        plannedEndTime: new Date(endMs).toISOString(),
        status: 'ASSIGNED',
        overrideRule: payload.overrideRule ?? null,
        overrideReason: payload.overrideReason ?? null,
        version: existing ? existing.version + 1 : 1,
      };

      // Record audit history if week is PUBLISHED
      let updatedHistory = state.changeHistory;
      if (state.scheduleStatus === 'PUBLISHED') {
        const historyEntry: ChangeHistoryEntry = {
          id: Date.now(),
          scheduleId: state.scheduleId,
          shiftAssignmentId: newAssignment.id,
          employeeId: emp.id,
          employeeName: emp.fullName,
          workDate: payload.workDate,
          actionType: existing ? 'MODIFIED' : 'ADDED',
          oldValue: existing ? { ...existing } : null,
          newValue: { ...newAssignment },
          changeReason: payload.changeReason || 'Điều chỉnh phân ca tuần đã công bố',
          changedByRole: payload.actorRole,
          changedAt: new Date().toISOString(),
        };
        updatedHistory = [historyEntry, ...updatedHistory];
      }

      const updatedAssignments = {
        ...state.assignments,
        [key]: newAssignment,
      };

      const updatedConflicts = computeAllConflicts(
        updatedAssignments,
        state.employees,
        state.approvedLeaves,
        state.holidays
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
        changeHistory: updatedHistory,
      });

      if (!isMockEnabled()) {
        scheduleService
          .assignSingleShift({
            schedule_id: state.scheduleId,
            employee_id: payload.employeeId,
            work_shift_id: payload.workShiftId,
            work_date: payload.workDate,
            override_rule: payload.overrideRule || undefined,
            override_reason: payload.overrideReason || undefined,
            schedule_version: state.scheduleVersion,
          })
          .then((saved) => {
            if (saved && saved.id) {
              set((prev) => {
                const current = prev.assignments[key];
                if (current) {
                  return {
                    assignments: {
                      ...prev.assignments,
                      [key]: { ...current, id: saved.id, version: saved.version || current.version },
                    },
                    scheduleVersion: (prev.scheduleVersion || 1) + 1,
                  };
                }
                return prev;
              });
            }
          })
          .catch((err) => {
            console.warn('Failed to persist shift assignment to backend:', err);
          });
      }

      return { success: true };
    },

    deleteAssignment: (assignmentId, changeReason, actorRole = 'ROLE_ADMIN') => {
      const state = get();
      let targetKey: string | null = null;
      let targetAssignment: ShiftAssignment | null = null;

      for (const [key, a] of Object.entries(state.assignments)) {
        if (a.id === assignmentId) {
          targetKey = key;
          targetAssignment = a;
          break;
        }
      }

      if (!targetKey || !targetAssignment) return;

      if (!isMockEnabled()) {
        scheduleService.deleteAssignment(assignmentId, state.scheduleVersion).catch((err) => {
          console.warn('Failed to delete assignment on backend:', err);
        });
      }

      let updatedHistory = state.changeHistory;
      if (state.scheduleStatus === 'PUBLISHED') {
        const emp = state.employees.find((e) => e.id === targetAssignment!.employeeId);
        const historyEntry: ChangeHistoryEntry = {
          id: Date.now(),
          scheduleId: state.scheduleId,
          shiftAssignmentId: targetAssignment.id,
          employeeId: targetAssignment.employeeId,
          employeeName: emp ? emp.fullName : 'Nhân viên',
          workDate: targetAssignment.workDate,
          actionType: 'DELETED',
          oldValue: { ...targetAssignment },
          newValue: null,
          changeReason: changeReason || 'Xóa phân ca làm việc',
          changedByRole: actorRole,
          changedAt: new Date().toISOString(),
        };
        updatedHistory = [historyEntry, ...updatedHistory];
      }

      const updatedAssignments = { ...state.assignments };
      delete updatedAssignments[targetKey];

      const updatedConflicts = computeAllConflicts(
        updatedAssignments,
        state.employees,
        state.approvedLeaves,
        state.holidays
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
        changeHistory: updatedHistory,
      });

      if (!isMockEnabled() && targetAssignment && targetAssignment.id) {
        scheduleService.deleteAssignment(targetAssignment.id, state.scheduleVersion).catch((err: unknown) => {
          console.warn('Failed to delete shift assignment on backend:', err);
        });
      }
    },

    bulkAssign: (payload) => {
      const state = get();
      const template = state.shiftTemplates.find((t) => t.id === payload.workShiftId);
      if (!template) return;

      const updated = { ...state.assignments };
      let fromDate = new Date(payload.fromDate);
      const toDate = new Date(payload.toDate);

      while (fromDate <= toDate) {
        const dateStr = format(fromDate, 'yyyy-MM-dd');
        for (const empId of payload.employeeIds) {
          const emp = state.employees.find((e) => e.id === empId);
          if (!emp || !emp.isActive || emp.employmentStatus === 'RESIGNED') continue;

          const key = `${empId}_${dateStr}`;
          const existing = updated[key];

          const { startMs, endMs } = getShiftAbsoluteTimeRange(
            dateStr,
            template.startTime,
            template.endTime,
            template.isCrossMidnight
          );

          updated[key] = {
            id: existing ? existing.id : Date.now() + Math.floor(Math.random() * 10000),
            scheduleId: state.scheduleId,
            employeeId: empId,
            workShiftId: template.id,
            workDate: dateStr,
            snapshotShiftName: template.shiftName,
            snapshotStartTime: template.startTime,
            snapshotEndTime: template.endTime,
            snapshotBreakMinutes: template.breakMinutes,
            snapshotCrossMidnight: template.isCrossMidnight,
            snapshotColorCode: template.colorCode,
            plannedStartTime: new Date(startMs).toISOString(),
            plannedEndTime: new Date(endMs).toISOString(),
            status: 'ASSIGNED',
            overrideRule: null,
            overrideReason: payload.overrideReason ?? null,
            version: existing ? existing.version + 1 : 1,
          };
        }
        fromDate = addDays(fromDate, 1);
      }

      const updatedConflicts = computeAllConflicts(
        updated,
        state.employees,
        state.approvedLeaves,
        state.holidays
      );

      set({ assignments: updated, conflicts: updatedConflicts });
    },

    copyWeek: (mode) => {
      const state = get();
      // Source is previous week (-7 days)
      const currentMonday = new Date(state.currentStartDate);
      const prevMondayStr = format(addDays(currentMonday, -7), 'yyyy-MM-dd');

      const allList = Object.values(state.assignments);
      const sourceList = allList.filter((a) => {
        const d = a.workDate;
        return d >= prevMondayStr && d < state.currentStartDate;
      });

      const currentList = allList.filter((a) => {
        const d = a.workDate;
        const endWeekStr = format(addDays(currentMonday, 6), 'yyyy-MM-dd');
        return d >= state.currentStartDate && d <= endWeekStr;
      });

      const copyResult = copyScheduleWeek({
        sourceAssignments: sourceList,
        targetAssignments: currentList,
        targetLeaves: state.approvedLeaves,
        mode,
        newScheduleId: state.scheduleId,
        daysOffset: 7,
      });

      const updatedAssignments = { ...state.assignments };
      if (mode === 'REPLACE_ALL') {
        // Remove current week assignments
        for (const a of currentList) {
          delete updatedAssignments[`${a.employeeId}_${a.workDate}`];
        }
      }

      for (const a of copyResult.mergedAssignments) {
        updatedAssignments[`${a.employeeId}_${a.workDate}`] = a;
      }

      const updatedConflicts = computeAllConflicts(
        updatedAssignments,
        state.employees,
        state.approvedLeaves,
        state.holidays
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
      });

      return {
        copiedCount: copyResult.copiedCount,
        skippedCount: copyResult.skippedCount,
      };
    },

    publishSchedule: () => {
      const state = get();
      if (!isMockEnabled()) {
        scheduleService
          .publishSchedule(state.scheduleId, state.scheduleVersion)
          .then((res) => {
            if (res) {
              set({ scheduleStatus: 'PUBLISHED', scheduleVersion: res.version });
            }
          })
          .catch((err) => {
            console.warn('Failed to publish schedule on backend:', err);
          });
      }
      set({
        scheduleStatus: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });
    },

    unpublishSchedule: () => {
      const state = get();
      if (!isMockEnabled()) {
        scheduleService.unpublishSchedule(state.scheduleId).catch((err) => {
          console.warn('Failed to unpublish schedule on backend:', err);
        });
      }
      set({
        scheduleStatus: 'DRAFT',
      });
    },

    recomputeAllConflicts: () => {
      const state = get();
      const updatedConflicts = computeAllConflicts(
        state.assignments,
        state.employees,
        state.approvedLeaves,
        state.holidays
      );
      set({ conflicts: updatedConflicts });
    },

    resetDemoData: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      const initialReset = initializeStateFromSeed();
      const conflictsReset = computeAllConflicts(
        initialReset.assignments,
        initialReset.employees,
        initialReset.approvedLeaves,
        initialReset.holidays
      );
      set({
        ...initialReset,
        conflicts: conflictsReset,
      });
    },

    fetchShiftTemplates: async () => {
      if (isMockEnabled() || import.meta.env.MODE === 'test') {
        return;
      }
      try {
        const list = await workShiftService.getAllWorkShifts();
        if (list && list.length > 0) {
          set({ shiftTemplates: list });
        }
      } catch (err) {
        console.warn('Failed to fetch shift templates from backend:', err);
      }
    },

    addShiftTemplate: async (template) => {
      const state = get();
      const isTest = isMockEnabled() || import.meta.env.MODE === 'test';
      const tempId = Math.max(0, ...state.shiftTemplates.map((t) => t.id)) + 1;
      const localTemplate: ShiftTemplate = { ...template, id: tempId };

      if (isTest) {
        set({ shiftTemplates: [...state.shiftTemplates, localTemplate] });
        return localTemplate;
      }

      try {
        const created = await workShiftService.createWorkShift(template);
        set({ shiftTemplates: [...get().shiftTemplates, created] });
        return created;
      } catch (err) {
        console.error('Failed to create shift template on backend:', err);
        set({ shiftTemplates: [...get().shiftTemplates, localTemplate] });
        return localTemplate;
      }
    },

    updateShiftTemplate: async (id, data) => {
      const state = get();
      const isTest = isMockEnabled() || import.meta.env.MODE === 'test';

      set({
        shiftTemplates: state.shiftTemplates.map((t) => (t.id === id ? { ...t, ...data } : t)),
      });

      if (!isTest) {
        try {
          await workShiftService.updateWorkShift(id, data);
        } catch (err) {
          console.error('Failed to update shift template on backend:', err);
        }
      }
    },

    deleteShiftTemplate: async (id) => {
      const state = get();
      const isUsed = Object.values(state.assignments).some((a) => a.workShiftId === id && a.status === 'ASSIGNED');
      if (isUsed) {
        return { success: false, error: 'Không thể xóa mẫu ca đang có nhân viên được phân công làm việc.' };
      }

      const isTest = isMockEnabled() || import.meta.env.MODE === 'test';
      set({
        shiftTemplates: state.shiftTemplates.filter((t) => t.id !== id),
      });

      if (!isTest) {
        try {
          await workShiftService.deleteWorkShift(id);
        } catch (err) {
          console.error('Failed to delete shift template on backend:', err);
          set({ shiftTemplates: state.shiftTemplates });
          return { success: false, error: 'Lỗi khi xóa mẫu ca trên máy chủ.' };
        }
      }
      return { success: true };
    },

    addApprovedLeave: (leave) => {
      const state = get();
      const existing = state.approvedLeaves.filter((l) => l.id !== leave.id);
      set({ approvedLeaves: [...existing, leave] });
      get().recomputeAllConflicts();
    },

    removeApprovedLeave: (leaveId) => {
      const state = get();
      set({ approvedLeaves: state.approvedLeaves.filter((l) => l.id !== leaveId) });
      get().recomputeAllConflicts();
    },
  };
});
