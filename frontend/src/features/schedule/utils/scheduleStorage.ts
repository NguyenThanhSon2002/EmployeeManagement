import type { ShiftAssignment } from '@/types/domain.types';

export const STORAGE_PREFIX = 'EMS_SCHEDULES_BRANCH_';

/**
 * Normalizes raw localStorage or API data into Record<string, ShiftAssignment[]>
 */
export function normalizeAssignmentsMap(map: Record<string, any>): Record<string, ShiftAssignment[]> {
  const normalized: Record<string, ShiftAssignment[]> = {};
  for (const [key, val] of Object.entries(map || {})) {
    if (Array.isArray(val)) {
      normalized[key] = val;
    } else if (val && typeof val === 'object') {
      normalized[key] = [val as ShiftAssignment];
    }
  }
  return normalized;
}

export function loadBranchScheduleFromStorage(branchId: number, startDate?: string): Record<string, ShiftAssignment[]> {
  try {
    const key = startDate ? `${STORAGE_PREFIX}${branchId}_${startDate}` : `${STORAGE_PREFIX}${branchId}`;
    let raw = localStorage.getItem(key);
    if (!raw && startDate) {
      // Fallback to legacy/general branch cache if week-specific key doesn't exist yet
      raw = localStorage.getItem(`${STORAGE_PREFIX}${branchId}`);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return normalizeAssignmentsMap(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to load schedule from localStorage:', err);
  }
  return {};
}

export function saveBranchScheduleToStorage(
  branchId: number,
  assignments: Record<string, ShiftAssignment[]>,
  startDate?: string
): void {
  try {
    const key = startDate ? `${STORAGE_PREFIX}${branchId}_${startDate}` : `${STORAGE_PREFIX}${branchId}`;
    localStorage.setItem(key, JSON.stringify(assignments));
  } catch (err) {
    console.warn('Failed to save schedule to localStorage:', err);
  }
}
