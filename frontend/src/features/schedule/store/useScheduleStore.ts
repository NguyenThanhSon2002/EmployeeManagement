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

function loadBranchScheduleFromStorage(branchId: number, startDate?: string): Record<string, ShiftAssignment[]> {
  try {
    const key = startDate ? `${STORAGE_PREFIX}${branchId}_${startDate}` : `${STORAGE_PREFIX}${branchId}`;
    let raw = localStorage.getItem(key);
    if (!raw && startDate) {
      // Fallback to legacy/general branch cache if week-specific key doesn't exist yet
      raw = localStorage.getItem(`${STORAGE_PREFIX}${branchId}`);
    }
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
    assignments: Record<string, ShiftAssignment[]>,
    startDate?: string
) {
  try {
    const key = startDate ? `${STORAGE_PREFIX}${branchId}_${startDate}` : `${STORAGE_PREFIX}${branchId}`;
    localStorage.setItem(key, JSON.stringify(assignments));
  } catch (err) {
    console.warn('Failed to save schedule to localStorage:', err);
  }
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
  isFetchingSchedule: boolean;

  // Actions
  fetchWeeklySchedule: (branchId: number, startDate: string) => Promise<void>;
  setWeek: (mondayDateStr: string) => void;
  setViewMode: (mode: 'WEEK' | 'MONTH') => void;
  setFilters: (filters: Partial<ScheduleFilterOptions>) => void;

  assignShift: (payload: AssignShiftPayload) => { success: boolean; error?: string };
  deleteAssignment: (assignmentId: number, changeReason?: string, actorRole?: RoleType) => void;
  applyAutoAssignments: (
    newAssignments: ShiftAssignment[],
    mode?: 'REPLACE_ALL' | 'FILL_MISSING',
    fromDate?: string,
    toDate?: string
  ) => void;
  copyWeek: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => Promise<{ copiedCount: number; skippedCount: number }>;
  publishSchedule: () => void;
  unpublishSchedule: () => void;
  recomputeAllConflicts: () => void;
  resetDemoData: () => void;

  /** Xóa toàn bộ phân ca trong tuần hiện tại đang chọn */
  resetCurrentWeekSchedule: () => Promise<boolean>;

  /** Cập nhật giải trình đặc cách cho ca phân công (hỗ trợ null để xóa giải trình) */
  updateAssignmentOverride: (assignmentId: number, overrideReason: string | null, overrideRule?: string) => Promise<boolean>;

  fetchShiftTemplates: (branchId?: number) => Promise<void>;
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
  const cachedAssignments = loadBranchScheduleFromStorage(branchId, currentMondayStr);

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
    isFetchingSchedule: false,
  };
}

