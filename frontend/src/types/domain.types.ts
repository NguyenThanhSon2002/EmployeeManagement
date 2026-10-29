/**
 * Domain Types for Employee Management System
 * Conforms 100% to docs/10-frontend-architecture-plan.md, docs/03-database-design.md, and docs/04-api-specification.md
 */

/** User roles in the system (3 Canonical Roles: Director, Manager, Employee) */
export type RoleType = 'ROLE_DIRECTOR' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

/** Branch / Chi nhánh - Cơ sở làm việc */
export interface Branch {
  id: number;
  branchCode: string;
  branchName: string;
  address?: string;
  phoneNumber?: string;
  openedDate?: string;
  opened_date?: string;
  managerId?: number | null;
  isActive: boolean;
}

/** Job Position / Title */
export interface Position {
  id: number;
  positionCode: string;
  positionName: string;
}

/** Employment Status */
export type EmploymentStatus = 'PROBATION' | 'OFFICIAL' | 'ON_LEAVE' | 'RESIGNED';

export interface SecondaryBranchAssignment {
  branchId: number;
  positionId: number;
  branchName?: string;
  positionName?: string;
}

/** Employee Profile */
export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  branchId: number;
  positionId: number;
  managerId: number | null;
  employmentStatus: EmploymentStatus;
  hireDate: string; // YYYY-MM-DD
  avatarUrl?: string;
  isActive: boolean;
  version?: number;
  nationalId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  employmentType?: string;
  hasMultiBranch?: boolean;
  homeBranchId?: number;
  homeBranchName?: string;
  branchHours?: number;
  totalChainHours?: number;
  secondaryBranchIds?: number[];
  secondaryBranches?: SecondaryBranchAssignment[];
}

/** Lịch khả dụng làm việc của nhân viên theo ngày trong tuần */
export interface EmployeeAvailability {
  employeeId: number;
  /** Thứ trong tuần: 1 = Thứ Hai, 2 = Thứ Ba, ..., 7 = Chủ Nhật */
  dayOfWeek: number;
  /** Danh sách ID các mẫu ca (ShiftTemplate.id) mà nhân viên đăng ký làm được */
  shiftTemplateIds: number[];
}

/** Bản đồ tra cứu nhanh: employeeId -> dayOfWeek (1..7) -> shiftTemplateIds */
export type AvailabilityMap = Record<number, Record<number, number[]>>;

/** Shift Template (Work Shift Definition) */
export interface ShiftTemplate {
  id: number;
  shiftCode: string;
  shiftName: string;
  branchId?: number;
  branchName?: string | null;
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;   // HH:mm or HH:mm:ss
  breakMinutes: number;
  isCrossMidnight: boolean;
  colorCode: string; // Hex color for background
  textColor: string;  // Hex color for text (WCAG AA compliant)
  minStaffing: number;
  maxStaffing: number;
  applicableDays: string; // "1,2,3,4,5,6,7"
  isActive: boolean;
}

/** Schedule Week Status */
export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Weekly Schedule Container */
export interface ScheduleWeek {
  id: number;
  branchId: number;
  startDate: string; // Monday YYYY-MM-DD
  endDate: string;   // Sunday YYYY-MM-DD
  status: ScheduleStatus;
  version: number;
  publishedAt: string | null;
  publishedBy: number | null;
}

/** Shift Assignment with Immutable Audit Snapshots */
export interface ShiftAssignment {
  id: number;
  scheduleId: number;
  employeeId: number;
  workShiftId: number;
  workDate: string; // YYYY-MM-DD (Shift start date)
  
  // Immutable snapshots for audit log integrity
  snapshotShiftName: string;
  snapshotStartTime: string; // HH:mm
  snapshotEndTime: string;   // HH:mm
  snapshotBreakMinutes: number;
  snapshotCrossMidnight: boolean;
  snapshotColorCode: string;

  // Absolute UTC timestamps
  plannedStartTime: string; // ISO-8601 UTC
  plannedEndTime: string;   // ISO-8601 UTC

  status: 'ASSIGNED' | 'CANCELLED' | 'COMPLETED';
  overrideRule: string | null;
  overrideReason: string | null;
  version: number;

  // Multi-branch assignment properties
  branchId?: number;
  branchName?: string;
  isExternal?: boolean;
  readOnly?: boolean;
}

/** Employee Monthly Schedule and Summary */
export interface EmployeeMonthlySchedule {
  employeeId: number;
  month: string; // YYYY-MM
  totalShifts: number;
  totalHours: number;
  earliestAvailableMonth: string; // YYYY-MM
  shifts: ShiftAssignment[];
}

/** Severity for shift conflicts */
export type ConflictSeverity = 'MANDATORY' | 'WARNING';

/** Rule codes for scheduling business rules */
export type ConflictRuleCode = 'BR-001' | 'BR-002' | 'BR-003' | 'BR-004' | 'BR-005' | 'BR-006' | 'BR-007' | 'BR-DAILY-LIMIT' | 'BR-TRAVEL-BUFFER' | 'WARN_STAFFING_CAPACITY';

/** Scheduling Conflict Object */
export interface ScheduleConflict {
  id: string; // Unique `${ruleCode}_${employeeId}_${date}`
  ruleCode: ConflictRuleCode;
  severity: ConflictSeverity;
  employeeId: number;
  workDate: string;
  message: string;
  canOverride: boolean;
  workShiftId?: number;
  assignmentId?: number;
}

/** Attendance Record */
export interface AttendanceRecord {
  id: number;
  employeeId: number;
  shiftAssignmentId: number | null;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'MISSING_CHECKOUT' | 'CORRECTED' | 'ABSENT';
  source: 'WEB_PORTAL' | 'MANUAL_CORRECTION';
  isManuallyCorrected: boolean;
}

/** Attendance Correction Request */
export interface AttendanceCorrection {
  id: number;
  attendanceRecordId: number;
  employeeId: number;
  originalCheckIn: string | null;
  originalCheckOut: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  attachmentUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

/** Leave Request */
export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  tier1ReviewedBy: number | null;
  tier2ReviewedBy: number | null;
}

/** Company Holiday */
export interface CompanyHoliday {
  id: number;
  holidayDate: string; // YYYY-MM-DD
  holidayName: string;
  isPaid: boolean;
}

/** Audit Log Entry for Published Schedule Changes */
export interface ChangeHistoryEntry {
  id: number;
  scheduleId: number;
  shiftAssignmentId: number;
  employeeId: number;
  employeeName: string;
  workDate: string;
  actionType: 'ADDED' | 'MODIFIED' | 'DELETED';
  oldValue: Partial<ShiftAssignment> | null;
  newValue: Partial<ShiftAssignment> | null;
  changeReason: string;
  changedByRole: RoleType;
  changedAt: string; // ISO UTC
}

/** System & Demo Threshold Settings */
export interface DemoSettings {
  minRestBetweenShiftsHours: number; // Default 11.0, toggleable to 12.0
  maxWeeklyHours: number;            // Default 48.0
  maxDailyHours: number;             // Default 12.0
  gracePeriodMinutes: number;        // Default 5
  leaveConflictSeverity: 'WARNING' | 'MANDATORY';
  overnightAttribution: 'START_DATE';
}

/** Weekly Schedule Payload Structure */
export interface WeeklyScheduleData {
  schedule: ScheduleWeek;
  assignments: ShiftAssignment[];
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  approvedLeaves: LeaveRequest[];
  holidays: CompanyHoliday[];
}

/** Result of Conflict Validation Engine */
export interface ConflictValidationResult {
  hasMandatoryConflicts: boolean;
  conflicts: ScheduleConflict[];
}
