import { describe, it, expect } from 'vitest';
import {
  getCurrentMonday,
  getWeekDays,
  formatDateVi,
  formatDateIso,
  formatTimeVi,
  getDayOfWeekVi,
  getDayShortVi,
  isSameDayIso,
  parseIsoDate,
  offsetWeeks,
} from '../date.utils';

describe('date.utils', () => {
  it('getCurrentMonday returns Monday of current week', () => {
    // 2026-10-20 is a Tuesday
    const date = new Date(2026, 9, 20); // Month is 0-indexed: 9 = October
    const monday = getCurrentMonday(date);
    expect(monday.getDay()).toBe(1);
    expect(formatDateIso(monday)).toBe('2026-10-19');
  });

  it('getWeekDays returns 7 consecutive days', () => {
    const monday = new Date(2026, 9, 19);
    const days = getWeekDays(monday);
    expect(days).toHaveLength(7);
    expect(formatDateIso(days[0])).toBe('2026-10-19');
    expect(formatDateIso(days[6])).toBe('2026-10-25');
  });

  it('formatDateVi formats date to dd/MM/yyyy', () => {
    const date = new Date(2026, 9, 20);
    expect(formatDateVi(date)).toBe('20/10/2026');
    expect(formatDateVi('2026-10-20')).toBe('20/10/2026');
  });

  it('formatDateIso formats date to yyyy-MM-dd', () => {
    const date = new Date(2026, 9, 20);
    expect(formatDateIso(date)).toBe('2026-10-20');
  });

  it('formatTimeVi normalizes HH:mm:ss to HH:mm', () => {
    expect(formatTimeVi('08:30:00')).toBe('08:30');
    expect(formatTimeVi('8:5')).toBe('08:05');
    expect(formatTimeVi('')).toBe('');
  });

  it('getDayOfWeekVi and getDayShortVi return correct Vietnamese day names for all 7 days', () => {
    const days = [
      { date: new Date(2026, 9, 19), full: 'Thứ Hai', short: 'T2' },
      { date: new Date(2026, 9, 20), full: 'Thứ Ba', short: 'T3' },
      { date: new Date(2026, 9, 21), full: 'Thứ Tư', short: 'T4' },
      { date: new Date(2026, 9, 22), full: 'Thứ Năm', short: 'T5' },
      { date: new Date(2026, 9, 23), full: 'Thứ Sáu', short: 'T6' },
      { date: new Date(2026, 9, 24), full: 'Thứ Bảy', short: 'T7' },
      { date: new Date(2026, 9, 25), full: 'Chủ Nhật', short: 'CN' },
    ];

    for (const d of days) {
      expect(getDayOfWeekVi(d.date)).toBe(d.full);
      expect(getDayShortVi(d.date)).toBe(d.short);
    }
  });

  it('isSameDayIso checks same calendar day correctly with strings and Date objects', () => {
    expect(isSameDayIso('2026-10-20T08:00:00', '2026-10-20T14:00:00')).toBe(true);
    expect(isSameDayIso(new Date(2026, 9, 20), '2026-10-20')).toBe(true);
    expect(isSameDayIso(new Date(2026, 9, 20), new Date(2026, 9, 20))).toBe(true);
    expect(isSameDayIso('2026-10-20', '2026-10-21')).toBe(false);
  });

  it('parseIsoDate safely parses ISO date string to Date object', () => {
    const parsed = parseIsoDate('2026-10-20');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(20);
  });

  it('offsetWeeks offsets date by weeks including zero offset', () => {
    const monday = new Date(2026, 9, 19);
    expect(formatDateIso(offsetWeeks(monday, 0))).toBe('2026-10-19');
    expect(formatDateIso(offsetWeeks(monday, 1))).toBe('2026-10-26');
    expect(formatDateIso(offsetWeeks(monday, -1))).toBe('2026-10-12');
  });
});
