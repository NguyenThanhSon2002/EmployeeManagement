# Journal: Khắc Phục Lỗi Vượt Trần Định Biên Khi Gán Ca (2/1 NV)

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Kiểm soát định biên tối đa (`maxStaffing`) trong quản lý ca làm việc chi nhánh.

## 1. Vấn Đề Ghi Nhận
- Tại ô Ca Tối Thứ Hai (19/10/2026), mẫu ca định biên 1 - 1 NV nhưng bị gán 2 nhân viên (Nguyễn Xuân Tài và Thanh Tâm), hiển thị `2/1 NV`.
- Nguyên nhân:
  - Drawer gán ca thủ công (`AssignStaffDrawer`) chỉ kiểm tra trùng giờ (`hasOverlap`), cho phép tick chọn nhân viên không giới hạn mà không kiểm tra `maxStaffing`.
  - Backend `StaffingCapacityRule` đặt mức cảnh báo `WARNING` thay vì `MANDATORY`, khi client gửi kèm `overrideReason` tự động thì backend chấp nhận lưu vào CSDL.
  - Ô ca trên lưới (`ShiftGridCell`) chỉ kiểm tra `count >= minStaffing` nên hiển thị màu xanh lá đạt chuẩn thay vì cảnh báo đỏ khi vượt trần.
  - Ca cũ `id: 42` (Nguyễn Xuân Tài) vốn không đăng ký rảnh Thứ Hai nhưng tồn tại từ trước, sau đó Thanh Tâm được gán thêm vào.

## 2. Quyết Định Thống Nhất
- **Khóa chọn quá định biên trong `AssignStaffDrawer`**: Nếu số lượng đã chọn đạt `maxStaffing`, vô hiệu hóa checkbox của các nhân sự chưa chọn kèm thông báo "Ca đã đủ định biên tối đa (X nhân sự)".
- **Đổi màu cảnh báo trên lưới (`ShiftGridCell`)**: Nếu `currentCount > maxStaffing`, đổi huy hiệu sang màu Đỏ Cảnh Báo (`#FEF2F2` / `#DC2626`) và icon cảnh báo.
- **Backend chặn cứng trần định biên (`StaffingCapacityRule`)**: Chuyển `WARN_STAFFING_CAPACITY` thành lỗi chặn cứng hoặc kiểm tra trần nghiêm ngặt trong `assignSingleShift`.
- **Dọn dẹp ca thừa hiện tại**: Xóa bản ghi `id: 42` của Nguyễn Xuân Tài (không đăng ký rảnh Thứ Hai) tại ô Ca Tối 19/10, giữ lại Thanh Tâm (`1/1 NV`).

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261026-1413-brainstorm-fix-shift-quota-over-capacity.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1413-brainstorm-fix-shift-quota-over-capacity.md).
- Kế hoạch tổng thể: [`plans/261026-1416-fix-shift-quota-over-capacity/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1416-fix-shift-quota-over-capacity/plan.md).

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Backend**:
  - Đã dọn dẹp phân ca thừa `id: 42` của Nguyễn Xuân Tài (Ca Tối 19/10).
  - Thêm phương thức truy vấn `findAssignmentsByBranchShiftAndDate` trong [`ShiftAssignmentRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/repository/ShiftAssignmentRepository.java).
  - Cập nhật [`ConflictDetectionEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/ConflictDetectionEngine.java) và [`StaffingCapacityRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/StaffingCapacityRule.java) để chặn lỗi `ERR_STAFFING_CAPACITY` ở mức `MANDATORY` error khi số lượng gán vượt `maxStaffing`.
  - Kiểm thử API: Cố tình gán thêm nhân sự vào ca đã đủ định biên lập tức bị chặn với lỗi `ERR_STAFFING_CAPACITY`.
- **Frontend**:
  - [`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx): Khóa cứng số lượng ứng viên chọn, hiển thị toast cảnh báo nếu tick thêm, vô hiệu hóa thẻ ứng viên chưa được chọn khi ca đã đủ người (`selectedEmpIds.size >= maxStaffing`).
  - [`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx): Bổ sung trạng thái `isOverCapacity` với huy hiệu Đỏ Cảnh Báo (`#FEF2F2` / `#DC2626`) kèm icon `AlertTriangle`.
  - Frontend biên dịch `npm run build` thành công 100% (0 lỗi).
  - Tuần 19/10/2026 hiện tại đạt chuẩn 28/28 ca (1/1 NV cho mọi ô), không còn tình trạng vượt định biên.

