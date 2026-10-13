import type { ShiftAssignment } from '@/types/domain.types';

/**
 * Result of shift duration calculation
 */
export interface ShiftDurations {
  grossHours: number; // Total scheduled duration from start to end
  netHours: number;   // Gross duration minus unpaid break time
  nightHours: number; // Hours worked within the legal night window (22:00 - 06:00)
}

/**
 * Parses time string ("HH:mm:ss" or "HH:mm") into total minutes from start of day (0 to 1440).
 * Supports "24:00" -> 1440.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Calculates total minutes overlapping with the Vietnamese Labor Code night window (22:00 - 06:00).
 * Handles both standard day shifts and cross-midnight overnight shifts.
 */
export function calculateNightWindowMinutes(startMin: number, endMin: number): number {
  if (startMin >= endMin) return 0;

  // Night windows:
  // 1. Day 0 morning: 00:00 (0) - 06:00 (360)
  // 2. Day 0 night to Day 1 morning: 22:00 (1320) - 06:00 (+1) (1800)
  // 3. Day 1 night: 22:00 (+1) (2760) - 06:00 (+2) (3240)
  const nightWindows: Array<[number, number]> = [
    [0, 360],
    [1320, 1800],
    [2760, 3240],
  ];

  let totalNightMinutes = 0;

  for (const [winStart, winEnd] of nightWindows) {
    const overlapStart = Math.max(startMin, winStart);
    const overlapEnd = Math.min(endMin, winEnd);
    if (overlapStart < overlapEnd) {
      totalNightMinutes += (overlapEnd - overlapStart);
    }
  }

  return totalNightMinutes;
}

/**
 * Calculates Gross, Net, and Night work hours for a shift.
 * Rounds to 1 or 2 decimal places to ensure floating point accuracy.
 */
export function calculateShiftDurations(
  startTimeStr: string,
  endTimeStr: string,
  breakMinutes: number = 0,
  isCrossMidnight: boolean = false
): ShiftDurations {
  const startMin = parseTimeToMinutes(startTimeStr);
  let endMin = parseTimeToMinutes(endTimeStr);

  if (isCrossMidnight) {
    endMin += 1440; // Shift finishes on the next calendar day
  } else if (endMin < startMin) {
    // Implicit overnight protection if flag was missed
    endMin += 1440;
  }

  const durationMinutes = Math.max(0, endMin - startMin);
  const grossHours = Math.round((durationMinutes / 60) * 100) / 100;

  const netMinutes = Math.max(0, durationMinutes - breakMinutes);
  const netHours = Math.round((netMinutes / 60) * 100) / 100;

  const nightMinutes = calculateNightWindowMinutes(startMin, endMin);
  const nightHours = Math.round((nightMinutes / 60) * 100) / 100;

  return { grossHours, netHours, nightHours };
}

/**
 * Sums the total scheduled net hours for an employee across given assignments.
 */
export function sumWeeklyScheduledHours(assignments: ShiftAssignment[]): number {
  let total = 0;
  for (const a of assignments) {
    if (a.status === 'CANCELLED') continue;
    const { netHours } = calculateShiftDurations(
      a.snapshotStartTime,
      a.snapshotEndTime,
      a.snapshotBreakMinutes,
      a.snapshotCrossMidnight
    );
    total += netHours;
  }
  return Math.round(total * 100) / 100;
}
