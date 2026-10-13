import type { Employee, ShiftAssignment, Department } from '@/types/domain.types';
import { formatDateVi, formatDateIso, getWeekDays } from './date.utils';
import { calculateShiftDurations } from './schedule-calc.utils';

export interface ExportWeeklyRosterCsvParams {
  monday: Date;
  department: Department | null;
  employees: Employee[];
  assignments: ShiftAssignment[];
}

/**
 * Escapes a cell value for standard CSV formatting.
 * Quotes strings containing commas, quotes, or newlines.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV content string with UTF-8 BOM (\uFEFF) for Vietnamese Excel compatibility.
 */
export function buildWeeklyRosterCsv(params: ExportWeeklyRosterCsvParams): string {
  const { monday, department, employees, assignments } = params;
  const weekDays = getWeekDays(monday);

  const lines: string[] = [];

  // Metadata headers
  lines.push(`${escapeCsvCell('BẢNG PHÂN CA LÀM VIỆC TUẦN')},${escapeCsvCell(`Từ ngày ${formatDateVi(weekDays[0])} đến ${formatDateVi(weekDays[6])}`)}`);
  lines.push(`${escapeCsvCell('Phòng ban:')},${escapeCsvCell(department ? department.departmentName : 'Tất cả phòng ban')}`);
  lines.push(''); // Blank row

  // Table Column Headers
  const headers = [
    'Mã NV',
    'Họ và Tên',
    'Chức vụ',
    ...weekDays.map((d) => `${formatDateVi(d)} (${d.getDay() === 0 ? 'CN' : `T${d.getDay() + 1}`})`),
    'Tổng ca',
    'Tổng giờ (Net)',
  ];
  lines.push(headers.map(escapeCsvCell).join(','));

  // Assignment index by `${empId}_${workDate}`
  const assignmentMap = new Map<string, ShiftAssignment>();
  for (const a of assignments) {
    if (a.status !== 'CANCELLED') {
      assignmentMap.set(`${a.employeeId}_${a.workDate}`, a);
    }
  }

  // Row per employee
  for (const emp of employees) {
    let empShiftCount = 0;
    let empTotalHours = 0;

    const rowCells: string[] = [
      escapeCsvCell(emp.employeeCode),
      escapeCsvCell(emp.fullName),
      escapeCsvCell(emp.isActive ? 'Nhân viên' : 'Đã nghỉ việc'),
    ];

    for (const day of weekDays) {
      const dateStr = formatDateIso(day);
      const assignment = assignmentMap.get(`${emp.id}_${dateStr}`);
      if (assignment) {
        empShiftCount++;
        const { netHours } = calculateShiftDurations(
          assignment.snapshotStartTime,
          assignment.snapshotEndTime,
          assignment.snapshotBreakMinutes,
          assignment.snapshotCrossMidnight
        );
        empTotalHours += netHours;
        const crossText = assignment.snapshotCrossMidnight ? ' (+1)' : '';
        rowCells.push(escapeCsvCell(`${assignment.snapshotShiftName} (${assignment.snapshotStartTime}-${assignment.snapshotEndTime}${crossText})`));
      } else {
        rowCells.push(escapeCsvCell('-'));
      }
    }

    rowCells.push(escapeCsvCell(empShiftCount));
    rowCells.push(escapeCsvCell(empTotalHours.toFixed(1)));
    lines.push(rowCells.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) to prevent Vietnamese encoding corruption in Microsoft Excel
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Triggers a browser file download of the CSV content.
 */
export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generic CSV exporter with UTF-8 BOM for data tables
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: { key: string; header: string }[],
  title?: string
): void {
  const lines: string[] = [];
  if (title) {
    lines.push(escapeCsvCell(title));
    lines.push('');
  }
  lines.push(columns.map((c) => escapeCsvCell(c.header)).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(row[c.key])).join(','));
  }
  const content = '\uFEFF' + lines.join('\r\n');
  downloadCsvFile(content, filename);
}

