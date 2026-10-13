import { addDays, format } from 'date-fns';
import type {
  ScheduleWeek,
  ShiftAssignment,
  ShiftTemplate,
} from '@/types/domain.types';
import { MOCK_SHIFT_TEMPLATES } from './shift-templates.mock';
import { getCurrentMonday } from '@/utils/date.utils';

function createAssignment(params: {
  id: number;
  scheduleId: number;
  employeeId: number;
  template: ShiftTemplate;
  workDate: string;
}): ShiftAssignment {
  const { id, scheduleId, employeeId, template, workDate } = params;
  return {
    id,
    scheduleId,
    employeeId,
    workShiftId: template.id,
    workDate,
    snapshotShiftName: template.shiftName,
    snapshotStartTime: template.startTime,
    snapshotEndTime: template.endTime,
    snapshotBreakMinutes: template.breakMinutes,
    snapshotCrossMidnight: template.isCrossMidnight,
    snapshotColorCode: template.colorCode,
    plannedStartTime: `${workDate}T${template.startTime}:00Z`,
    plannedEndTime: `${workDate}T${template.endTime}:00Z`,
    status: 'ASSIGNED',
    overrideRule: null,
    overrideReason: null,
    version: 1,
  };
}

export function generateDeterministicSeedData(referenceDate: Date = new Date()) {
  const baseMonday = getCurrentMonday(referenceDate);

  const getOffsetDate = (days: number): string => {
    return format(addDays(baseMonday, days), 'yyyy-MM-dd');
  };

  // Schedule Weeks
  const wPrevStartDate = getOffsetDate(-7);
  const wPrevEndDate = getOffsetDate(-1);
  const w0StartDate = getOffsetDate(0);
  const w0EndDate = getOffsetDate(6);
  const wNextStartDate = getOffsetDate(7);
  const wNextEndDate = getOffsetDate(13);

  const weeks: ScheduleWeek[] = [
    {
      id: 101,
      departmentId: 2, // OPS
      startDate: wPrevStartDate,
      endDate: wPrevEndDate,
      status: 'PUBLISHED',
      version: 1,
      publishedAt: `${wPrevStartDate}T09:00:00Z`,
      publishedBy: 1,
    },
    {
      id: 102,
      departmentId: 2, // OPS
      startDate: w0StartDate,
      endDate: w0EndDate,
      status: 'DRAFT',
      version: 1,
      publishedAt: null,
      publishedBy: null,
    },
    {
      id: 103,
      departmentId: 2, // OPS
      startDate: wNextStartDate,
      endDate: wNextEndDate,
      status: 'DRAFT',
      version: 1,
      publishedAt: null,
      publishedBy: null,
    },
  ];

  const sang = MOCK_SHIFT_TEMPLATES[0];     // 08:00 - 17:00
  const sangSom = MOCK_SHIFT_TEMPLATES[1];  // 06:00 - 14:00
  const chieu = MOCK_SHIFT_TEMPLATES[2];    // 14:00 - 22:00
  const dem = MOCK_SHIFT_TEMPLATES[3];      // 22:00 - 06:00 (+1)

  const assignments: ShiftAssignment[] = [];
  let assignId = 1000;

  // --- SEED FOR W-1 (Previous Week: 100% Filled, PUBLISHED) ---
  // Seed Monday-Friday for employees 1..22 and 24..25
  for (let empId = 1; empId <= 25; empId++) {
    if (empId === 23) continue; // Inactive
    for (let dayOffset = -7; dayOffset <= -3; dayOffset++) {
      const template = empId % 2 === 0 ? chieu : sang;
      assignments.push(
        createAssignment({
          id: ++assignId,
          scheduleId: 101,
          employeeId: empId,
          template,
          workDate: getOffsetDate(dayOffset),
        })
      );
    }
  }

  // --- SEED FOR W0 (Current Week: Key Business Scenarios) ---
  // EMP-001 (Nguyễn Văn An): Standard administrative T2..T6
  for (let offset = 0; offset <= 4; offset++) {
    assignments.push(
      createAssignment({
        id: ++assignId,
        scheduleId: 102,
        employeeId: 1,
        template: sang,
        workDate: getOffsetDate(offset),
      })
    );
  }

  // EMP-002 (Trần Thị Bích):
  // T2: Ca Chiều (14:00 - 22:00)
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 2,
      template: chieu,
      workDate: getOffsetDate(0),
    })
  );
  // T3: Ca Sáng Sớm (06:00 - 14:00) -> Triggers BR-006 rest violation warning (8.0h rest)
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 2,
      template: sangSom,
      workDate: getOffsetDate(1),
    })
  );
  // T4: Ca Chiều
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 2,
      template: chieu,
      workDate: getOffsetDate(2),
    })
  );
  // T5: Has approved annual leave (LEAVE-7001), no shift
  // T6: Ca Chiều
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 2,
      template: chieu,
      workDate: getOffsetDate(4),
    })
  );
  // T7: Ca Chiều
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 2,
      template: chieu,
      workDate: getOffsetDate(5),
    })
  );

  // EMP-003 (Lê Văn Cường): Overnight shifts T3, T5, T7
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 3,
      template: dem,
      workDate: getOffsetDate(1),
    })
  );
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 3,
      template: dem,
      workDate: getOffsetDate(3),
    })
  );
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 3,
      template: dem,
      workDate: getOffsetDate(5),
    })
  );

  // EMP-004 (Phạm Văn Dũng): All 7 days (56h > 48h limit + Sunday Holiday)
  for (let offset = 0; offset <= 6; offset++) {
    assignments.push(
      createAssignment({
        id: ++assignId,
        scheduleId: 102,
        employeeId: 4,
        template: sang,
        workDate: getOffsetDate(offset),
      })
    );
  }

  // EMP-005 (Hoàng Thị Mai): Part-time / rotating: T2, T3, T4, T7, CN
  for (const offset of [0, 1, 2, 5, 6]) {
    assignments.push(
      createAssignment({
        id: ++assignId,
        scheduleId: 102,
        employeeId: 5,
        template: chieu,
        workDate: getOffsetDate(offset),
      })
    );
  }

  // EMP-025 (Trương Văn Hải): T5, T6, CN (Overnight Sunday -> Monday spill)
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 25,
      template: chieu,
      workDate: getOffsetDate(3),
    })
  );
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 25,
      template: chieu,
      workDate: getOffsetDate(4),
    })
  );
  assignments.push(
    createAssignment({
      id: ++assignId,
      scheduleId: 102,
      employeeId: 25,
      template: dem,
      workDate: getOffsetDate(6), // Sunday overnight
    })
  );

  // Other employees in Ops & Tech get realistic shifts
  for (const empId of [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    for (let offset = 0; offset <= 4; offset++) {
      assignments.push(
        createAssignment({
          id: ++assignId,
          scheduleId: 102,
          employeeId: empId,
          template: sang,
          workDate: getOffsetDate(offset),
        })
      );
    }
  }

  return {
    baseMonday,
    weeks,
    assignments,
  };
}
