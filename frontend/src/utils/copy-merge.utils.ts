import { addDays, parseISO, format } from 'date-fns';
import type { ShiftAssignment, LeaveRequest } from '@/types/domain.types';

export interface CopyWeekOptions {
  sourceAssignments: ShiftAssignment[];
  targetAssignments: ShiftAssignment[];
  targetLeaves?: LeaveRequest[];
  daysOffset?: number; // Default 7 (next week)
  mode: 'SKIP_OCCUPIED' | 'REPLACE_ALL';
  newScheduleId: number;
}

export interface CopyWeekResult {
  mergedAssignments: ShiftAssignment[];
  copiedCount: number;
  skippedCount: number;
}

/**
 * Copies shift assignments from a source week into a target week.
 *
 * - In 'SKIP_OCCUPIED' mode:
 *   If the target week already has an assignment for ${employeeId}_${targetDate}, the source assignment is skipped.
 * - In 'REPLACE_ALL' mode:
 *   All existing target assignments are replaced with the source assignments (except approved leave days are respected).
 */
export function copyScheduleWeek(options: CopyWeekOptions): CopyWeekResult {
  const {
    sourceAssignments,
    targetAssignments,
    targetLeaves = [],
    daysOffset = 7,
    mode,
    newScheduleId,
  } = options;

  let copiedCount = 0;
  let skippedCount = 0;

  // Set of dates where employees have approved leaves
  const leaveKeys = new Set<string>();
  for (const leave of targetLeaves) {
    if (leave.status === 'APPROVED') {
      const start = parseISO(leave.startDate);
      const end = parseISO(leave.endDate);
      let curr = start;
      while (curr <= end) {
        leaveKeys.add(`${leave.employeeId}_${format(curr, 'yyyy-MM-dd')}`);
        curr = addDays(curr, 1);
      }
    }
  }

  // Map of existing assignments in the target week
  const targetMap = new Map<string, ShiftAssignment>();
  for (const a of targetAssignments) {
    if (a.status !== 'CANCELLED') {
      targetMap.set(`${a.employeeId}_${a.workDate}`, a);
    }
  }

  const resultAssignments: ShiftAssignment[] = [];
  let nextId = Math.max(0, ...sourceAssignments.map((s) => s.id), ...targetAssignments.map((t) => t.id)) + 1000;

  if (mode === 'REPLACE_ALL') {
    // In REPLACE_ALL, target assignments are wiped out unless they represent leaves
    for (const src of sourceAssignments) {
      if (src.status === 'CANCELLED') continue;

      const targetDate = format(addDays(parseISO(src.workDate), daysOffset), 'yyyy-MM-dd');
      const key = `${src.employeeId}_${targetDate}`;

      // Respect approved leave
      if (leaveKeys.has(key)) {
        skippedCount++;
        continue;
      }

      const cloned: ShiftAssignment = {
        ...src,
        id: nextId++,
        scheduleId: newScheduleId,
        workDate: targetDate,
        version: 1,
        overrideRule: null,
        overrideReason: null,
      };

      resultAssignments.push(cloned);
      copiedCount++;
    }
  } else {
    // Mode: SKIP_OCCUPIED
    // First keep all existing target assignments
    resultAssignments.push(...targetAssignments.filter((a) => a.status !== 'CANCELLED'));

    for (const src of sourceAssignments) {
      if (src.status === 'CANCELLED') continue;

      const targetDate = format(addDays(parseISO(src.workDate), daysOffset), 'yyyy-MM-dd');
      const key = `${src.employeeId}_${targetDate}`;

      // If target cell already has a shift or approved leave, skip it
      if (targetMap.has(key) || leaveKeys.has(key)) {
        skippedCount++;
      } else {
        const cloned: ShiftAssignment = {
          ...src,
          id: nextId++,
          scheduleId: newScheduleId,
          workDate: targetDate,
          version: 1,
          overrideRule: null,
          overrideReason: null,
        };
        resultAssignments.push(cloned);
        targetMap.set(key, cloned);
        copiedCount++;
      }
    }
  }

  return {
    mergedAssignments: resultAssignments,
    copiedCount,
    skippedCount,
  };
}
