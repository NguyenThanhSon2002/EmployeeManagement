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

const STORAGE_PREFIX = 'EMS_SCHEDULES_BRANCH_';

/**
 * Normalizes raw localStorage or API data into Record<string, ShiftAssignment[]>
 */
function normalizeAssignmentsMap(map: Record<string, any>): Record<string, ShiftAssignment[]> {
  const normalized: Record<string, ShiftAssignment[]> = {};
  for (const [key, val] of Object.entries(map || {})) {
    if (Array.isArray(val)) {
      normalized[key] = val;
    } else if (val && typeof val === 'object') {
      normalized[key] = [val as ShiftAssignment];
    }
  }
  return normalized;
}

function loadBranchScheduleFromStorage(branchId: number): Record<string, ShiftAssignment[]> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${branchId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return normalizeAssignmentsMap(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to load schedule from localStorage:', err);
  }
  return {};
}

function saveBranchScheduleToStorage(
    branchId: number,
    assignments: Record<string, ShiftAssignment[]>
) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${branchId}`, JSON.stringify(assignments));
  } catch (err) {
    console.warn('Failed to save schedule to localStorage:', err);
  }
}

/** Đếm số người (của chi nhánh đang xem) đang giữ từng ô: khóa `${ca}_${ngày}` */
function buildShiftStaffCount(
    assignments: Record<string, ShiftAssignment[]>,
    employees: Employee[]
): Map<string, number> {
  const empIds = new Set(employees.map((e) => e.id));
  const counts = new Map<string, number>();
  for (const list of Object.values(assignments)) {
    for (const a of list) {
      if (a.status === 'CANCELLED' || !empIds.has(a.employeeId)) continue;
      const cellKey = `${a.workShiftId}_${a.workDate}`;
      counts.set(cellKey, (counts.get(cellKey) ?? 0) + 1);
    }
  }
  return counts;
}

export interface AssignShiftPayload {
  assignmentId?: number; // Optional ID for updating an existing shift
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

  assignments: Record<string, ShiftAssignment[]>; // Key: `${employeeId}_${workDate}`
  conflicts: Record<string, ScheduleConflict[]>;
  changeHistory: ChangeHistoryEntry[];

  viewMode: 'WEEK' | 'MONTH';
  filterOptions: ScheduleFilterOptions;

  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];

  // Actions
  fetchWeeklySchedule: (branchId: number, startDate: string) => Promise<void>;
  setWeek: (mondayDateStr: string) => void;
  setViewMode: (mode: 'WEEK' | 'MONTH') => void;
  setFilters: (filters: Partial<ScheduleFilterOptions>) => void;

  assignShift: (payload: AssignShiftPayload) => { success: boolean; error?: string };
  deleteAssignment: (assignmentId: number, changeReason?: string, actorRole?: RoleType) => void;
  applyAutoAssignments: (newAssignments: ShiftAssignment[]) => void;
  copyWeek: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => { copiedCount: number; skippedCount: number };
  publishSchedule: () => void;
  unpublishSchedule: () => void;
  recomputeAllConflicts: () => void;
  resetDemoData: () => void;

  /** Xóa toàn bộ phân ca trong tuần hiện tại đang chọn */
  resetCurrentWeekSchedule: () => Promise<boolean>;

  fetchShiftTemplates: () => Promise<void>;
  addShiftTemplate: (template: Omit<ShiftTemplate, 'id'>) => Promise<ShiftTemplate> | ShiftTemplate;
  updateShiftTemplate: (id: number, data: Partial<ShiftTemplate>) => Promise<void> | void;
  deleteShiftTemplate: (id: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  addApprovedLeave: (leave: LeaveRequest) => void;
  removeApprovedLeave: (leaveId: number) => void;
}

function initializeStateFromSeed(branchId: number = 1) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDays(today, diffToMonday);
  const currentMondayStr = format(monday, 'yyyy-MM-dd');

  // Attempt initial load from localStorage
  const cachedAssignments = loadBranchScheduleFromStorage(branchId);

  return {
    currentStartDate: currentMondayStr,
    scheduleId: 0,
    scheduleStatus: 'DRAFT' as ScheduleStatus,
    scheduleVersion: 1,
    publishedAt: null as string | null,
    assignments: cachedAssignments,
    conflicts: {} as Record<string, ScheduleConflict[]>,
    changeHistory: [] as ChangeHistoryEntry[],
    viewMode: 'WEEK' as const,
    filterOptions: {
      branchId,
      searchTerm: '',
      shiftCodeFilter: '',
      onlyShowConflicts: false,
    },
    employees: useDirectoryStore.getState().employees.filter((e) => e.branchId === branchId),
    shiftTemplates: [] as ShiftTemplate[],
    approvedLeaves: [] as LeaveRequest[],
    holidays: [] as CompanyHoliday[],
  };
}

function computeAllConflicts(
    assignments: Record<string, ShiftAssignment[]>,
    employees: Employee[],
    leaves: LeaveRequest[],
    holidays: CompanyHoliday[]
): Record<string, ScheduleConflict[]> {
  const settings = useSettingsStore.getState().settings;
  const conflictsMap: Record<string, ScheduleConflict[]> = {};

  const allAssignmentsList: ShiftAssignment[] = Object.values(assignments).flat();

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
      const key = `${assignment.employeeId}_${assignment.workDate}`;
      conflictsMap[key] = [...(conflictsMap[key] || []), ...cellConflicts];
    }
  }

  return conflictsMap;
}

export const useScheduleStore = create<ScheduleState>((set, get) => {
  const initial = initializeStateFromSeed(1);
  const initialConflicts = computeAllConflicts(
      initial.assignments,
      initial.employees,
      initial.approvedLeaves,
      initial.holidays
  );

  return {
    ...initial,
    conflicts: initialConflicts,

    fetchWeeklySchedule: async (branchId: number, startDate: string) => {
      // 1. Immediately load cached data from localStorage so there's 0ms blank state
      const localCache = loadBranchScheduleFromStorage(branchId);
      if (Object.keys(localCache).length > 0) {
        set((state) => ({
          assignments: {
            ...localCache,
            ...state.assignments,
          },
        }));
      }

      if (isMockEnabled()) {
        const fallbackEmployees = useDirectoryStore.getState().employees.filter((e) => e.branchId === branchId);
        if (fallbackEmployees.length > 0) {
          set({ employees: fallbackEmployees });
        }
        get().recomputeAllConflicts();
        return;
      }

      try {
        const data = await scheduleService.getWeeklySchedule(branchId, startDate);
        if (!data) return;

        // Merge backend data with existing local assignments
        const currentStored = loadBranchScheduleFromStorage(branchId);
        const mergedAssignments: Record<string, ShiftAssignment[]> = {
          ...currentStored,
          ...get().assignments,
        };

        const backendEmployees: Employee[] = [];

        for (const empSchedule of data.employees || []) {
          const dirEmp = useDirectoryStore.getState().getEmployeeById(empSchedule.employee_id);
          const resolvedStatus = (empSchedule as any).employment_status || (empSchedule as any).employmentStatus || dirEmp?.employmentStatus || 'OFFICIAL';
          const resolvedIsActive = (empSchedule as any).is_active !== undefined
              ? (empSchedule as any).is_active
              : ((empSchedule as any).isActive !== undefined ? (empSchedule as any).isActive : (dirEmp?.isActive !== undefined ? dirEmp.isActive : resolvedStatus !== 'RESIGNED'));

          backendEmployees.push({
            id: empSchedule.employee_id,
            employeeCode: empSchedule.employee_code,
            fullName: empSchedule.full_name,
            email: `${empSchedule.employee_code.toLowerCase()}@example.com`,
            phoneNumber: dirEmp?.phoneNumber || '',
            branchId: data.branch_id || branchId,
            positionId: dirEmp?.positionId || 3,
            managerId: dirEmp?.managerId || null,
            employmentStatus: resolvedStatus,
            employmentType: dirEmp?.employmentType || 'FULL_TIME',
            hireDate: dirEmp?.hireDate || '2026-01-01',
            isActive: resolvedIsActive,
          });

          for (const a of empSchedule.assignments || []) {
            const key = `${a.employee_id}_${a.work_date}`;
            const mappedAssignment: ShiftAssignment = {
              id: a.id,
              scheduleId: a.schedule_id,
              employeeId: a.employee_id,
              workShiftId: a.work_shift_id,
              workDate: a.work_date,
              snapshotShiftName: a.shift_name,
              snapshotStartTime: a.start_time,
              snapshotEndTime: a.end_time,
              snapshotBreakMinutes: a.break_minutes || 0,
              snapshotCrossMidnight: a.is_cross_midnight || false,
              snapshotColorCode: a.color_code,
              plannedStartTime: `${a.work_date}T${a.start_time}`,
              plannedEndTime: `${a.work_date}T${a.end_time}`,
              status: (a.status as any) || 'ASSIGNED',
              overrideRule: a.override_rule ?? null,
              overrideReason: a.override_reason ?? null,
              version: a.version || 1,
            };

            const existingList = mergedAssignments[key] ? [...mergedAssignments[key]] : [];
            const idx = existingList.findIndex((item) => item.id === a.id);
            if (idx >= 0) {
              existingList[idx] = mappedAssignment;
            } else {
              existingList.push(mappedAssignment);
            }
            mergedAssignments[key] = existingList;
          }
        }

        saveBranchScheduleToStorage(branchId, mergedAssignments);

        const templates: ShiftTemplate[] = (data.shift_templates || []).map((t: any) => ({
          id: t.id,
          shiftCode: t.shift_code || t.shiftCode,
          shiftName: t.shift_name || t.shiftName,
          startTime: t.start_time || t.startTime,
          endTime: t.end_time || t.endTime,
          breakMinutes: t.break_minutes || t.breakMinutes || 0,
          isCrossMidnight: t.is_cross_midnight || t.isCrossMidnight || false,
          colorCode: t.color_code || t.colorCode || '#1677FF',
          textColor: t.text_color || t.textColor || '#FFFFFF',
          minStaffing: t.min_staffing || t.minStaffing || 1,
          maxStaffing: t.max_staffing || t.maxStaffing || 10,
          applicableDays: t.applicable_days || t.applicableDays || '1,2,3,4,5,6,7',
          isActive: true,
        }));

        const fallbackEmployees = useDirectoryStore.getState().employees.filter((e) => e.branchId === branchId);

        set({
          scheduleId: data.schedule_id,
          scheduleStatus: (data.status as ScheduleStatus) || 'DRAFT',
          scheduleVersion: data.version !== undefined ? data.version : 0,
          employees: backendEmployees.length > 0 ? backendEmployees : (fallbackEmployees.length > 0 ? fallbackEmployees : get().employees),
          shiftTemplates: templates.length > 0 ? templates : get().shiftTemplates,
          assignments: mergedAssignments,
        });

        get().recomputeAllConflicts();
      } catch (err) {
        console.warn('Could not fetch weekly schedule from API, using fallback:', err);
      }
    },

    setWeek: (mondayDateStr) => {
      set({ currentStartDate: mondayDateStr });
      const branchId = get().filterOptions.branchId || 1;
      const cached = loadBranchScheduleFromStorage(branchId);
      if (Object.keys(cached).length > 0) {
        set((state) => ({
          assignments: {
            ...state.assignments,
            ...cached,
          },
        }));
      }
      get().recomputeAllConflicts();
    },

    setViewMode: (viewMode) => set({ viewMode }),

    setFilters: (newFilters) => {
      set((state) => {
        const updatedFilters = { ...state.filterOptions, ...newFilters };
        let updatedAssignments = state.assignments;
        if (newFilters.branchId && newFilters.branchId !== state.filterOptions.branchId) {
          const branchCache = loadBranchScheduleFromStorage(newFilters.branchId);
          updatedAssignments = { ...updatedAssignments, ...branchCache };
        }
        return {
          filterOptions: updatedFilters,
          assignments: updatedAssignments,
        };
      });
    },

    assignShift: (payload) => {
      const state = get();
      const emp = state.employees.find((e) => Number(e.id) === Number(payload.employeeId));
      const template = state.shiftTemplates.find((t) => Number(t.id) === Number(payload.workShiftId));

      if (!emp || !template) {
        return { success: false, error: 'Nhân viên hoặc Ca làm việc không tồn tại' };
      }

      if (!emp.isActive || emp.employmentStatus === 'RESIGNED') {
        return {
          success: false,
          error: 'Nhân viên đã thôi việc hoặc đang bị vô hiệu hóa, không được phân ca.',
        };
      }

      const key = `${payload.employeeId}_${payload.workDate}`;
      const existingList = state.assignments[key] ? [...state.assignments[key]] : [];

      // Định biên tối đa: không cho thêm người vào ca đã đủ
      const isNewToThisShift = !existingList.some(
          (a) => a.workShiftId === template.id && a.status !== 'CANCELLED'
      );
      if (isNewToThisShift) {
        const staffCount = buildShiftStaffCount(state.assignments, state.employees);
        if ((staffCount.get(`${template.id}_${payload.workDate}`) ?? 0) >= template.maxStaffing) {
          return {
            success: false,
            error: `Ca ${template.shiftName} ngày ${payload.workDate} đã đủ định biên tối đa (${template.maxStaffing} người).`,
          };
        }
      }

      const { startMs, endMs } = getShiftAbsoluteTimeRange(
          payload.workDate,
          template.startTime,
          template.endTime,
          template.isCrossMidnight
      );

      // Determine if updating an existing assignment or adding a new one
      const existingIndex = payload.assignmentId !== undefined
          ? existingList.findIndex((a) => a.id === payload.assignmentId)
          : -1;

      const existingAssignment = existingIndex >= 0 ? existingList[existingIndex] : null;

      const newAssignment: ShiftAssignment = {
        id: existingAssignment ? existingAssignment.id : (Date.now() + Math.floor(Math.random() * 10000)),
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
        version: existingAssignment ? existingAssignment.version + 1 : 1,
      };

      if (existingIndex >= 0) {
        existingList[existingIndex] = newAssignment;
      } else {
        existingList.push(newAssignment);
      }

      const updatedAssignments = {
        ...state.assignments,
        [key]: existingList,
      };

      // Persist to localStorage immediately (offline-first)
      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments);

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
          actionType: existingAssignment ? 'MODIFIED' : 'ADDED',
          oldValue: existingAssignment ? { ...existingAssignment } : null,
          newValue: { ...newAssignment },
          changeReason: payload.changeReason || 'Điều chỉnh phân ca tuần đã công bố',
          changedByRole: payload.actorRole,
          changedAt: new Date().toISOString(),
        };
        updatedHistory = [historyEntry, ...updatedHistory];
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
                  const currentList = prev.assignments[key] || [];
                  const updatedList = currentList.map((item) =>
                      item.id === newAssignment.id ? { ...item, id: saved.id, version: saved.version || item.version } : item
                  );
                  const newAssignmentsMap = {
                    ...prev.assignments,
                    [key]: updatedList,
                  };
                  saveBranchScheduleToStorage(prev.filterOptions.branchId || 1, newAssignmentsMap);
                  return {
                    assignments: newAssignmentsMap,
                    scheduleVersion: (prev.scheduleVersion || 1) + 1,
                  };
                });
              }
            })
            .catch((err) => {
              console.warn('Failed to persist shift assignment to backend:', err);
            });
      }

      return { success: true };
    },

    deleteAssignment: (assignmentId, changeReason, actorRole = 'ROLE_DIRECTOR') => {
      const state = get();
      let targetKey: string | null = null;
      let targetAssignment: ShiftAssignment | null = null;

      for (const [key, list] of Object.entries(state.assignments)) {
        const found = list.find((a) => a.id === assignmentId);
        if (found) {
          targetKey = key;
          targetAssignment = found;
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
      const filteredList = (updatedAssignments[targetKey] || []).filter((a) => a.id !== assignmentId);
      if (filteredList.length > 0) {
        updatedAssignments[targetKey] = filteredList;
      } else {
        delete updatedAssignments[targetKey];
      }

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments);

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
    },

    applyAutoAssignments: (newAssignments) => {
      if (newAssignments.length === 0) return;
      const state = get();
      const updated = { ...state.assignments };

      for (const a of newAssignments) {
        const key = `${a.employeeId}_${a.workDate}`;
        const list = updated[key] ? [...updated[key]] : [];

        // Không ghi đè: bỏ qua nếu nhân viên đã có đúng ca này trong ngày
        const alreadyHasShift = list.some(
            (x) => x.workShiftId === a.workShiftId && x.status !== 'CANCELLED'
        );
        if (alreadyHasShift) continue;

        list.push(a);
        updated[key] = list;
      }

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updated);

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
      const currentMon = parseISO(state.currentStartDate);
      const prevMon = addDays(currentMon, -7);
      const prevSun = addDays(currentMon, -1);
      const prevMonStr = format(prevMon, 'yyyy-MM-dd');
      const prevSunStr = format(prevSun, 'yyyy-MM-dd');

      const currentSun = addDays(currentMon, 6);
      const currentSunStr = format(currentSun, 'yyyy-MM-dd');

      const allList: ShiftAssignment[] = Object.values(state.assignments).flat();

      const sourceAssignments = allList.filter(
          (a) => a.workDate >= prevMonStr && a.workDate <= prevSunStr
      );
      const targetAssignments = allList.filter(
          (a) => a.workDate >= state.currentStartDate && a.workDate <= currentSunStr
      );

      const targetLeaves = state.approvedLeaves.filter(
          (l) => l.startDate <= currentSunStr && l.endDate >= state.currentStartDate
      );

      const result = copyScheduleWeek({
        sourceAssignments,
        targetAssignments,
        targetLeaves,
        daysOffset: 7,
        mode,
        newScheduleId: state.scheduleId,
      });

      const updatedAssignments = { ...state.assignments };

      // Remove current week assignments
      for (const [key, list] of Object.entries(updatedAssignments)) {
        const remaining = list.filter((a) => a.workDate < state.currentStartDate || a.workDate > currentSunStr);
        if (remaining.length > 0) {
          updatedAssignments[key] = remaining;
        } else {
          delete updatedAssignments[key];
        }
      }

      // Add merged assignments
      for (const a of result.mergedAssignments) {
        const key = `${a.employeeId}_${a.workDate}`;
        if (!updatedAssignments[key]) {
          updatedAssignments[key] = [];
        }
        updatedAssignments[key].push(a);
      }

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments);

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
        copiedCount: result.copiedCount,
        skippedCount: result.skippedCount,
      };
    },

    publishSchedule: () => {
      const state = get();
      if (!isMockEnabled()) {
        scheduleService.publishSchedule(state.scheduleId, state.scheduleVersion).catch((err) => {
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

    resetCurrentWeekSchedule: async () => {
      const state = get();
      const branchId = state.filterOptions.branchId || 1;
      const currentMon = parseISO(state.currentStartDate);
      const currentSun = addDays(currentMon, 6);
      const currentMonStr = state.currentStartDate;
      const currentSunStr = format(currentSun, 'yyyy-MM-dd');

      // 1. Lọc bỏ toàn bộ phân ca trong khoảng thời gian tuần hiện tại
      const updatedAssignments = { ...state.assignments };
      for (const [key, list] of Object.entries(updatedAssignments)) {
        const remaining = list.filter(
            (a) => a.workDate < currentMonStr || a.workDate > currentSunStr
        );
        if (remaining.length > 0) {
          updatedAssignments[key] = remaining;
        } else {
          delete updatedAssignments[key];
        }
      }

      // 2. Lưu lại vào cache trình duyệt
      saveBranchScheduleToStorage(branchId, updatedAssignments);

      // 3. Tính toán lại xung đột (conflicts sẽ trở về rỗng cho tuần này)
      const updatedConflicts = computeAllConflicts(
          updatedAssignments,
          state.employees,
          state.approvedLeaves,
          state.holidays
      );

      // 4. Đồng bộ State
      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
      });

      // 5. Nếu kết nối Backend thực, gọi API dọn dẹp các phân ca trên server
      if (!isMockEnabled() && state.scheduleId) {
        try {
          await scheduleService.deleteAssignment(state.scheduleId, state.scheduleVersion);
        } catch (err) {
          console.warn('Lỗi khi xóa phân ca tuần trên máy chủ:', err);
        }
      }

      return true;
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
      const branchId = get().filterOptions.branchId || 1;
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${branchId}`);
      } catch {
        // Ignore
      }
      const initialReset = initializeStateFromSeed(branchId);
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
      const allShifts: ShiftAssignment[] = Object.values(state.assignments).flat();
      const isUsed = allShifts.some((a) => a.workShiftId === id && a.status === 'ASSIGNED');
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