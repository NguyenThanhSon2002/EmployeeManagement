# Planning Journal: Hide Employee Weekly Hours Summary Table for Employee Role

- **Thời gian:** 27/10/2026 13:51 (Local Time)
- **Chủ đề:** Ẩn Bảng Tổng Hợp Giờ Công Nhân Viên Trong Tuần (`EmployeeWeeklyHoursTable`) đối với vai trò `ROLE_EMPLOYEE`.
- **Trạng thái:** Kế hoạch đã hoàn thành, sẵn sàng thực hiện.

## 1. Tóm tắt yêu cầu & Thống nhất thiết kế
- Ẩn hoàn toàn bảng tổng hợp giờ công chi tiết ở cuối trang lịch đối với nhân viên để bảo mật dữ liệu năng suất/giờ làm việc nội bộ.
- Bảng này chỉ hiển thị cho Giám đốc (`ROLE_DIRECTOR`) và Quản lý chi nhánh (`ROLE_MANAGER`).
- Giữ nguyên 4 thẻ chỉ số tóm tắt chung trên đầu trang lịch.

## 2. Danh sách file kế hoạch
- Kế hoạch tổng thể: [`plans/261027-1351-hide-employee-hours-table/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1351-hide-employee-hours-table/plan.md)
- Phase 01: [`phase-01-role-guard-hours-table.md`](file:///D:/Project/Employee%20Management/plans/261027-1351-hide-employee-hours-table/phase-01-role-guard-hours-table.md)
- Phase 02: [`phase-02-verification.md`](file:///D:/Project/Employee%20Management/plans/261027-1351-hide-employee-hours-table/phase-02-verification.md)

## 3. Quá trình triển khai & Kết quả
- **Thay đổi thực hiện:**
  - Trong [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx):
    - Bọc component `<EmployeeWeeklyHoursTable ... />` trong điều kiện `{currentRole !== 'ROLE_EMPLOYEE' && (...)}`.
    - Khi đăng nhập vai trò Nhân viên (`ROLE_EMPLOYEE`), bảng tổng hợp giờ công chi tiết của tất cả nhân sự ở cuối trang sẽ hoàn toàn không xuất hiện.
    - Giữ nguyên hiển thị 4 thẻ chỉ số thống kê tổng quan chung (`ScheduleSummaryCards`) trên đầu trang.
    - Với Giám đốc (`ROLE_DIRECTOR`) và Quản lý (`ROLE_MANAGER`), bảng vẫn hiển thị đầy đủ và hoạt động bình thường.
- **Kiểm thử:**
  - Chạy `npm run build` -> Thành công sạch sẽ 100%, 0 lỗi TypeScript linting.