function computeAllConflicts(
    assignments: Record<string, ShiftAssignment[]>,
    employees: Employee[],
    leaves: LeaveRequest[],
    holidays: CompanyHoliday[],
    shiftTemplates: ShiftTemplate[] = []
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
      targetBranchId: assignment.branchId,
      targetBranchName: assignment.branchName,
    });

    if (cellConflicts.length > 0) {
      const conflictsWithContext = cellConflicts.map((c) => ({
        ...c,
        workShiftId: Number(assignment.workShiftId),
        assignmentId: assignment.id,
      }));
      const key = `${assignment.employeeId}_${assignment.workDate}`;
      conflictsMap[key] = [...(conflictsMap[key] || []), ...conflictsWithContext];
    }
  }

  // Bổ sung kiểm tra định biên tối đa cho từng ô ca:
  const templates = shiftTemplates || [];

  if (templates.length > 0) {
    const templateMap = new Map<number | string, ShiftTemplate>();
    for (const t of templates) {
      templateMap.set(t.id, t);
      templateMap.set(Number(t.id), t);
      templateMap.set(String(t.id), t);
    }
    const cellGroups = new Map<string, ShiftAssignment[]>();

    for (const a of allAssignmentsList) {
      if (a.status === 'CANCELLED') continue;
      const cKey = `${a.workShiftId}_${a.workDate}`;
      const list = cellGroups.get(cKey) || [];
      list.push(a);
      cellGroups.set(cKey, list);
    }

    for (const [cKey, list] of cellGroups.entries()) {
      const [shiftIdStr, dateStr] = cKey.split('_');
      const tmpl = templateMap.get(Number(shiftIdStr)) || templateMap.get(shiftIdStr);
      const maxCap = tmpl?.maxStaffing || tmpl?.minStaffing || 1;

      if (tmpl && list.length > maxCap) {
        // Sắp xếp theo ID tăng dần (ID nhỏ hơn = tạo trước = ca gốc hợp lệ; ID lớn hơn = tạo sau = ca bổ sung)
        list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

        // Gán cảnh báo cho các nhân sự từ vị trí vượt định biên
        for (let i = maxCap; i < list.length; i++) {
          const extraAssignment = list[i];
          const k = `${extraAssignment.employeeId}_${dateStr}`;
          const capacityWarning: ScheduleConflict = {
            id: `WARN_CAPACITY_${extraAssignment.employeeId}_${dateStr}_${extraAssignment.workShiftId}`,
            ruleCode: 'WARN_STAFFING_CAPACITY',
            severity: 'WARNING',
            employeeId: extraAssignment.employeeId,
            workDate: dateStr,
            workShiftId: Number(extraAssignment.workShiftId),
            assignmentId: extraAssignment.id,
            message: `Ca ${extraAssignment.snapshotShiftName} đã vượt định biên tối đa (${list.length}/${maxCap} NV). Bổ sung nhân sự tăng cường.`,
            canOverride: true,
          };
          conflictsMap[k] = [...(conflictsMap[k] || []), capacityWarning];
        }
      }
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
      initial.holidays,
      initial.shiftTemplates
  );

  return {
    ...initial,
    conflicts: initialConflicts,

    fetchWeeklySchedule: async (branchId: number, startDate: string) => {
      set({ isFetchingSchedule: true });

      // 1. Immediately load cached data from localStorage so there's 0ms blank state
      const localCache = loadBranchScheduleFromStorage(branchId, startDate);
      if (Object.keys(localCache).length > 0) {
        set((state) => ({
          assignments: {
            ...state.assignments,
            ...localCache,
          },
        }));
      }

      if (isMockEnabled()) {
        const allEmployees = useDirectoryStore.getState().employees;
        const branchEmployees = allEmployees.filter((e) => e.branchId === branchId);
        const secondaryEmployees = allEmployees.filter((e) => e.branchId !== branchId && (e.id === 1 || e.id === 3));
        const combinedEmployees = [...branchEmployees, ...secondaryEmployees].map((e) => ({
          ...e,
          hasMultiBranch: e.id === 1 || e.id === 3 || e.branchId !== branchId,
          homeBranchId: e.branchId,
          homeBranchName: e.branchId === 1 ? 'Chi nhánh Cầu Giấy' : (e.branchId === 2 ? 'Chi nhánh Đống Đa' : 'Chi nhánh Hoàn Kiếm'),
        }));
        set({ employees: combinedEmployees, isFetchingSchedule: false });
        get().recomputeAllConflicts();
        return;
      }

      try {
        const data = await scheduleService.getWeeklySchedule(branchId, startDate);
        if (!data) {
          set({ isFetchingSchedule: false });
          return;
        }

        const currentMon = parseISO(startDate);
        const currentSun = addDays(currentMon, 6);
        const monStr = startDate;
        const sunStr = format(currentSun, 'yyyy-MM-dd');

        // Retain assignments from other weeks, but clear this week so backend is the Single Source of Truth
        const mergedAssignments: Record<string, ShiftAssignment[]> = {};
        for (const [key, list] of Object.entries(get().assignments)) {
          const filtered = list.filter((a) => a.workDate < monStr || a.workDate > sunStr);
          if (filtered.length > 0) {
            mergedAssignments[key] = filtered;
          }
        }

        const backendEmployees: Employee[] = [];
        const thisWeekOnlyAssignments: Record<string, ShiftAssignment[]> = {};

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
            branchId: (empSchedule as any).home_branch_id || dirEmp?.branchId || data.branch_id || branchId,
            positionId: dirEmp?.positionId || 3,
            managerId: dirEmp?.managerId || null,
            employmentStatus: resolvedStatus,
            employmentType: dirEmp?.employmentType || 'FULL_TIME',
            hireDate: dirEmp?.hireDate || '2026-01-01',
            isActive: resolvedIsActive,
            hasMultiBranch: Boolean((empSchedule as any).has_multi_branch),
            homeBranchId: (empSchedule as any).home_branch_id,
            homeBranchName: (empSchedule as any).home_branch_name,
            branchHours: (empSchedule as any).branch_hours,
            totalChainHours: (empSchedule as any).total_chain_hours,
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
              branchId: a.branch_id || data.branch_id || branchId,
              branchName: a.branch_name || data.branch_name,
              isExternal: Boolean(a.is_external),
              readOnly: Boolean(a.read_only),
            };

            const existingList = mergedAssignments[key] ? [...mergedAssignments[key]] : [];
            const idx = existingList.findIndex((item) => item.id === a.id);
            if (idx >= 0) {
              existingList[idx] = mappedAssignment;
            } else {
              existingList.push(mappedAssignment);
            }
            mergedAssignments[key] = existingList;

            const weekList = thisWeekOnlyAssignments[key] ? [...thisWeekOnlyAssignments[key]] : [];
            weekList.push(mappedAssignment);
            thisWeekOnlyAssignments[key] = weekList;
          }
        }

        saveBranchScheduleToStorage(branchId, thisWeekOnlyAssignments, startDate);

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

        // Người dùng đã đổi sang chi nhánh khác trong lúc chờ phản hồi: bỏ kết quả cũ
        if ((get().filterOptions.branchId || 1) !== branchId) return;

        set({
          scheduleId: data.schedule_id,
          scheduleStatus: (data.status as ScheduleStatus) || 'DRAFT',
          scheduleVersion: data.version !== undefined ? data.version : 0,
          employees: backendEmployees.length > 0 ? backendEmployees : fallbackEmployees,
          shiftTemplates: templates.length > 0 ? templates : get().shiftTemplates,
          assignments: mergedAssignments,
          isFetchingSchedule: false,
        });

        get().recomputeAllConflicts();
      } catch (err) {
        console.warn('Could not fetch weekly schedule from API, using fallback:', err);
        set({ isFetchingSchedule: false });
      }
    },

    setWeek: (mondayDateStr) => {
      set({ currentStartDate: mondayDateStr });
      const branchId = get().filterOptions.branchId || 1;
      const cached = loadBranchScheduleFromStorage(branchId, mondayDateStr);
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
      const prevBranchId = get().filterOptions.branchId;
      const branchChanged =
          Boolean(newFilters.branchId) && newFilters.branchId !== prevBranchId;

      set((state) => {
        const updatedFilters = { ...state.filterOptions, ...newFilters };
        let updatedAssignments = state.assignments;
        let updatedEmployees = state.employees;

        if (branchChanged && newFilters.branchId) {
          const currentMon = parseISO(state.currentStartDate);
          const currentSun = addDays(currentMon, 6);
          const monStr = state.currentStartDate;
          const sunStr = format(currentSun, 'yyyy-MM-dd');

          // Giữ lại phân ca các tuần khác, làm sạch tuần hiện tại của chi nhánh cũ để không bị nhấp nháy chồng lấn
          const nonCurrentWeekAssignments: Record<string, ShiftAssignment[]> = {};
          for (const [key, list] of Object.entries(state.assignments)) {
            const filtered = list.filter((a) => a.workDate < monStr || a.workDate > sunStr);
            if (filtered.length > 0) {
              nonCurrentWeekAssignments[key] = filtered;
            }
          }

          // Nạp cache của chi nhánh mới được chọn
          const branchCache = loadBranchScheduleFromStorage(newFilters.branchId, state.currentStartDate);
          updatedAssignments = { ...nonCurrentWeekAssignments, ...branchCache };

          // Nhân sự chuyển ngay sang danh sách của chi nhánh mới
          updatedEmployees = useDirectoryStore
              .getState()
              .employees.filter((e) => e.branchId === newFilters.branchId);
        }

        return {
          filterOptions: updatedFilters,
          assignments: updatedAssignments,
          employees: updatedEmployees,
          isFetchingSchedule: branchChanged ? true : state.isFetchingSchedule,
        };
      });

      if (branchChanged) {
        get().recomputeAllConflicts();
      }
    },

    assignShift: (payload) => {
      const state = get();
      if (state.scheduleStatus === 'PUBLISHED') {
        return {
          success: false,
          error: 'Lịch tuần đã công bố chính thức và đang bị khóa. Chỉ Giám đốc hoặc Admin mới có quyền thu hồi về bản nháp để điều chỉnh.',
        };
      }

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
      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments, state.currentStartDate);

      const updatedConflicts = computeAllConflicts(
          updatedAssignments,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
        changeHistory: state.changeHistory,
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
                  saveBranchScheduleToStorage(prev.filterOptions.branchId || 1, newAssignmentsMap, prev.currentStartDate);
                  const recomputedConflicts = computeAllConflicts(
                    newAssignmentsMap,
                    prev.employees,
                    prev.approvedLeaves,
                    prev.holidays,
                    prev.shiftTemplates
                  );
                  return {
                    assignments: newAssignmentsMap,
                    conflicts: recomputedConflicts,
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

    deleteAssignment: (assignmentId, _changeReason, _actorRole = 'ROLE_DIRECTOR') => {
      const state = get();
      if (state.scheduleStatus === 'PUBLISHED') {
        console.warn('Cannot delete shift assignment on a PUBLISHED schedule without reverting to DRAFT.');
        return;
      }

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

      // Bảo vệ: Không cho phép xóa ca làm việc ngoại vi (chỉ đọc)
      if (targetAssignment.readOnly || targetAssignment.isExternal) {
        console.warn('Cannot delete external read-only assignment:', targetAssignment);
        return;
      }

      if (!isMockEnabled()) {
        scheduleService.deleteAssignment(assignmentId, state.scheduleVersion).catch((err) => {
          console.warn('Failed to delete assignment on backend:', err);
        });
      }

      const updatedAssignments = { ...state.assignments };
      const filteredList = (updatedAssignments[targetKey] || []).filter((a) => a.id !== assignmentId);
      if (filteredList.length > 0) {
        updatedAssignments[targetKey] = filteredList;
      } else {
        delete updatedAssignments[targetKey];
      }

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments, state.currentStartDate);

      const updatedConflicts = computeAllConflicts(
          updatedAssignments,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
        changeHistory: state.changeHistory,
      });
    },

    updateAssignmentOverride: async (assignmentId: number, overrideReason: string | null, overrideRule?: string) => {
      const state = get();
      if (state.scheduleStatus === 'PUBLISHED') {
        return false;
      }

      const normalizedReason = overrideReason && overrideReason.trim().length > 0 ? overrideReason.trim() : null;

      let found = false;
      let targetKey: string | null = null;
      const updatedAssignments: Record<string, ShiftAssignment[]> = { ...state.assignments };

      for (const key of Object.keys(updatedAssignments)) {
        const list = updatedAssignments[key];
        const idx = list.findIndex((a) => Number(a.id) === Number(assignmentId));
        if (idx >= 0) {
          const updatedItem: ShiftAssignment = {
            ...list[idx],
            overrideReason: normalizedReason,
            overrideRule: normalizedReason ? (overrideRule || list[idx].overrideRule || 'WARN_STAFFING_CAPACITY') : null,
          };
          updatedAssignments[key] = [
            ...list.slice(0, idx),
            updatedItem,
            ...list.slice(idx + 1),
          ];
          found = true;
          targetKey = key;
          break;
        }
      }

      if (!found) return false;

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updatedAssignments, state.currentStartDate);
      const updatedConflicts = computeAllConflicts(
        updatedAssignments,
        state.employees,
        state.approvedLeaves,
        state.holidays,
        state.shiftTemplates
      );

      set({
        assignments: updatedAssignments,
        conflicts: updatedConflicts,
      });

      if (!isMockEnabled()) {
        try {
          const saved = await scheduleService.updateAssignmentOverride(assignmentId, {
            override_reason: normalizedReason,
            override_rule: normalizedReason ? overrideRule : null,
            schedule_version: state.scheduleVersion,
          });

          if (saved && targetKey) {
            set((prev) => {
              const currentList = prev.assignments[targetKey!] || [];
              const nextList = currentList.map((item) =>
                Number(item.id) === Number(assignmentId)
                  ? {
                      ...item,
                      overrideReason: saved.override_reason !== undefined ? saved.override_reason : normalizedReason,
                      overrideRule: saved.override_rule !== undefined ? saved.override_rule : (normalizedReason ? item.overrideRule : null),
                      version: saved.version || item.version,
                    }
                  : item
              );
              const nextMap = {
                ...prev.assignments,
                [targetKey!]: nextList,
              };
              saveBranchScheduleToStorage(prev.filterOptions.branchId || 1, nextMap, prev.currentStartDate);
              return {
                assignments: nextMap,
                scheduleVersion: (prev.scheduleVersion || 1) + 1,
              };
            });
          }
        } catch (err) {
          console.error('Failed to update override reason to backend:', err);
        }
      }

      return true;
    },

    applyAutoAssignments: (
        newAssignments,
        mode: 'REPLACE_ALL' | 'FILL_MISSING' = 'REPLACE_ALL',
        fromDate?: string,
        toDate?: string
    ) => {
      if (newAssignments.length === 0) return;
      const state = get();
      const updated: Record<string, ShiftAssignment[]> = {};

      if (mode === 'REPLACE_ALL') {
        const minDate = fromDate || newAssignments.reduce((min, a) => (a.workDate < min ? a.workDate : min), newAssignments[0].workDate);
        const maxDate = toDate || newAssignments.reduce((max, a) => (a.workDate > max ? a.workDate : max), newAssignments[0].workDate);

        // Keep existing assignments outside of [minDate, maxDate]
        for (const [key, list] of Object.entries(state.assignments)) {
          const preserved = list.filter((a) => a.workDate < minDate || a.workDate > maxDate);
          if (preserved.length > 0) {
            updated[key] = preserved;
          }
        }
      } else {
        // FILL_MISSING: preserve all existing assignments
        for (const [key, list] of Object.entries(state.assignments)) {
          updated[key] = [...list];
        }
      }

      // Add new assignments
      for (const a of newAssignments) {
        const key = `${a.employeeId}_${a.workDate}`;
        const list = updated[key] ? [...updated[key]] : [];

        // Avoid exact duplicate
        const alreadyHasShift = list.some(
            (x) => x.workShiftId === a.workShiftId && x.status !== 'CANCELLED'
        );
        if (alreadyHasShift) continue;

        list.push(a);
        updated[key] = list;
      }

      saveBranchScheduleToStorage(state.filterOptions.branchId || 1, updated, state.currentStartDate);

      const updatedConflicts = computeAllConflicts(
          updated,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
      );

      set({ assignments: updated, conflicts: updatedConflicts });

      if (!isMockEnabled() && state.scheduleId) {
        scheduleService
            .batchAssignShifts({
              schedule_id: state.scheduleId,
              schedule_version: state.scheduleVersion,
              mode,
              from_date: fromDate,
              to_date: toDate,
              assignments: newAssignments.map((a) => ({
                employee_id: a.employeeId,
                work_shift_id: a.workShiftId,
                work_date: a.workDate,
                override_rule: a.overrideRule || undefined,
                override_reason: a.overrideReason || undefined,
              })),
            })
            .then((savedList) => {
              if (savedList && savedList.length > 0) {
                // Refresh schedule to ensure exact server IDs and state
                get().fetchWeeklySchedule(state.filterOptions.branchId || 1, state.currentStartDate);
              }
            })
            .catch((err) => {
              console.warn('Failed to persist batch assignments to backend:', err);
            });
      }
    },

    copyWeek: async (mode) => {
      const state = get();
      const currentMon = parseISO(state.currentStartDate);
      const prevMon = addDays(currentMon, -7);
      const prevSun = addDays(currentMon, -1);
      const prevMonStr = format(prevMon, 'yyyy-MM-dd');
      const prevSunStr = format(prevSun, 'yyyy-MM-dd');
      const branchId = state.filterOptions.branchId || 1;

      if (!isMockEnabled()) {
        try {
          const res = await scheduleService.copyScheduleWeek({
            branch_id: branchId,
            source_start_date: prevMonStr,
            target_start_date: state.currentStartDate,
            mode,
          });

          // Reload authoritative weekly schedule from backend Single Source of Truth
          await get().fetchWeeklySchedule(branchId, state.currentStartDate);

          return {
            copiedCount: res.copied_count,
            skippedCount: res.skipped_count,
          };
        } catch (err) {
          console.error('Failed to copy schedule week via API:', err);
          throw err;
        }
      }

      // Fallback for Mock Mode
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

      saveBranchScheduleToStorage(branchId, updatedAssignments, state.currentStartDate);

      const updatedConflicts = computeAllConflicts(
          updatedAssignments,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
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
      saveBranchScheduleToStorage(branchId, updatedAssignments, currentMonStr);

      // 3. Tính toán lại xung đột (conflicts sẽ trở về rỗng cho tuần này)
      const updatedConflicts = computeAllConflicts(
          updatedAssignments,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
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
          state.holidays,
          state.shiftTemplates
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
          initialReset.holidays,
          initialReset.shiftTemplates
      );
      set({
        ...initialReset,
        conflicts: conflictsReset,
      });
    },

    fetchShiftTemplates: async (branchId?: number) => {
      if (isMockEnabled() || import.meta.env.MODE === 'test') {
        return;
      }
      try {
        const list = await workShiftService.getAllWorkShifts(branchId);
        if (list) {
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