import { api } from '@/shared/api/apiClient';

export interface ShiftTemplate {
  id: number;
  shift_code: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_cross_midnight: boolean;
  color_code: string;
  text_color?: string;
  min_staffing: number;
  max_staffing: number;
}

export interface ShiftAssignment {
  id: number;
  schedule_id: number;
  employee_id: number;
  work_shift_id: number;
  work_date: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  is_cross_midnight?: boolean;
  color_code: string;
  status: string;
  override_rule?: string;
  override_reason?: string;
  version?: number;
  branch_id?: number;
  branch_name?: string;
  is_external?: boolean;
  read_only?: boolean;
}

export interface EmployeeSchedule {
  employee_id: number;
  employee_code: string;
  full_name: string;
  weekly_scheduled_hours: number;
  assignments: ShiftAssignment[];
  has_multi_branch?: boolean;
  home_branch_id?: number;
  home_branch_name?: string;
  branch_hours?: number;
  total_chain_hours?: number;
}

export interface WeeklyScheduleData {
  schedule_id: number;
  branch_id: number;
  branch_name: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  employees: EmployeeSchedule[];
  holidays: Array<{ date: string; name: string }>;
  shift_templates: ShiftTemplate[];
}

export interface ScheduleConflict {
  rule_code: string;
  severity: 'MANDATORY' | 'WARNING';
  employee_id: number;
  employee_name?: string;
  work_date: string;
  work_shift_id: number;
  message: string;
}

export interface ConflictValidationResult {
  is_valid: boolean;
  has_mandatory_errors: boolean;
  has_warnings: boolean;
  mandatory_errors: ScheduleConflict[];
  warnings: ScheduleConflict[];
}

export const scheduleService = {
  async getWeeklySchedule(branchId: number, date: string): Promise<WeeklyScheduleData> {
    return api.get<WeeklyScheduleData>(`/schedules/weekly?branch_id=${branchId}&start_date=${date}`);
  },

  async validateConflicts(branchId: number, assignments: Array<{ employee_id: number; work_shift_id: number; work_date: string }>): Promise<ConflictValidationResult> {
    return api.post<ConflictValidationResult>('/schedules/validate-conflicts', {
      branch_id: branchId,
      assignments,
    });
  },

  async assignSingleShift(data: {
    schedule_id: number;
    employee_id: number;
    work_shift_id: number;
    work_date: string;
    override_rule?: string;
    override_reason?: string;
    schedule_version: number;
  }): Promise<ShiftAssignment> {
    return api.post<ShiftAssignment>('/schedules/assignments', data);
  },

  async deleteAssignment(assignmentId: number, scheduleVersion?: number): Promise<void> {
    const query = scheduleVersion !== undefined ? `?schedule_version=${scheduleVersion}` : '';
    return api.delete<void>(`/schedules/assignments/${assignmentId}${query}`);
  },

  async updateAssignmentOverride(
    assignmentId: number,
    data: {
      override_reason?: string | null;
      override_rule?: string | null;
      schedule_version?: number;
    }
  ): Promise<ShiftAssignment> {
    return api.patch<ShiftAssignment>(`/schedules/assignments/${assignmentId}/override`, data);
  },

  async bulkAssign(data: {
    schedule_id: number;
    employee_ids: number[];
    work_shift_id: number;
    from_date: string;
    to_date: string;
    schedule_version: number;
  }): Promise<ShiftAssignment[]> {
    return api.post<ShiftAssignment[]>('/schedules/bulk-assign', data);
  },

  async publishSchedule(scheduleId: number, version: number): Promise<WeeklyScheduleData> {
    return api.post<WeeklyScheduleData>(`/schedules/${scheduleId}/publish`, { version });
  },

  async unpublishSchedule(scheduleId: number): Promise<WeeklyScheduleData> {
    return api.post<WeeklyScheduleData>(`/schedules/${scheduleId}/unpublish`);
  },

  async batchAssignShifts(data: {
    schedule_id: number;
    schedule_version?: number;
    mode?: 'REPLACE_ALL' | 'FILL_MISSING';
    from_date?: string;
    to_date?: string;
    assignments: Array<{
      employee_id: number;
      work_shift_id: number;
      work_date: string;
      override_rule?: string;
      override_reason?: string;
    }>;
  }): Promise<ShiftAssignment[]> {
    return api.post<ShiftAssignment[]>('/schedules/assignments/batch', data);
  },

  async copyScheduleWeek(data: {
    branch_id: number;
    source_start_date: string;
    target_start_date: string;
    mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL';
  }): Promise<{
    copied_count: number;
    skipped_count: number;
    target_schedule_id: number;
    message?: string;
  }> {
    return api.post('/schedules/copy-week', data);
  },
};
