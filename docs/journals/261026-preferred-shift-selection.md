# Journal: Tính Năng Đăng Ký Ca Làm Việc Ưu Tiên Cho Nhân Viên

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Mở rộng lịch khả dụng nhân sự với cơ chế đánh dấu Ca Ưu Tiên (Preferred Shifts) và tích hợp vào thuật toán phân ca.

## 1. Vấn Đề Ghi Nhận
- Nhân viên hiện chỉ có thể chọn ca rảnh/bận trong tuần, chưa thể hiện được nguyện vọng ca yêu thích (ví dụ: muốn ưu tiên làm ca sáng, hoặc ca tối, hoặc cả hai).
- Quản lý khi xếp ca thủ công hoặc chạy gán tự động chưa có thông tin về sở thích ca của nhân sự để tối ưu sự hài lòng của nhân viên.

## 2. Quyết Định Thống Nhất
- **Giao diện đăng ký:**
  - Bổ sung nút/icon Ngôi sao ⭐ tương tác ở cột Mẫu Ca Làm Việc trong tab "Lịch Khả Dụng / Đăng Ký Ca".
  - Cho phép 1 click đánh dấu ca đó là `★ Ca ưu tiên` (hoặc hủy ưu tiên).
  - Các ô ngày rảnh của ca ưu tiên sẽ hiển thị huy hiệu sao vàng nổi bật.
- **Backend & Cơ sở dữ liệu:**
  - Tạo bảng `employee_preferred_shifts (employee_id, work_shift_id)` với migration Flyway `V11`.
  - Mở rộng DTO `SaveAvailabilityRequest` và response API với trường `preferred_shift_ids`.
- **Tích hợp xếp ca:**
  - Trong `AssignStaffDrawer`: Thêm badge `★ Ưu tiên ca này`, đẩy ứng viên ưu tiên lên đầu danh sách.
  - Trong `auto-assign.utils.ts`: Bổ sung trọng số `isPreferred` để thuật toán tự động ưu tiên gán người thích ca trước.

## 3. Kế Hoạch & Kết Quả Triển Khai
- Báo cáo brainstorm: [`plans/reports/261026-1526-brainstorm-preferred-shift-selection.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1526-brainstorm-preferred-shift-selection.md).
- Kế hoạch triển khai tổng thể: [`plans/261026-1528-preferred-shift-selection/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1528-preferred-shift-selection/plan.md).
- **Kết quả thực hiện:**
  - **Backend:** Đã tạo migration Flyway [`V11__create_employee_preferred_shifts_table.sql`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration/V11__create_employee_preferred_shifts_table.sql), entity [`EmployeePreferredShift.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/availability/domain/EmployeePreferredShift.java), repository [`EmployeePreferredShiftRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/availability/repository/EmployeePreferredShiftRepository.java), cập nhật [`EmployeeAvailabilityService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/availability/service/EmployeeAvailabilityService.java) và [`EmployeeAvailabilityController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/availability/controller/EmployeeAvailabilityController.java). Flyway V11 áp dụng thành công.
  - **Store:** Mở rộng [`useAvailabilityStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/store/useAvailabilityStore.ts) hỗ trợ `preferredShifts`, `isPreferredShift`, `togglePreferredShift`, và lưu `preferred_shift_ids` xuống API.
  - **Tab Lịch Khả Dụng:** Thêm nút ⭐ `Chọn ưu tiên` / `Ưu tiên`, badge `★ Ưu tiên` và cell badge `★ Ưu tiên` trong [`EmployeeAvailabilityTab.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/EmployeeAvailabilityTab.tsx).
  - **Xếp Ca & Auto-Assign:** Tích hợp huy hiệu `★ Ưu tiên ca này`, đưa ứng viên ưu tiên lên đầu trong [`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx) và ưu tiên xếp ca trong [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts).
  - **Tối ưu UI/UX (Design Refinement):** Đồng bộ hóa toàn diện giao diện Ca Ưu Tiên trong [`EmployeeAvailabilityTab.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/EmployeeAvailabilityTab.tsx). Bỏ các nút bấm chữ cồng kềnh, chuyển thành nút icon Ngôi sao ⭐ tương tác bookmark tinh tế cạnh tên ca. Giữ chuẩn bảng màu xanh ngọc đồng bộ cho tất cả các ô ngày sẵn sàng (Sẵn sàng + sub-label nhỏ ★ Ưu tiên), loại bỏ hoàn toàn các khối màu vàng lệch tông.
  - Đã xác thực build Backend (`mvn test-compile`) và Frontend (`npm run build`) thành công 100%.
