import { startOfWeek, addDays, format, parseISO, isSameDay } from 'date-fns';

/**
 * Returns the Monday Date object of the week containing referenceDate.
 * Defaults to current date if referenceDate is omitted.
 */
export function getCurrentMonday(referenceDate: Date = new Date()): Date {
  return startOfWeek(referenceDate, { weekStartsOn: 1 });
}

/**
 * Returns an array of 7 Date objects from Monday (index 0) to Sunday (index 6).
 */
export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/**
 * Formats a Date or ISO string into Vietnamese standard display: "dd/MM/yyyy".
 */
export function formatDateVi(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
}

/**
 * Formats a Date into standard ISO date string: "yyyy-MM-dd".
 */
export function formatDateIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Normalizes time string ("HH:mm:ss" or "HH:mm") into "HH:mm".
 */
export function formatTimeVi(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

/**
 * Returns full Vietnamese day name ("Thứ Hai", "Thứ Ba", ..., "Chủ Nhật").
 */
export function getDayOfWeekVi(date: Date): string {
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  switch (day) {
    case 1: return 'Thứ Hai';
    case 2: return 'Thứ Ba';
    case 3: return 'Thứ Tư';
    case 4: return 'Thứ Năm';
    case 5: return 'Thứ Sáu';
    case 6: return 'Thứ Bảy';
    case 0: return 'Chủ Nhật';
    default: return '';
  }
}

/**
 * Returns short Vietnamese day name ("T2", "T3", ..., "CN").
 */
export function getDayShortVi(date: Date): string {
  const day = date.getDay();
  switch (day) {
    case 1: return 'T2';
    case 2: return 'T3';
    case 3: return 'T4';
    case 4: return 'T5';
    case 5: return 'T6';
    case 6: return 'T7';
    case 0: return 'CN';
    default: return '';
  }
}

/**
 * Checks if two date inputs (Date or ISO string) represent the exact same calendar day.
 */
export function isSameDayIso(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}

/**
 * Safely parses an ISO date string to Date object.
 */
export function parseIsoDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Offsets a date by a number of weeks.
 */
export function offsetWeeks(baseDate: Date, weeks: number): Date {
  return addDays(baseDate, weeks * 7);
}
