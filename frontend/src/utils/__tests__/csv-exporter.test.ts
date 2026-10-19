import { describe, it, expect } from 'vitest';
import type { Employee, ShiftAssignment, Branch } from '@/types/domain.types';
import { buildWeeklyRosterCsv } from '../csv-exporter.utils';

describe('Suite 5: CSV Client-Side Export with UTF-8 BOM', () => {
  it('TC-CSV-01: Generates CSV prepended with UTF-8 BOM character (\\uFEFF)', () => {
    const monday = new Date('2026-10-12T00:00:00Z');
    const branch: Branch = {
      id: 1,
      branchCode: 'CN_HN',
      branchName: 'Chi nhánh Hà Nội',
      address: '123 Cầu Giấy',
      phoneNumber: '0901234567',
      managerId: null,
      isActive: true,
    };
    const employees: Employee[] = [
      {
        id: 1,
        employeeCode: 'EMP-001',
        fullName: 'Nguyễn Văn An',
        email: 'an.nguyen@company.com',
        phoneNumber: '0901234567',
        branchId: 1,
        positionId: 1,
        managerId: null,
        employmentStatus: 'OFFICIAL',
        hireDate: '2024-01-01',
        isActive: true,
      },
    ];
    const assignments: ShiftAssignment[] = [
      {
        id: 1,
        scheduleId: 1,
        employeeId: 1,
        workShiftId: 1,
        workDate: '2026-10-12',
        snapshotShiftName: 'Ca Sáng',
        snapshotStartTime: '08:00',
        snapshotEndTime: '17:00',
        snapshotBreakMinutes: 60,
        snapshotCrossMidnight: false,
        snapshotColorCode: '#1677FF',
        plannedStartTime: '2026-10-12T08:00:00Z',
        plannedEndTime: '2026-10-12T17:00:00Z',
        status: 'ASSIGNED',
        overrideRule: null,
        overrideReason: null,
        version: 1,
      },
    ];

    const csv = buildWeeklyRosterCsv({
      monday,
      branch,
      employees,
      assignments,
    });

    // Check UTF-8 BOM at very first character
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Check Vietnamese text is properly encoded
    expect(csv).toContain('Chi nhánh Hà Nội');
    expect(csv).toContain('Nguyễn Văn An');
    expect(csv).toContain('Ca Sáng (08:00-17:00)');
    expect(csv).toContain('"8.0"'); // Net hours
  });
});
