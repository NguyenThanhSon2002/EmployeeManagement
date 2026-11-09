export interface SalaryContract {
  id: number;
  employee_id: number;
  employee_code?: string;
  full_name?: string;
  salary_type: 'MONTHLY' | 'HOURLY';
  base_salary: number;
  hourly_rate: number;
  allowance_lunch: number;
  allowance_travel: number;
  insurance_salary: number;
  tax_dependents: number;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
}

export interface PayrollSummary {
  id: number;
  branch_id?: number | null;
  branch_name?: string;
  period_month: number;
  period_year: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'LOCKED';
  total_gross: number;
  total_net: number;
  total_employees: number;
  approved_by_name?: string;
  approved_at?: string | null;
  created_at: string;
}

export interface PayrollItem {
  id: number;
  payroll_id: number;
  employee_id: number;
  employee_code?: string;
  full_name?: string;
  branch_name?: string;
  position_title?: string;
  employment_type: string;
  salary_type: 'MONTHLY' | 'HOURLY';
  standard_hours: number;
  actual_hours: number;
  night_hours: number;
  late_minutes: number;
  unpaid_leave_days: number;
  base_pay: number;
  night_pay: number;
  attendance_bonus: number;
  allowances_total: number;
  deduction_late: number;
  deduction_unpaid_leave: number;
  insurance_deduction: number;
  tax_deduction: number;
  gross_salary: number;
  net_salary: number;
  status: string;
  note?: string;
}

export interface PayrollDetail {
  id: number;
  branch_id?: number | null;
  branch_name?: string;
  period_month: number;
  period_year: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'LOCKED';
  total_gross: number;
  total_net: number;
  total_employees: number;
  approved_by_name?: string;
  approved_at?: string | null;
  items: PayrollItem[];
}

export interface MyPayslip {
  item_id: number;
  payroll_id: number;
  period_month: number;
  period_year: number;
  payroll_status: string;
  employee_id: number;
  employee_code: string;
  full_name: string;
  branch_name: string;
  position_title: string;
  employment_type: string;
  salary_type: 'MONTHLY' | 'HOURLY';
  standard_hours: number;
  actual_hours: number;
  night_hours: number;
  late_minutes: number;
  unpaid_leave_days: number;

  // Earnings
  base_pay: number;
  night_pay: number;
  attendance_bonus: number;
  allowances_total: number;
  gross_salary: number;

  // Deductions
  deduction_late: number;
  deduction_unpaid_leave: number;
  insurance_deduction: number;
  tax_deduction: number;
  total_deductions: number;

  // Net Take-Home
  net_salary: number;
  note?: string;
  approved_at?: string | null;
}

export interface UpdatePayrollItemPayload {
  actual_hours?: number;
  night_hours?: number;
  base_pay?: number;
  attendance_bonus?: number;
  allowances_total?: number;
  deduction_late?: number;
  deduction_unpaid_leave?: number;
  note: string;
}
