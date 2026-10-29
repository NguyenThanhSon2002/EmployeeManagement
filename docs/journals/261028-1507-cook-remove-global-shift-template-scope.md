# Nhật Ký Kỹ Thuật: Hoàn Thành Triển Khai Loại Bỏ Phạm Vi Ca Dùng Chung Toàn Hệ Thống

**Thời gian:** 2026-10-28 15:07  
**Kế hoạch:** `plans/261028-1457-remove-global-shift-template-scope/plan.md`  
**Trạng thái:** Hoàn thành (100% Verified)  

### 1. Tóm Tắt Các Thay Đổi Đã Thực Hiện
- **Database (Flyway V15):** Tạo `V15__make_work_shifts_branch_specific.sql` chuyển `branch_id` sang `NOT NULL`, cập nhật các ca cũ `branch_id IS NULL` theo chi nhánh trong phân công lịch hoặc chi nhánh đầu tiên.
- **Backend (Spring Boot):**
  - [`WorkShift.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/domain/WorkShift.java): `@Column(name = "branch_id", nullable = false)`.
  - [`WorkShiftDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/dto/WorkShiftDto.java): Thêm `@NotNull(message = "Chi nhánh áp dụng không được để trống")`.
  - [`WorkShiftRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/repository/WorkShiftRepository.java): Xóa bỏ query ghép ca toàn chuỗi `findAllActiveByBranchIdOrGlobal`, thay bằng `findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc`.
  - [`WorkShiftService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/service/WorkShiftService.java): Bắt buộc `branchId` khi tạo/cập nhật mẫu ca; chỉ trả về ca của chi nhánh được yêu cầu.
  - [`WorkShiftServiceTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/shift/WorkShiftServiceTest.java): Unit test đạt 3/3 tests pass (100%).
- **Frontend (React + TypeScript):**
  - [`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx): Xóa bỏ hoàn toàn 2 nút toggle chọn "Toàn hệ thống (Dùng chung)" / "Theo Chi Nhánh Cụ Thể". Thay bằng trường dropdown chọn chi nhánh áp dụng rõ ràng, tự động khóa với Quản lý cơ sở.
  - [`ShiftTemplateCard.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateCard.tsx): Loại bỏ badge "Toàn hệ thống", luôn hiển thị badge chi nhánh trực quan.
  - [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx): Truyền `defaultBranchId` dự phòng khi Giám đốc mở modal tạo ca mới.
  - [`EmployeeAvailabilityTab.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/EmployeeAvailabilityTab.tsx) & [`EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx): Tải ca khả dụng theo đúng `branchId` của nhân viên.
  - [`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts): Đổi `branchId?: number` (không còn `null`).

### 2. Kết Quả Kiểm Thử
- Frontend `npm run build`: Thành công 100% (code 0), không lỗi Type.
- Backend `mvn test -Dtest=WorkShiftServiceTest`: 3/3 tests passed (code 0).
- Chấm dứt hoàn toàn hiện tượng cộng trùng ca giữa toàn hệ thống và chi nhánh cụ thể trên ma trận phân ca tuần.
