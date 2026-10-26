import { create } from 'zustand';
import type { AvailabilityMap } from '@/types/domain.types';
import { api } from '@/shared/api/apiClient';

interface AvailabilityState {
  availabilities: AvailabilityMap;
  preferredShifts: Record<number, number[]>; // empId -> list of preferred shiftIds
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  /** Tải toàn bộ lịch rảnh của nhân viên trong một chi nhánh từ Backend */
  fetchBranchAvailabilities: (branchId: number) => Promise<void>;

  /** Tải lịch rảnh của 1 nhân sự từ Backend */
  fetchEmployeeAvailability: (employeeId: number) => Promise<{
    availabilities: Record<number, number[]>;
    preferredShiftIds: number[];
  }>;

  /** Lấy lịch khả dụng 7 ngày (1..7) của 1 nhân sự từ Store cache */
  getAvailability: (employeeId: number) => Record<number, number[]>;

  /** Lấy danh sách ID ca ưu tiên của 1 nhân sự */
  getPreferredShiftIds: (employeeId: number) => number[];

  /** Kiểm tra nhân sự có ưu tiên ca này không */
  isPreferredShift: (employeeId: number, shiftTemplateId: number) => boolean;

  /** Bật/tắt ca ưu tiên cho nhân sự */
  togglePreferredShift: (employeeId: number, shiftTemplateId: number) => void;

  /** Kiểm tra nhanh O(1) nhân sự có thể làm ca này vào thứ này không */
  isAvailable: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => boolean;

  /** Lấy danh sách ID nhân viên có thể làm ca này vào thứ này */
  getAvailableEmployeeIds: (dayOfWeek: number, shiftTemplateId: number) => number[];

  /** Bật/tắt 1 ca của nhân viên vào 1 thứ cụ thể (local state trước khi lưu) */
  toggleShiftAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => void;

  /** Đặt danh sách ca khả dụng cho 1 ngày */
  setDayAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateIds: number[]) => void;

  /** Bật/tắt ca cho cả 7 ngày trong tuần */
  setShiftForWeek: (employeeId: number, shiftTemplateId: number, available: boolean) => void;

  /** Lưu toàn bộ bản đồ 7 ngày và danh sách ca ưu tiên của nhân viên xuống Database qua Backend API */
  saveAvailability: (
    employeeId: number,
    record?: Record<number, number[]>,
    preferredShiftIds?: number[]
  ) => Promise<boolean>;

  /** Xóa toàn bộ lịch rảnh của nhân viên trên Backend */
  clearAllAvailability: (employeeId: number) => Promise<boolean>;
}

