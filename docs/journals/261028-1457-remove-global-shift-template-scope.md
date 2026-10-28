# Nhật Ký Kỹ Thuật: Hoàn Thành Kế Hoạch Loại Bỏ Phạm Vi Mẫu Ca Toàn Hệ Thống Dùng Chung

**Thời gian:** 2026-10-28 14:57  
**Kế hoạch:** `plans/261028-1457-remove-global-shift-template-scope/plan.md`  
**Trạng thái:** Pending (Sẵn sàng thực thi)  

### 1. Tóm Tắt Kế Hoạch
- **Vấn đề đã phân tích & giải quyết:** Khắc phục triệt để lỗi cộng trùng ca khi mẫu ca toàn hệ thống (`branch_id IS NULL`) bị ép dồn vào bảng phân ca của từng chi nhánh cụ thể.
- **Phân rã thành 3 Phases tuần tự:**
  - **Phase 01 (Database & Backend):** Flyway migration `V15__make_work_shifts_branch_specific.sql` chuyển `branch_id` sang `NOT NULL`, xử lý an toàn dữ liệu cũ; cập nhật `WorkShift`, `WorkShiftDto`, `WorkShiftRepository`, `WorkShiftService` loại bỏ hoàn toàn điều kiện query `OR w.branchId IS NULL`.
  - **Phase 02 (Frontend Modal & Card):** Loại bỏ hoàn toàn khối chọn phạm vi "Toàn hệ thống (Dùng chung)" trong `ShiftTemplateFormModal.tsx`, thay bằng dropdown chọn chi nhánh cụ thể; chuẩn hóa badge chi nhánh trong `ShiftTemplateCard.tsx`.
  - **Phase 03 (Frontend Pages & Verification):** Đồng bộ hóa bộ lọc ca tại `ShiftTemplatesPage.tsx`, ma trận phân ca tuần `WeeklyGrid.tsx` / `SchedulePage.tsx`, tab khả dụng `EmployeeAvailabilityTab.tsx`; kiểm thử biên dịch `npm run build` và `mvn test-compile`.

### 2. Hành Động Tiếp Theo
- Người dùng có thể tiến hành thực thi kế hoạch bằng cách sử dụng `/aikit-core:xd:cook plans/261028-1457-remove-global-shift-template-scope`.
