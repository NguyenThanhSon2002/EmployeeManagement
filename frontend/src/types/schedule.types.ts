import type { ShiftAssignment, ScheduleConflict, LeaveRequest, CompanyHoliday } from './domain.types';

/** Filter options for the weekly schedule matrix */
export interface ScheduleFilterOptions {
  departmentId: number;
  searchTerm: string;
  shiftCodeFilter: string;
  onlyShowConflicts: boolean;
}

/** State and content rendered inside a single cell of the matrix */
export interface ScheduleCellData {
  employeeId: number;
  workDate: string; // YYYY-MM-DD
  assignment: ShiftAssignment | null;
  conflicts: ScheduleConflict[];
  approvedLeave: LeaveRequest | null;
  holiday: CompanyHoliday | null;
  isLocked: boolean; // e.g. inactive employee or past date
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
