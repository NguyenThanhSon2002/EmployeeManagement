# Phase 3: Refactor 8 Màn Hình Báo Cáo/Chấm Công, Di Chuyển Fixture & Xóa Bỏ `mocks/`

**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 2.0h  
**Phạm vi file tác động:**
- `frontend/src/features/reports/components/MonthlyAttendanceReport.tsx`
- `frontend/src/features/reports/components/LateEarlyReport.tsx`
- `frontend/src/features/reports/components/ScheduledVsActualTable.tsx`
- `frontend/src/features/attendance/AttendanceOverviewPage.tsx`
- `frontend/src/features/attendance/components/AttendanceCorrectionModal.tsx`
- `frontend/src/features/leaves/LeaveRequestsPage.tsx`
- `frontend/src/features/leaves/components/LeaveApprovalModal.tsx`
- `frontend/src/features/leaves/components/LeaveRequestModal.tsx`
- `frontend/src/features/schedule/SchedulePage.tsx`
- `frontend/src/test/fixtures/shift-templates.fixture.ts` (Tạo mới)
- `frontend/src/test/a11y-audit.test.ts`
- `frontend/src/mocks/` (XÓA TOÀN BỘ)

---

## 1. Mục Tiêu Chi Tiết

1. **Refactor 8 Màn hình / Modal:**
   - Thay thế việc import `MOCK_EMPLOYEES` và `MOCK_DEPARTMENTS` bằng cách lấy từ `useDirectoryStore` (hoặc props).
   - Trong các Báo cáo (`MonthlyAttendanceReport`, `LateEarlyReport`, `ScheduledVsActualTable`): Duyệt danh sách nhân viên thật trong CSDL để tính toán thống kê.
   - Trong `SchedulePage`: Bộ lọc phòng ban lấy danh mục từ `useDirectoryStore.departments` (dữ liệu thật từ MySQL).
2. **Di chuyển Test Fixture:**
   - Tạo `frontend/src/test/fixtures/shift-templates.fixture.ts` chứa mẫu ca cần thiết cho unit test.
   - Sửa `frontend/src/test/a11y-audit.test.ts` trỏ tới file fixture này.
3. **Xóa vĩnh viễn thư mục `frontend/src/mocks/`:**
   - Xóa bỏ toàn bộ 8 file trong `frontend/src/mocks/`.
4. **Nghiệm thu toàn diện (Verification):**
   - Chạy `npm run build` trong `frontend/`: Phải biên dịch thành công 0 lỗi.
   - Chạy `npm test -- --run` trong `frontend/`: 35/35 tests phải Pass.
   - Kiểm tra UI trên trình duyệt: Toàn bộ danh sách nhân viên, phòng ban, lịch xếp ca, điểm danh đều lấy trực tiếp từ database MySQL.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] Thư mục `frontend/src/mocks/` đã bị xóa hoàn toàn.
- [ ] Không còn bất kỳ file nào trong toàn bộ dự án import từ `@/mocks`.
- [ ] `npm run build` thành công 100%.
- [ ] `npm test -- --run` đạt 35/35 tests Pass.
- [ ] Nhân viên mới tạo trong MySQL (`EMP-991` Nguyễn Thanh Sơn) xuất hiện đầy đủ trên giao diện.
