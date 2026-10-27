# Journal: Brainstorm & Thiết Kế Định Biên Tối Đa Linh Hoạt (Gán Hàng Loạt vs Thủ Công)

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Tách bạch giới hạn định biên tối đa giữa thuật toán tự động hàng loạt và thao tác phân bổ thủ công.

## 1. Vấn Đề Ghi Nhận
- Sau khi triển khai khóa cứng định biên tối đa ngày 26/10, hệ thống vô hiệu hóa checkbox của các ứng viên trong Drawer khi số người đạt `maxStaffing` (ví dụ ca 1 người như Duy Anh đã chọn thì Gia Linh bị khóa xám).
- Khách hàng phản hồi: Định biên tối đa chỉ là để hạn chế việc máy tính tự động gán hàng loạt, còn trong thực tế có những ngày phát sinh đột xuất cần tăng cường thêm nhân sự. Quản lý cần quyền thêm thủ công các nhân sự phù hợp (kể cả nhân sự có cảnh báo mềm như di chuyển, nghỉ giữa ca).

## 2. Quyết Định & Giải Pháp
- **Tự động gán hàng loạt (`autoAssignShifts`)**: Duy trì nguyên tắc trần cứng, thuật toán không bao giờ tự ý xếp vượt quá `maxStaffing`.
- **Gán ca thủ công (`AssignStaffDrawer`)**:
  - Gỡ bỏ điều kiện `isCapacityReached` khóa checkbox. Chỉ khóa duy nhất khi trùng giờ ca thực tế (`isOverlapped = true`).
  - Cho phép chọn bất kỳ nhân sự phù hợp hoặc nhân sự có cảnh báo mềm.
  - Tự động đính kèm lý do đặc cách tăng cường khi lưu để người dùng thao tác nhanh gọn.
- **Backend (`StaffingCapacityRule`)**:
  - Chuyển `ERR_STAFFING_CAPACITY` (mức `MANDATORY`) thành `WARN_STAFFING_CAPACITY` (mức `WARNING`).
  - Cho phép `assignSingleShift` ghi nhận hợp lệ khi có lý do giải trình.
- **Hiển thị trực quan (`ShiftGridCell`)**:
  - Khi ca có `2/1 NV`, hiển thị huy hiệu Xanh dương/Tím linh hoạt kèm icon `Users` và nhãn `[2/1 NV - Tăng cường]` thay vì màu đỏ báo lỗi vi phạm.

## 3. Tài Liệu Đã Lập
- Báo cáo brainstorm: [`plans/reports/261027-0830-brainstorm-flexible-staffing-quota.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-0830-brainstorm-flexible-staffing-quota.md).
- Kế hoạch thực hiện: [`plans/261027-0830-flexible-staffing-quota/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-0830-flexible-staffing-quota/plan.md).
  - [Phase 01: Backend Staffing Rule Soft Warning & Single Shift Override](file:///D:/Project/Employee%20Management/plans/261027-0830-flexible-staffing-quota/phase-01-backend-staffing-rule-soft-warning.md)
  - [Phase 02: Frontend Unlock Candidate Checkboxes & Default Override in AssignStaffDrawer](file:///D:/Project/Employee%20Management/plans/261027-0830-flexible-staffing-quota/phase-02-frontend-drawer-unlock-and-override.md)
  - [Phase 03: Frontend Flexible Capacity Styling on Matrix Grid & Verification](file:///D:/Project/Employee%20Management/plans/261027-0830-flexible-staffing-quota/phase-03-frontend-grid-capacity-badge.md)

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Backend:**
  - [`StaffingCapacityRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/StaffingCapacityRule.java): Chuyển thành `WARN_STAFFING_CAPACITY` (`WARNING`).
  - Biên dịch `mvn test-compile` thành công 100%.
- **Frontend:**
  - [`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx): Gỡ bỏ hoàn toàn việc khóa checkbox do định biên tối đa. Checkbox chỉ bị khóa khi trùng giờ (`isOverlapped`). Tự động gắn lý do đặc cách tăng cường khi lưu. Header Drawer cập nhật nhãn `✓ Đã bổ sung (X/Y NV - Tăng cường)`.
  - [`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx): Đổi giao diện ô ca khi vượt định biên sang tông màu Xanh dương (`#EFF6FF` / `#1D4ED8`) kèm icon `Users` và tooltip thân thiện.
  - Biên dịch `npm run build` thành công 100% (0 lỗi TypeScript / Vite).
