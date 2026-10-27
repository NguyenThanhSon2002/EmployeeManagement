# Planning Journal: Strict Publish Lock & RBAC for Schedule Module

- **Thời gian:** 27/10/2026 13:36 (Local Time)
- **Chủ đề:** Khóa đóng băng lịch phân ca khi đã công bố và phân quyền chỉ Giám đốc / Admin mới được thu hồi về bản nháp.
- **Trạng thái:** Kế hoạch đã hoàn thành, sẵn sàng thực hiện.

## 1. Tóm tắt yêu cầu & Thống nhất thiết kế
- Khi lịch tuần chuyển sang `PUBLISHED`, toàn bộ hệ thống áp dụng cơ chế khóa đóng băng nghiêm ngặt (**Strict Lock - Read Only**).
- **Giám đốc / Admin (`ROLE_DIRECTOR`, `ROLE_ADMIN`):** Có nút "Quay lại bản nháp" hoạt động để mở khóa lịch.
- **Quản lý chi nhánh (`ROLE_MANAGER`):** Nút "Quay lại bản nháp" bị vô hiệu hóa (`disabled`) kèm Tooltip giải thích; không được thay đổi bất kỳ ô ca nào; các nút sao chép / gán hàng loạt bị khóa.
- **Nhân viên (`ROLE_EMPLOYEE`):** Ẩn hoàn toàn các nút quản lý.
- **Backend:** Thêm guard chặn trong `ScheduleService` và bảo vệ `@PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")` ở `ScheduleController`.

## 2. Danh sách các file kế hoạch
- Kế hoạch tổng thể: [`plans/261027-1336-strict-publish-lock-rbac/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1336-strict-publish-lock-rbac/plan.md)
- Phase 01: [`phase-01-backend-publish-lock-guard.md`](file:///D:/Project/Employee%20Management/plans/261027-1336-strict-publish-lock-rbac/phase-01-backend-publish-lock-guard.md)
- Phase 02: [`phase-02-frontend-toolbar-rbac-tooltips.md`](file:///D:/Project/Employee%20Management/plans/261027-1336-strict-publish-lock-rbac/phase-02-frontend-toolbar-rbac-tooltips.md)
- Phase 03: [`phase-03-frontend-matrix-freeze-and-store-guard.md`](file:///D:/Project/Employee%20Management/plans/261027-1336-strict-publish-lock-rbac/phase-03-frontend-matrix-freeze-and-store-guard.md)
- Phase 04: [`phase-04-verification-and-testing.md`](file:///D:/Project/Employee%20Management/plans/261027-1336-strict-publish-lock-rbac/phase-04-verification-and-testing.md)

## 3. Quá trình triển khai & Kết quả kiểm thử
- **Backend:**
  - Cập nhật [`ScheduleController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/controller/ScheduleController.java): `@PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")` tại `unpublishSchedule`.
  - Cập nhật [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java): Thêm helper guard `assertScheduleNotLocked` và chặn tất cả các hàm `assignSingleShift`, `deleteAssignment`, `bulkAssign`, `batchAssignShifts`, `copyScheduleWeek` khi trạng thái lịch là `PUBLISHED`.
  - Biên dịch backend (`mvn test-compile`): `BUILD SUCCESS`.
- **Frontend:**
  - Cập nhật [`ScheduleToolbar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ScheduleToolbar.tsx):
    - Khi `scheduleStatus === 'PUBLISHED'`: Nút "Quay lại bản nháp" chỉ có hiệu lực với Giám đốc (`ROLE_DIRECTOR`). Với Quản lý (`ROLE_MANAGER`), nút bị `disabled` kèm Tooltip giải thích *"Chỉ Giám đốc hoặc Admin mới có quyền thu hồi lịch đã công bố về bản nháp."*.
    - Các nút "Sao chép tuần" và "Gán hàng loạt" bị `disabled` kèm Tooltip khi lịch đã `PUBLISHED`.
  - Cập nhật [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx):
    - Chuẩn hóa `canEditSchedule = !isScheduleLocked && currentRole !== 'ROLE_EMPLOYEE'`.
    - Chặn mở drawer phân ca và thao tác xóa/gán khi lịch bị khóa.
  - Cập nhật [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts):
    - Thêm guard chặn trong `assignShift` và `deleteAssignment` khi lịch đang `PUBLISHED`.
  - Biên dịch frontend (`npm run build`): Thành công sạch sẽ, không có lỗi TypeScript.
