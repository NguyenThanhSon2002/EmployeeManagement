import { create } from 'zustand';
import type { AvailabilityMap } from '@/types/domain.types';

const STORAGE_KEY = 'ems_employee_availabilities';

/** Dữ liệu seed mặc định cho các nhân viên demo (EMP 1 đến EMP 8) */
const DEFAULT_DEMO_AVAILABILITIES: AvailabilityMap = {
  // EMP 1: Làm được Ca Sáng (1) & Ca Chiều (2) từ Thứ 2 đến Thứ 6
  1: {
    1: [1, 2],
    2: [1, 2],
    3: [1, 2],
    4: [1, 2],
    5: [1, 2],
    6: [],
    7: [],
  },
  // EMP 2: Làm được Ca Chiều (2) & Ca Tối (3) các ngày Thứ 3, 5, 7, CN
  2: {
    1: [],
    2: [2, 3],
    3: [],
    4: [2, 3],
    5: [],
    6: [2, 3],
    7: [2, 3],
  },
  // EMP 3: Chuyên Ca Sáng (1) từ Thứ 2 đến Thứ 7
  3: {
    1: [1],
    2: [1],
    3: [1],
    4: [1],
    5: [1],
    6: [1],
    7: [],
  },
  // EMP 4: Chuyên Ca Tối (3) từ Thứ 2 đến Chủ Nhật
  4: {
    1: [3],
    2: [3],
    3: [3],
    4: [3],
    5: [3],
    6: [3],
    7: [3],
  },
  // EMP 5: Toàn bộ ca cuối tuần (Thứ 7 & Chủ Nhật)
  5: {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [1, 2, 3],
    7: [1, 2, 3],
  },
  // EMP 6: Ca Sáng & Chiều Thứ 2, 4, 6
  6: {
    1: [1, 2],
    2: [],
    3: [1, 2],
    4: [],
    5: [1, 2],
    6: [],
    7: [],
  },
  // EMP 7: Ca Chiều & Tối Thứ 3, 5, 7
  7: {
    1: [],
    2: [2, 3],
    3: [],
    4: [2, 3],
    5: [],
    6: [2, 3],
    7: [],
  },
  // EMP 8: Ca Sáng & Tối từ Thứ 2 đến Thứ 6
  8: {
    1: [1, 3],
    2: [1, 3],
    3: [1, 3],
    4: [1, 3],
    5: [1, 3],
    6: [],
    7: [],
  },
};

function loadAvailabilitiesFromStorage(): AvailabilityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse employee availabilities from storage:', err);
  }
  // Initialize with default demo dataset
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_AVAILABILITIES));
  } catch {
    // Ignore storage quota errors in private mode
  }
  return DEFAULT_DEMO_AVAILABILITIES;
}

function persistAvailabilities(data: AvailabilityMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist employee availabilities to storage:', err);
  }
}

interface AvailabilityState {
  availabilities: AvailabilityMap;
  isLoaded: boolean;

  /** Lấy lịch khả dụng 7 ngày (1..7) của 1 nhân sự */
  getAvailability: (employeeId: number) => Record<number, number[]>;

  /** Kiểm tra nhanh O(1) nhân sự có thể làm ca này vào thứ này không */
  isAvailable: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => boolean;

  /** Lấy danh sách ID nhân viên có thể làm ca này vào thứ này */
  getAvailableEmployeeIds: (dayOfWeek: number, shiftTemplateId: number) => number[];

  /** Bật/tắt 1 ca của nhân viên vào 1 thứ cụ thể */
  toggleShiftAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateId: number) => void;

  /** Đặt danh sách ca khả dụng cho 1 ngày */
  setDayAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateIds: number[]) => void;

  /** Bật/tắt ca cho cả 7 ngày trong tuần */
  setShiftForWeek: (employeeId: number, shiftTemplateId: number, available: boolean) => void;

  /** Lưu toàn bộ bản đồ 7 ngày của nhân viên */
  saveAvailability: (employeeId: number, record: Record<number, number[]>) => void;

  /** Xóa toàn bộ lịch rảnh của nhân viên */
  clearAllAvailability: (employeeId: number) => void;

  /** Đặt lại về cấu hình demo mặc định */
  resetToDemoDefaults: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => {
  const initialData = loadAvailabilitiesFromStorage();

  return {
    availabilities: initialData,
    isLoaded: true,

    getAvailability: (employeeId: number) => {
      const empData = get().availabilities[Number(employeeId)];
      const result: Record<number, number[]> = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
      };
      if (empData) {
        for (let d = 1; d <= 7; d++) {
          if (Array.isArray(empData[d])) {
            result[d] = [...empData[d]];
          }
        }
      }
      return result;
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
        if (daysMap && Array.isArray(daysMap[dayOfWeek])) {
          if (daysMap[dayOfWeek].includes(shiftIdNum)) {
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

      const updated = {
        ...get().availabilities,
        [empIdNum]: current,
      };
      persistAvailabilities(updated);
      set({ availabilities: updated });
    },

    setDayAvailability: (employeeId: number, dayOfWeek: number, shiftTemplateIds: number[]) => {
      const empIdNum = Number(employeeId);
      const current = get().getAvailability(empIdNum);
      current[dayOfWeek] = [...shiftTemplateIds];

      const updated = {
        ...get().availabilities,
        [empIdNum]: current,
      };
      persistAvailabilities(updated);
      set({ availabilities: updated });
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

      const updated = {
        ...get().availabilities,
        [empIdNum]: current,
      };
      persistAvailabilities(updated);
      set({ availabilities: updated });
    },

    saveAvailability: (employeeId: number, record: Record<number, number[]>) => {
      const empIdNum = Number(employeeId);
      const updated = {
        ...get().availabilities,
        [empIdNum]: record,
      };
      persistAvailabilities(updated);
      set({ availabilities: updated });
    },

    clearAllAvailability: (employeeId: number) => {
      const empIdNum = Number(employeeId);
      const cleared: Record<number, number[]> = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
      };
      const updated = {
        ...get().availabilities,
        [empIdNum]: cleared,
      };
      persistAvailabilities(updated);
      set({ availabilities: updated });
    },

    resetToDemoDefaults: () => {
      persistAvailabilities(DEFAULT_DEMO_AVAILABILITIES);
      set({ availabilities: DEFAULT_DEMO_AVAILABILITIES });
    },
  };
});
