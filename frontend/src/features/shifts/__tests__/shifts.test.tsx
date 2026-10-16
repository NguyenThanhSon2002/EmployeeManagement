import { describe, it, expect, beforeEach } from 'vitest';
import { useScheduleStore } from '@/features/schedule/store/useScheduleStore';

describe('TSK-D01: Shift Templates CRUD & Snapshot Isolation (SCR-10)', () => {
  beforeEach(() => {
    useScheduleStore.getState().resetDemoData();
  });

  it('creates a new shift template and makes it available', () => {
    const initialCount = useScheduleStore.getState().shiftTemplates.length;
    
    useScheduleStore.getState().addShiftTemplate({
      shiftCode: 'CA-TOI',
      shiftName: 'Ca Tối Tăng Cường',
      startTime: '18:00',
      endTime: '23:00',
      breakMinutes: 30,
      isCrossMidnight: false,
      colorCode: '#FFF0F6',
      textColor: '#C41D7F',
      minStaffing: 1,
      maxStaffing: 3,
      applicableDays: '1,2,3,4,5,6,7',
      isActive: true,
    });

    const templates = useScheduleStore.getState().shiftTemplates;
    expect(templates.length).toBe(initialCount + 1);
    const added = templates.find((t) => t.shiftCode === 'CA-TOI');
    expect(added).toBeDefined();
    expect(added?.shiftName).toBe('Ca Tối Tăng Cường');
  });

  it('protects past assignments snapshots when a shift template is modified (Snapshot Isolation)', () => {
    // 1. Assign CA-SANG to an employee
    const mondayStr = useScheduleStore.getState().currentStartDate;
    const assignRes = useScheduleStore.getState().assignShift({
      employeeId: 1,
      workShiftId: 1, // CA-SANG: 08:00 - 17:00
      workDate: mondayStr,
      actorRole: 'ROLE_ADMIN',
    });
    expect(assignRes.success).toBe(true);

    const assignmentKey = `1_${mondayStr}`;
    const savedAssignment = useScheduleStore.getState().assignments[assignmentKey];
    expect(savedAssignment.snapshotStartTime).toBe('08:00');
    expect(savedAssignment.snapshotShiftName).toBe('Ca Sáng Tiêu Chuẩn');

    // 2. Modify template CA-SANG to start at 08:30
    useScheduleStore.getState().updateShiftTemplate(1, {
      shiftName: 'Ca Sáng Mới (08:30)',
      startTime: '08:30',
    });

    // 3. Verify template is modified
    const modifiedTemplate = useScheduleStore.getState().shiftTemplates.find((t) => t.id === 1);
    expect(modifiedTemplate?.startTime).toBe('08:30');

    // 4. Verify existing assignment STILL preserves original snapshot (08:00)
    const unchangedAssignment = useScheduleStore.getState().assignments[assignmentKey];
    expect(unchangedAssignment.snapshotStartTime).toBe('08:00');
    expect(unchangedAssignment.snapshotShiftName).toBe('Ca Sáng Tiêu Chuẩn');
  });
});
