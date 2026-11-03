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
import { getShiftAbsoluteTimeRange } from '@/utils/conflict-detector.utils';
import { scheduleService } from '../api/scheduleService';
import { workShiftService } from '@/features/shifts/api/workShiftService';
import {
  STORAGE_PREFIX,
  loadBranchScheduleFromStorage,
  saveBranchScheduleToStorage,
} from '../utils/scheduleStorage';
import { computeAllConflicts } from '../utils/scheduleConflictComputer';



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
  ) => Promise<{ success: boolean; error?: string }>;
  copyWeek: (mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL') => Promise<{ copiedCount: number; skippedCount: number }>;
  publishSchedule: () => void;
  unpublishSchedule: () => void;
  recomputeAllConflicts: () => void;
  resetDemoData: () => void;

  /** Xóa toàn bộ phân ca trong tuần hiện tại đang chọn */
  resetCurrentWeekSchedule: () => Promise<boolean>;

  /** Cập nhật giải trình đặc cách cho ca phân công (hỗ trợ null để xóa giải trình) */
  updateAssignmentOverride: (assignmentId: number, overrideReason: string | null, overrideRule?: string) => Promise<boolean>;

  /** Nhân viên tự đăng ký ca trống */
  claimShift: (data: {
    workShiftId: number;
    workDate: string;
    selfVolunteeredConfirm?: boolean;
  }) => Promise<{ success: boolean; error?: string; warningMessage?: string; needsConfirm?: boolean }>;

  /** Nhân viên tự hủy ca đã đăng ký */
  cancelClaimedShift: (assignmentId: number) => Promise<{ success: boolean; error?: string }>;

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
      onlyShowUnderstaffed: false,
    },
    employees: useDirectoryStore.getState().employees.filter((e) => e.branchId === branchId),
    shiftTemplates: [] as ShiftTemplate[],
    approvedLeaves: [] as LeaveRequest[],
    holidays: [] as CompanyHoliday[],
    isFetchingSchedule: false,
  };
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
              snapshotColorCode: a.color_code ?? null,
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
              transferredFromEmployeeId: a.transferred_from_employee_id,
              transferredFromEmployeeName: a.transferred_from_employee_name,
              transferredFromEmployeeCode: a.transferred_from_employee_code,
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
          colorCode: t.color_code ?? t.colorCode ?? null,
          textColor: t.text_color ?? t.textColor ?? null,
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

      scheduleService.deleteAssignment(assignmentId, state.scheduleVersion).catch((err) => {
        console.warn('Failed to delete assignment on backend:', err);
      });

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

      return true;
    },

    claimShift: async (data) => {
      const state = get();
      const currentBranchId = state.filterOptions.branchId || 1;
      try {
        await scheduleService.claimShift({
          schedule_id: state.scheduleId,
          work_shift_id: data.workShiftId,
          work_date: data.workDate,
          self_volunteered_confirm: data.selfVolunteeredConfirm,
        });

        // Tải lại lịch từ backend để cập nhật toàn bộ trạng thái
        await get().fetchWeeklySchedule(currentBranchId, state.currentStartDate);
        return { success: true };
      } catch (err: any) {
        const errorData = err?.response?.data?.error || err?.response?.data || {};
        const code = errorData.code || err?.code;
        const message = errorData.message || err?.message || 'Không thể đăng ký ca làm việc';

        if (code === 'WARN_VOLUNTEER_CONFIRMATION_REQUIRED') {
          return {
            success: false,
            needsConfirm: true,
            warningMessage: message,
          };
        }

        return {
          success: false,
          error: message,
        };
      }
    },

    cancelClaimedShift: async (assignmentId) => {
      const state = get();
      const currentBranchId = state.filterOptions.branchId || 1;
      try {
        await scheduleService.cancelClaimedShift(assignmentId);
        await get().fetchWeeklySchedule(currentBranchId, state.currentStartDate);
        return { success: true };
      } catch (err: any) {
        const message = err?.response?.data?.error?.message || err?.message || 'Không thể hủy ca làm việc';
        return { success: false, error: message };
      }
    },

    applyAutoAssignments: async (
        newAssignments,
        mode: 'REPLACE_ALL' | 'FILL_MISSING' = 'REPLACE_ALL',
        fromDate?: string,
        toDate?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (newAssignments.length === 0) return { success: true };
      const state = get();
      const branchId = state.filterOptions.branchId || 1;

      // 1. Cập nhật optimistic lên UI để hiển thị phản hồi ngay lập tức
      const updated: Record<string, ShiftAssignment[]> = {};

      if (mode === 'REPLACE_ALL') {
        const minDate = fromDate || newAssignments.reduce((min, a) => (a.workDate < min ? a.workDate : min), newAssignments[0].workDate);
        const maxDate = toDate || newAssignments.reduce((max, a) => (a.workDate > max ? a.workDate : max), newAssignments[0].workDate);

        for (const [key, list] of Object.entries(state.assignments)) {
          const preserved = list.filter((a) => a.workDate < minDate || a.workDate > maxDate);
          if (preserved.length > 0) {
            updated[key] = preserved;
          }
        }
      } else {
        for (const [key, list] of Object.entries(state.assignments)) {
          updated[key] = [...list];
        }
      }

      for (const a of newAssignments) {
        const key = `${a.employeeId}_${a.workDate}`;
        const list = updated[key] ? [...updated[key]] : [];
        const alreadyHasShift = list.some(
            (x) => x.workShiftId === a.workShiftId && x.status !== 'CANCELLED'
        );
        if (alreadyHasShift) continue;

        list.push(a);
        updated[key] = list;
      }

      const updatedConflicts = computeAllConflicts(
          updated,
          state.employees,
          state.approvedLeaves,
          state.holidays,
          state.shiftTemplates
      );

      set({ assignments: updated, conflicts: updatedConflicts });

      // 2. Đảm bảo có scheduleId hợp lệ từ backend trước khi lưu hàng loạt
      let targetScheduleId = state.scheduleId;
      let targetScheduleVersion = state.scheduleVersion;

      if (!targetScheduleId) {
        try {
          const scheduleData = await scheduleService.getWeeklySchedule(branchId, state.currentStartDate);
          if (scheduleData) {
            targetScheduleId = scheduleData.schedule_id;
            targetScheduleVersion = scheduleData.version !== undefined ? scheduleData.version : 0;
          }
        } catch (e) {
          console.warn('Could not fetch schedule before batch persist:', e);
        }
      }

      if (targetScheduleId) {
        try {
          await scheduleService.batchAssignShifts({
            schedule_id: targetScheduleId,
            schedule_version: targetScheduleVersion,
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
          });

          // Tải lại lịch từ máy chủ để nạp toàn bộ ID thực của MySQL vào store & storage
          await get().fetchWeeklySchedule(branchId, state.currentStartDate);
          return { success: true };
        } catch (err: any) {
          console.error('Failed to persist batch assignments to backend:', err);
          // Rollback bằng cách nạp lại trạng thái máy chủ
          await get().fetchWeeklySchedule(branchId, state.currentStartDate);
          const msg = err?.response?.data?.error?.message || err?.message || 'Không thể lưu phân ca lên máy chủ';
          return { success: false, error: msg };
        }
      }

      return { success: false, error: 'Không tìm thấy thông tin lịch làm việc để lưu.' };
    },

    copyWeek: async (mode) => {
      const state = get();
      const currentMon = parseISO(state.currentStartDate);
      const prevMon = addDays(currentMon, -7);
      const prevMonStr = format(prevMon, 'yyyy-MM-dd');
      const branchId = state.filterOptions.branchId || 1;

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
    },

    publishSchedule: () => {
      const state = get();
      scheduleService.publishSchedule(state.scheduleId, state.scheduleVersion).catch((err) => {
        console.warn('Failed to publish schedule on backend:', err);
      });
      set({
        scheduleStatus: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });
    },

    unpublishSchedule: () => {
      const state = get();
      scheduleService.unpublishSchedule(state.scheduleId).catch((err) => {
        console.warn('Failed to unpublish schedule on backend:', err);
      });
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

      // 5. Nếu có scheduleId thực tế, gọi API dọn dẹp các phân ca trên server
      if (state.scheduleId) {
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
      if (import.meta.env.MODE === 'test') {
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
      const isTest = import.meta.env.MODE === 'test';
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
        throw err;
      }
    },

    updateShiftTemplate: async (id, data) => {
      const state = get();
      const prevTemplates = state.shiftTemplates;
      const isTest = import.meta.env.MODE === 'test';

      // Resolve branchName from directory store if not present
      let branchName = data.branchName;
      if (!branchName && data.branchId) {
        const branch = useDirectoryStore.getState().branches.find((b) => b.id === data.branchId);
        if (branch) {
          branchName = branch.branchName;
        }
      }

      const mergedData = branchName ? { ...data, branchName } : data;

      // Optimistic update
      set({
        shiftTemplates: state.shiftTemplates.map((t) => (t.id === id ? { ...t, ...mergedData } : t)),
      });

      if (!isTest) {
        try {
          const updated = await workShiftService.updateWorkShift(id, data);
          set({
            shiftTemplates: get().shiftTemplates.map((t) => (t.id === id ? updated : t)),
          });
        } catch (err) {
          console.error('Failed to update shift template on backend:', err);
          // Rollback state on error
          set({ shiftTemplates: prevTemplates });
          throw err;
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

      const isTest = import.meta.env.MODE === 'test';
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