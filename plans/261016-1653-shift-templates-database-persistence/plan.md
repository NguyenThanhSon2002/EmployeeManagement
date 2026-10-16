---
title: "Kế Hoạch Lưu Trữ Dữ Liệu Mẫu Ca Vào Cơ Sở Dữ Liệu MySQL"
description: "Xây dựng workShiftService và kết nối các thao tác CRUD của ShiftTemplatesPage tới API Backend /api/v1/work-shifts, lưu trữ bền vững vào bảng work_shifts của cơ sở dữ liệu MySQL."
status: completed
priority: P1
effort: 45m
branch: refactor/structure-cleanup
tags: [database, persistence, mysql, shift-templates, api, spring-boot]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Lưu Trữ Dữ Liệu Mẫu Ca Vào Cơ Sở Dữ Liệu MySQL

## 1. Bối Cảnh & Vấn Đề Kỹ Thuật

Người dùng hỏi: *"dữ liệu này có lưu trong database không, nếu chưa thì hãy giúp tôi lưu những thay đổi đó"*.

### Thực trạng:
1. **Frontend:** Các thao tác Thêm mới / Sửa / Xóa mẫu ca trên [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx) mới chỉ cập nhật vào bộ nhớ RAM của Zustand store (`useScheduleStore`). Khi người dùng tải lại trang (F5), tất cả thay đổi sẽ bị mất.
2. **Backend:** Bảng `work_shifts` trong MySQL và các API RESTful tại `/api/v1/work-shifts` trong [`WorkShiftController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/controller/WorkShiftController.java) **đã có sẵn đầy đủ**:
   - `GET /api/v1/work-shifts`
   - `POST /api/v1/work-shifts`
   - `PUT /api/v1/work-shifts/{id}`
   - `DELETE /api/v1/work-shifts/{id}`
3. **Mục tiêu:** Kết nối hoàn chỉnh từ Frontend xuống API Backend để lưu trữ vĩnh viễn vào MySQL Database.

---

## 2. Mục Tiêu Triển Khai

- **Tạo `workShiftService.ts`:**
  - Định nghĩa các hàm gọi API chuẩn RESTful kết nối `/api/v1/work-shifts`.
  - Tự động chuẩn hóa format dữ liệu giữa snake_case (`shift_code`, `start_time`, `is_cross_midnight`) của backend và camelCase của frontend.
- **Nâng cấp `useScheduleStore.ts`:**
  - Thêm action `fetchShiftTemplates()` tải danh sách mẫu ca từ MySQL khi mở trang.
  - Cập nhật `addShiftTemplate`, `updateShiftTemplate`, `deleteShiftTemplate` gọi trực tiếp Backend API và đồng bộ store.
  - Bảo đảm có fallback an toàn cho môi trường test (`isMockEnabled()`).
- **Tích hợp vào `ShiftTemplatesPage.tsx`:**
  - Tự động gọi `fetchShiftTemplates()` khi mount component để luôn lấy dữ liệu mới nhất từ MySQL.
  - Hiển thị Toast thông báo trạng thái thành công / lỗi rõ ràng.
- **Kiểm thử tự động & Zero Regression:**
  - Đảm bảo toàn bộ 17/17 test files và 69+ unit tests Vitest đạt 100% Xanh.
  - Đảm bảo Vite build thành công sạch sẽ.

---

## 3. Lộ Trình Triển Khai (2 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Xây Dựng Service workShiftService & Cập Nhật Store Actions](./phase-01-api-service-and-store-actions.md) | Completed ✅ | 25m | Tạo `workShiftService.ts`, nâng cấp `fetchShiftTemplates`, `addShiftTemplate`, `updateShiftTemplate`, `deleteShiftTemplate` trong `useScheduleStore`. |
| **Phase 2** | [Tích Hợp Giao Diện ShiftTemplatesPage & Kiểm Thử Toàn Diện](./phase-02-ui-integration-and-verification.md) | Completed ✅ | 20m | Tích hợp fetch on mount vào `ShiftTemplatesPage`, cập nhật test suites, xác minh 100% test xanh và build Vite. |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Mapping DTO chuẩn xác:**
   ```ts
   // Frontend -> Backend
   {
     shift_code: template.shiftCode,
     shift_name: template.shiftName,
     start_time: template.startTime.length === 5 ? `${template.startTime}:00` : template.startTime,
     end_time: template.endTime.length === 5 ? `${template.endTime}:00` : template.endTime,
     break_minutes: template.breakMinutes,
     is_cross_midnight: template.isCrossMidnight,
     color_code: template.colorCode,
     text_color: template.textColor,
     min_staffing: template.minStaffing,
     max_staffing: template.maxStaffing,
     applicable_days: template.applicableDays || '1,2,3,4,5,6,7',
     is_active: true
   }
   ```
2. **Snapshotting Integrity:** Sửa ca mẫu không làm thay đổi các phân công ca cũ đã được lưu trong snapshot lịch tuần.
