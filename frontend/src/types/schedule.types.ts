import type { CompanyHoliday } from './domain.types';

/** Filter options for the weekly schedule matrix */
export interface ScheduleFilterOptions {
  branchId: number;
  searchTerm: string;
  shiftCodeFilter: string;
  onlyShowConflicts: boolean;
}

/** Day header representation */
export interface ScheduleDayHeader {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeekNameVi: string; // 'Thứ Hai', 'Thứ Ba'...
  dayShortVi: string; // 'T2', 'T3'...
  isToday: boolean;
  isWeekend: boolean;
  totalAssignedStaff: number;
  holiday: CompanyHoliday | null;
}

/** Weekly Summary Statistics */
export interface WeeklySummaryStats {
  totalShifts: number;
  totalHours: number;
  conflictCount: number;
  unassignedDaysCount: number;
}