const createEmptyWeek = (): Record<number, number[]> => ({
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
});

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  availabilities: {},
  preferredShifts: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchBranchAvailabilities: async (branchId: number) => {
    try {
      const [availRes, prefRes]: [any, any] = await Promise.all([
        api.get(`/employees/availability?branch_id=${branchId}`),
        api.get(`/employees/preferred-shifts?branch_id=${branchId}`).catch(() => ({ data: {} })),
      ]);

      const rawData = availRes?.data?.data || availRes?.data || availRes || {};
      const data: AvailabilityMap = rawData;
      const rawPref = prefRes?.data?.data || prefRes?.data || prefRes || {};
      const prefData: Record<number, number[]> = rawPref;

      set((state) => ({
        availabilities: {
          ...state.availabilities,
          ...data,
        },
        preferredShifts: {
          ...state.preferredShifts,
          ...prefData,
        },
        isLoaded: true,
      }));
    } catch (err: any) {
      console.error(`Lỗi khi tải lịch khả dụng chi nhánh ${branchId}:`, err);
    }
  },

  fetchEmployeeAvailability: async (employeeId: number) => {
    const empIdNum = Number(employeeId);
    try {
      const response: any = await api.get(`/employees/${empIdNum}/availability`);
      const raw = response?.data?.data || response?.data || response || {};

      let availMap: Record<number, number[]> = createEmptyWeek();
      let prefIds: number[] = [];

      if (raw && raw.availabilities) {
        availMap = raw.availabilities;
        prefIds = (raw.preferred_shift_ids || []).map(Number);
      } else if (raw && typeof raw === 'object' && !raw.availabilities) {
        // Fallback for simple map
        availMap = raw;
      }

      set((state) => ({
        availabilities: {
          ...state.availabilities,
          [empIdNum]: availMap,
        },
        preferredShifts: {
          ...state.preferredShifts,
          [empIdNum]: prefIds,
        },
      }));
      return { availabilities: availMap, preferredShiftIds: prefIds };
    } catch (err) {
      console.error(`Lỗi khi tải lịch khả dụng nhân viên ${employeeId}:`, err);
      return {
        availabilities: get().getAvailability(empIdNum),
        preferredShiftIds: get().getPreferredShiftIds(empIdNum),
      };
    }
  },

  getAvailability: (employeeId: number) => {
    const empData = get().availabilities[Number(employeeId)];
    const result = createEmptyWeek();
    if (empData) {
      for (let d = 1; d <= 7; d++) {
        if (Array.isArray(empData[d])) {
          result[d] = [...empData[d]];
        }
      }
    }
    return result;
  },

  getPreferredShiftIds: (employeeId: number) => {
    const prefList = get().preferredShifts[Number(employeeId)];
    return Array.isArray(prefList) ? [...prefList] : [];
  },

  isPreferredShift: (employeeId: number, shiftTemplateId: number) => {
    const prefList = get().preferredShifts[Number(employeeId)];
    if (!Array.isArray(prefList)) return false;
    return prefList.includes(Number(shiftTemplateId));
  },

  togglePreferredShift: (employeeId: number, shiftTemplateId: number) => {
    const empIdNum = Number(employeeId);
    const shiftIdNum = Number(shiftTemplateId);
    const current = get().getPreferredShiftIds(empIdNum);
    const idx = current.indexOf(shiftIdNum);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(shiftIdNum);
    }
    set((state) => ({
      preferredShifts: {
        ...state.preferredShifts,
        [empIdNum]: current,
      },
    }));
  },

  isAvailable: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => {
    const empData = get().availabilities[Number(employeeId)];
    if (!empData || !Array.isArray(empData[dayOfWeek])) {
      return false;
    }
    return empData[dayOfWeek].includes(Number(shiftTemplateId));
  },

  getAvailableEmployeeIds: (dayOfWeek: number, shiftTemplateId: number) => {
    const all = get().availabilities;
    const result: number[] = [];
    const shiftIdNum = Number(shiftTemplateId);
    for (const [empIdStr, daysMap] of Object.entries(all)) {
      if (daysMap && Array.isArray(daysMap[Number(dayOfWeek)])) {
        if (daysMap[Number(dayOfWeek)].includes(shiftIdNum)) {
          result.push(Number(empIdStr));
        }
      }
    }
    return result;
  },

  toggleShiftAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => {
    const empIdNum = Number(employeeId);
    const shiftIdNum = Number(shiftTemplateId);
    const current = get().getAvailability(empIdNum);
    const dayList = current[dayOfWeek] ? [...current[dayOfWeek]] : [];
    const idx = dayList.indexOf(shiftIdNum);

    if (idx >= 0) {
      dayList.splice(idx, 1);
    } else {
      dayList.push(shiftIdNum);
    }
    current[dayOfWeek] = dayList;

    set((state) => ({
      availabilities: {
        ...state.availabilities,
        [empIdNum]: current,
      },
    }));
  },

  setDayAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateIds: number[]) => {
    const empIdNum = Number(employeeId);
    const current = get().getAvailability(empIdNum);
    current[dayOfWeek] = [...shiftTemplateIds];

    set((state) => ({
      availabilities: {
        ...state.availabilities,
        [empIdNum]: current,
      },
    }));
  },

  setShiftForWeek: (employeeId: number, shiftTemplateId: number, available: boolean) => {
    const empIdNum = Number(employeeId);
    const shiftIdNum = Number(shiftTemplateId);
    const current = get().getAvailability(empIdNum);

    for (let d = 1; d <= 7; d++) {
      const dayList = new Set(current[d] || []);
      if (available) {
        dayList.add(shiftIdNum);
      } else {
        dayList.delete(shiftIdNum);
      }
      current[d] = Array.from(dayList);
    }

    set((state) => ({
      availabilities: {
        ...state.availabilities,
        [empIdNum]: current,
      },
    }));
  },

  saveAvailability: async (
    employeeId: number,
    record?: Record<number, number[]>,
    preferredShiftIds?: number[]
  ) => {
    const empIdNum = Number(employeeId);
    const dataToSave = record || get().getAvailability(empIdNum);
    const prefToSave =
      preferredShiftIds !== undefined
        ? preferredShiftIds
        : get().getPreferredShiftIds(empIdNum);

    try {
      await api.put(`/employees/${empIdNum}/availability`, {
        employee_id: empIdNum,
        availabilities: dataToSave,
        preferred_shift_ids: prefToSave,
      });

      set((state) => ({
        availabilities: {
          ...state.availabilities,
          [empIdNum]: dataToSave,
        },
        preferredShifts: {
          ...state.preferredShifts,
          [empIdNum]: prefToSave,
        },
      }));
      return true;
    } catch (err) {
      console.error('Lỗi khi lưu lịch khả dụng lên server:', err);
      return false;
    }
  },

  clearAllAvailability: async (employeeId: number) => {
    const empIdNum = Number(employeeId);
    const emptyWeek = createEmptyWeek();

    try {
      await api.put(`/employees/${empIdNum}/availability`, {
        employee_id: empIdNum,
        availabilities: emptyWeek,
        preferred_shift_ids: [],
      });

      set((state) => ({
        availabilities: {
          ...state.availabilities,
          [empIdNum]: emptyWeek,
        },
        preferredShifts: {
          ...state.preferredShifts,
          [empIdNum]: [],
        },
      }));
      return true;
    } catch (err) {
      console.error('Lỗi khi xóa lịch khả dụng trên server:', err);
      return false;
    }
  },
}));