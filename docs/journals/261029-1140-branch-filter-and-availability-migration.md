# Journal: Bộ lọc chi nhánh trên lịch khả dụng & Tự động remap ca khi đổi chi nhánh

- **Thời gian:** 2026-10-29 11:56:00
- **Tác giả:** Antigravity AI
- **Kế hoạch tham chiếu:** `plans/261029-1140-branch-filter-and-availability-migration/plan.md`

## 1. Vấn đề giải quyết
1. Khi nhân viên (cụ thể `EMP-002 Nguyễn Xuân Tài`) chuyển từ Chi nhánh Cầu Giấy (`branch_id = 1`) sang Đống Đa (`branch_id = 2`), lịch phân ca đã được chuyển (`shift_assignments`), nhưng các ca khả dụng (`employee_availabilities`) và ca ưu tiên (`employee_preferred_shifts`) vẫn giữ `work_shift_id` của Cầu Giấy (1, 2, 3, 4).
2. Tab "Lịch Khả Dụng / Đăng Ký Ca" tải mẫu ca của Đống Đa (5, 6, 7, 8). Do không trùng khớp ID nên ma trận không hiển thị ca nào (toàn dấu `-`), nhưng badge trên đầu trang vẫn đếm "4 ca khả dụng/tuần".
3. Chưa có bộ lọc chi nhánh để quản lý và nhân sự chuyển đổi giữa chi nhánh chính và các chi nhánh kiêm nhiệm.

## 2. Giải pháp thực hiện
- **Database (Flyway V20):**
  - Tạo `V20__remap_transferred_employees_availabilities.sql`: Remap an toàn các ca đăng ký cũ của nhân viên đã chuyển chi nhánh chính sang mẫu ca tương ứng ở chi nhánh mới theo `shift_code`. Có bước xử lý trùng lặp để ngăn lỗi duplicate key `uq_emp_shift_day`.
- **Backend:**
  - `EmployeeService.java`: Bổ sung `migrateEmployeeAvailabilityToNewBranch()` và `findMatchingWorkShift()` dùng chung khi điều chuyển nhân sự.
  - `EmployeeAvailabilityRepository.java` & `EmployeePreferredShiftRepository.java`: Thêm `deleteAllByEmployeeIdAndBranchId()` và `findAllByEmployeeIdAndBranchId()`.
  - `EmployeeAvailabilityService.java`: Hỗ trợ lưu lịch khả dụng có phạm vi theo từng chi nhánh (`branch_id`), tránh ghi đè dữ liệu của các chi nhánh khác.
  - `EmployeeAvailabilityController.java`: Chuẩn hóa `@PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")`.
- **Frontend:**
  - `EmployeeDetailPage.tsx`: Chuẩn bị danh sách `assignedBranches` (chi nhánh chính và kiêm nhiệm) truyền vào tab.
  - `EmployeeAvailabilityTab.tsx`: Bổ sung Dropdown chọn chi nhánh trên thanh công cụ.
  - Sửa công thức đếm badge `totalSlots` và `preferredSlotsCount` chỉ đếm theo các mẫu ca của chi nhánh đang chọn.
  - `useAvailabilityStore.ts`: Gửi kèm `branch_id` khi lưu lịch.

## 3. Kết quả xác thực
- Flyway Migration V20 thực thi thành công, dữ liệu `EMP-002` trỏ đúng vào Ca Đêm Đống Đa (`work_shift_id = 8`).
- Backend unit test `EmployeeBranchTransferTest` chạy đạt 100%.
- Frontend build `npm run build` thành công không lỗi TypeScript.
