# Nhật Ký Kỹ Thuật: Hoàn Thành Triển Khai Mẫu Ca Theo Chi Nhánh (Branch-Specific Shift Templates)

**Thời gian:** 2026-10-27 15:55  
**Kế hoạch:** `plans/261027-1545-branch-specific-shift-templates/plan.md`  
**Trạng thái:** Hoàn thành (Completed)  

### 1. Tóm Tắt Các Thay Đổi Thực Hiện
1. **Cơ sở dữ liệu (Flyway V14)**:
   - Thêm cột `branch_id BIGINT UNSIGNED NULL` vào bảng `work_shifts`.
   - Chuyển đổi ràng buộc `uq_work_shifts_code` sang `uq_work_shifts_code_branch UNIQUE (shift_code, branch_id)`.
   - Đánh index `idx_work_shifts_branch`.
2. **Backend Spring Boot**:
   - [`WorkShift.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/domain/WorkShift.java): Bổ sung trường `branchId` và getter/setter.
   - [`WorkShiftDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/dto/WorkShiftDto.java): Bổ sung `branch_id` và `branch_name`.
   - [`WorkShiftRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/repository/WorkShiftRepository.java): Thêm method `findAllActiveByBranchIdOrGlobal` và `existsByShiftCodeAndBranchIdAndDeletedAtIsNull`.
   - [`WorkShiftService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/service/WorkShiftService.java): Lọc ca linh hoạt (Global + riêng của Branch), tự động map tên chi nhánh `branchName`, kiểm tra unique theo phạm vi branch.
   - [`WorkShiftController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/controller/WorkShiftController.java): Hỗ trợ param `@RequestParam(value = "branchId", required = false)`.
3. **Frontend React & Zustand Store**:
   - [`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts): Thêm `branchId?: number | null`, `branchName?: string | null` vào `ShiftTemplate`.
   - [`workShiftService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/api/workShiftService.ts): Hỗ trợ nạp ca theo `branchId`.
   - [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts): Hàm `fetchShiftTemplates(branchId?: number)`.
   - [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx): Thêm dropdown bộ lọc chi nhánh ở thanh tiêu đề (tùy chọn 'Tất cả chi nhánh' cho Giám đốc, khóa theo cơ sở cho Quản lý).
   - [`ShiftTemplateCard.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateCard.tsx): Hiển thị Badge `🌐 Toàn hệ thống` hoặc `📍 Cơ sở: {branchName}`.
   - [`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx): Cho phép chọn phạm vi (Áp dụng toàn hệ thống hoặc Chi nhánh cụ thể).
   - [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx): Tự động nạp ca tương ứng khi thay đổi chi nhánh trên ma trận lịch làm việc tuần.
4. **Kiểm tra biên dịch**:
   - `mvn compile -DskipTests` -> **BUILD SUCCESS**.
   - `npm run build` -> **0 lỗi** (TypeScript build sạch sẽ).
