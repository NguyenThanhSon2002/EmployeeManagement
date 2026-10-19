import { describe, it, expect, beforeEach } from 'vitest';
import { useAvailabilityStore } from '../store/useAvailabilityStore';

describe('useAvailabilityStore & Shift Availability Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    useAvailabilityStore.getState().resetToDemoDefaults();
  });

  it('loads default demo dataset with expected values for demo employees', () => {
    const store = useAvailabilityStore.getState();
    const emp1 = store.getAvailability(1);

    // EMP 1: Has Ca Sáng (1) & Ca Chiều (2) on Monday to Friday (days 1..5)
    expect(emp1[1]).toContain(1);
    expect(emp1[1]).toContain(2);
    expect(emp1[5]).toContain(1);
    expect(emp1[6]).toEqual([]); // Saturday off
    expect(emp1[7]).toEqual([]); // Sunday off

    // EMP 5: Weekend worker (days 6 and 7)
    const emp5 = store.getAvailability(5);
    expect(emp5[1]).toEqual([]);
    expect(emp5[6]).toContain(1);
    expect(emp5[7]).toContain(3);
  });

  it('correctly checks isAvailable query for various shifts and days', () => {
    const store = useAvailabilityStore.getState();

    // EMP 1: Monday (day 1) - Morning (shift 1) => true
    expect(store.isAvailable(1, 1, 1)).toBe(true);
    // EMP 1: Monday (day 1) - Evening (shift 3) => false
    expect(store.isAvailable(1, 1, 3)).toBe(false);
    // EMP 1: Saturday (day 6) - Morning (shift 1) => false
    expect(store.isAvailable(1, 6, 1)).toBe(false);

    // EMP 3: Morning shift on Monday to Saturday
    expect(store.isAvailable(3, 1, 1)).toBe(true);
    expect(store.isAvailable(3, 6, 1)).toBe(true);
    expect(store.isAvailable(3, 7, 1)).toBe(false);
  });

  it('returns matching employee IDs for a specific day and shift', () => {
    const store = useAvailabilityStore.getState();

    // Monday (day 1), Ca Sáng (shift 1): EMP 1, 3, 6, 8 have Ca Sáng
    const availableForMondayMorning = store.getAvailableEmployeeIds(1, 1);
    expect(availableForMondayMorning).toContain(1);
    expect(availableForMondayMorning).toContain(3);
    expect(availableForMondayMorning).toContain(6);
    expect(availableForMondayMorning).toContain(8);
    expect(availableForMondayMorning).not.toContain(2);
    expect(availableForMondayMorning).not.toContain(4);
    expect(availableForMondayMorning).not.toContain(5);

    // Sunday (day 7), Ca Tối (shift 3): EMP 2, 4, 5
    const availableForSundayNight = store.getAvailableEmployeeIds(7, 3);
    expect(availableForSundayNight).toContain(2);
    expect(availableForSundayNight).toContain(4);
    expect(availableForSundayNight).toContain(5);
    expect(availableForSundayNight).not.toContain(1);
    expect(availableForSundayNight).not.toContain(3);
  });

  it('correctly toggles shift availability on and off', () => {
    const store = useAvailabilityStore.getState();

    // Initially EMP 1 is not available on Saturday (day 6) for shift 1
    expect(store.isAvailable(1, 6, 1)).toBe(false);

    // Toggle ON
    store.toggleShiftAvailability(1, 6, 1);
    expect(useAvailabilityStore.getState().isAvailable(1, 6, 1)).toBe(true);

    // Toggle OFF
    store.toggleShiftAvailability(1, 6, 1);
    expect(useAvailabilityStore.getState().isAvailable(1, 6, 1)).toBe(false);
  });

  it('supports setting an entire shift for the week with setShiftForWeek', () => {
    const store = useAvailabilityStore.getState();

    // Enable Shift 3 for EMP 1 across all 7 days
    store.setShiftForWeek(1, 3, true);
    for (let d = 1; d <= 7; d++) {
      expect(useAvailabilityStore.getState().isAvailable(1, d, 3)).toBe(true);
    }

    // Disable Shift 3 for EMP 1 across all 7 days
    store.setShiftForWeek(1, 3, false);
    for (let d = 1; d <= 7; d++) {
      expect(useAvailabilityStore.getState().isAvailable(1, d, 3)).toBe(false);
    }
  });

  it('supports clearing all availability with clearAllAvailability', () => {
    const store = useAvailabilityStore.getState();
    store.clearAllAvailability(1);

    const cleared = useAvailabilityStore.getState().getAvailability(1);
    for (let d = 1; d <= 7; d++) {
      expect(cleared[d]).toEqual([]);
    }
  });

  it('simulates AssignStaffDrawer availability filtering accurately', () => {
    const store = useAvailabilityStore.getState();
    const workDate = '2026-10-19'; // Monday
    const dateObj = new Date(workDate + 'T00:00:00');
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    expect(dayOfWeek).toBe(1); // Monday

    const shiftTemplateId = 1; // Ca Sáng

    const employees = [
      { id: 1, fullName: 'Nguyễn Văn An' },
      { id: 2, fullName: 'Trần Thị Bình' },
      { id: 3, fullName: 'Lê Hoàng Cường' },
      { id: 4, fullName: 'Phạm Thu Dung' },
    ];

    // Status mapping simulation
    const statusList = employees.map((emp) => ({
      emp,
      isAvailableForShift: store.isAvailable(emp.id, dayOfWeek, shiftTemplateId),
      isAlreadyInThisShift: emp.id === 2, // suppose emp 2 was already assigned earlier
    }));

    // In 'AVAILABLE' mode: should include employees who are available OR already assigned
    const availableModeList = statusList.filter(
      (item) => item.isAvailableForShift || item.isAlreadyInThisShift
    );

    // Emp 1 (available), Emp 2 (already assigned even if unavailable), Emp 3 (available)
    expect(availableModeList.map((i) => i.emp.id)).toEqual([1, 2, 3]);
    // Emp 4 is not available and not assigned => excluded from 'AVAILABLE' mode
    expect(availableModeList.find((i) => i.emp.id === 4)).toBeUndefined();

    // In 'ALL' mode: all 4 appear
    expect(statusList.length).toBe(4);
    // Emp 4 has isAvailableForShift === false
    const emp4Status = statusList.find((i) => i.emp.id === 4);
    expect(emp4Status?.isAvailableForShift).toBe(false);
  });
});
