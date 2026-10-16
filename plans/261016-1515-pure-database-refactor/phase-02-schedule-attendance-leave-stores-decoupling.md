# Phase 2: Khử Khởi Tạo Mock Trong Schedule, Attendance & Leave Stores

**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 2.0h  
**Phạm vi file tác động:**
- `frontend/src/features/schedule/store/useScheduleStore.ts`
- `frontend/src/features/attendance/store/useAttendanceStore.ts`
- `frontend/src/features/leaves/store/useLeaveStore.ts`

---

## 1. Mục Tiêu Chi Tiết

1. **Refactor `useScheduleStore.ts`:**
   - Xóa bỏ các import:
     - `MOCK_EMPLOYEES`
     - `MOCK_SHIFT_TEMPLATES`
     - `getMockLeaves`
     - `getMockHolidays`
     - `generateDeterministicSeedData`
   - Loại bỏ hàm `initializeStateFromSeed()`.
   - Khởi tạo initial state rỗng:
     - `assignments: {}`
     - `conflicts: {}`
     - `employees: []`
     - `shiftTemplates: []`
     - `approvedLeaves: []`
     - `holidays: []`
   - Đảm bảo hàm `fetchWeeklySchedule(departmentId, startDate)`:
     - Gọi `scheduleService.getWeeklySchedule()`.
     - Nạp ca mẫu thực tế `shift_templates` và danh sách nhân sự trực thuộc phòng ban từ MySQL.
     - Nếu tuần đó chưa có ca nào trong DB, hiển thị lưới trống với các nhân viên thật của phòng ban để quản lý xếp ca mới.
2. **Refactor `useAttendanceStore.ts`:**
   - Xóa bỏ `import { getMockAttendanceRecords, MOCK_ATTENDANCE_CORRECTIONS }`.
   - Initial state: `records: []`, `corrections: []`.
   - Khi vào trang chấm công, tự động gọi `fetchRecords(selectedDate, departmentFilter)` lấy từ API Spring Boot.
3. **Refactor `useLeaveStore.ts`:**
   - Xóa bỏ `import { getMockLeaves }`.
   - Initial state: `leaves: []`, `balances: {}`.
   - Nạp dữ liệu qua `fetchLeaves()`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] Cả 3 store không còn bất kỳ dòng import nào từ `mocks/`.
- [ ] Dữ liệu hiển thị trên màn hình Xếp ca, Chấm công, Nghỉ phép hoàn toàn là dữ liệu thực từ MySQL.
- [ ] Gán ca, check-in, duyệt đơn nghỉ phép được lưu trực tiếp vào CSDL MySQL mà không bị ghi đè bởi dữ liệu seed ảo.
