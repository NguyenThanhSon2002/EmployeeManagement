import { describe, it, expect } from 'vitest';
import { calculateShiftDurations } from '../schedule-calc.utils';

describe('Suite 1: Shift Duration & Night Hours Calculation (schedule-calc.utils)', () => {
  it('TC-CALC-01: Ca hành chính chuẩn có nghỉ trưa (08:00 - 17:00, break 60m)', () => {
    const result = calculateShiftDurations('08:00', '17:00', 60, false);
    expect(result).toEqual({
      grossHours: 9.0,
      netHours: 8.0,
      nightHours: 0.0,
    });
  });

  it('TC-CALC-02: Ca không nghỉ giữa ca (06:00 - 14:00, break 0m)', () => {
    const result = calculateShiftDurations('06:00', '14:00', 0, false);
    expect(result).toEqual({
      grossHours: 8.0,
      netHours: 8.0,
      nightHours: 0.0,
    });
  });

  it('TC-CALC-03: Ca qua đêm trọn vẹn khung giờ đêm (22:00 - 06:00, break 0m, crossMidnight=true)', () => {
    const result = calculateShiftDurations('22:00', '06:00', 0, true);
    expect(result).toEqual({
      grossHours: 8.0,
      netHours: 8.0,
      nightHours: 8.0,
    });
  });

  it('TC-CALC-04: Ca tối có 2 giờ làm việc ban đêm (16:00 - 24:00, break 30m)', () => {
    const result = calculateShiftDurations('16:00', '24:00', 30, false);
    expect(result).toEqual({
      grossHours: 8.0,
      netHours: 7.5,
      nightHours: 2.0,
    });
  });

  it('TC-CALC-05: Ca ngắn bán thời gian 4 tiếng (18:00 - 22:00, break 0m)', () => {
    const result = calculateShiftDurations('18:00', '22:00', 0, false);
    expect(result).toEqual({
      grossHours: 4.0,
      netHours: 4.0,
      nightHours: 0.0,
    });
  });
});
