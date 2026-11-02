# Journal Entry: Fix Weekly Hours Table Bug and Sync to Main

- **Date**: 2026-11-02 17:21 (UTC+7)
- **Commit**: `3e0aff6`
- **Branches**: `dev`, `main` (synchronized with `origin`)

---

## 1. Summary of Changes

### A. Employee Weekly Hours Summary Table Fix
- **Issue**: All employees in `EmployeeWeeklyHoursTable.tsx` displayed `0 ca`, `0.0h`, and day columns displayed `-`, despite valid active assignments on the weekly schedule.
- **Root Cause**: An inverted status filter `if (a.status !== 'CANCELLED') return false;` inside the day shift filter predicate discarded all valid active assignments (e.g. `ASSIGNED`, `PUBLISHED`, `DRAFT`).
- **Fix**:
  - Corrected rejection condition to `if (a.status === 'CANCELLED') return false;`.
  - Added numeric normalization for employee IDs (`Number(a.employeeId) !== Number(emp.id)`).
  - Added date string normalization (`String(a.workDate).split('T')[0] !== dateStr`).
  - Added multi-field case-insensitive shift matching (`shiftCode`, `shiftName`, `snapshotShiftName`).
  - Hardened `sumWeeklyScheduledHours` in `schedule-calc.utils.ts` against ISO timestamp parsing (`Invalid Date` / `NaN`).
  - Synced date and filter matching in `SchedulePage.tsx` and `MonthViewGrid.tsx`.

### B. UI Refinements
- Removed employee name badge colors per user request.
- Removed average hours per employee indicator `(TB: Xh/người)` per user request.
- Enabled shift template color clearing/removal in shift configuration modal and cards.
- Enabled shift colors to render properly in schedule cells.

### C. Backend Persistence & Validation
- Migrated attendance corrections and leave requests to real database persistence with full CRUD, approvals, and pagination.
- Added LeetCode #56 interval deduplication (`IntervalMergeUtils.java` and `calculateDeduplicatedNetHours`) for handover shifts.
- Fixed shift template unique constraint with soft-delete awareness (`V22`) and nullable colors (`V23`).

---

## 2. Git Operations
- Committed to `dev` with message: `feat(schedule,attendance,leaves): real data persistence, handover merge, and weekly hours table fix`.
- Pushed to `origin/dev`.
- Fast-forward merged into `main`.
- Pushed to `origin/main`.
- Returned working branch to `dev`.
