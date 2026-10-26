# Journal: Hoàn Tất Khắc Phục Lỗi Gán Hàng Loạt Trùng Ca & Reset Tuần Khi F5

- **Thời gian hoàn thành:** 2026-10-26 11:40:00
- **Kế hoạch triển khai:** [`plans/261026-1129-fix-bulk-assign-and-week-persistence/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1129-fix-bulk-assign-and-week-persistence/plan.md)
- **Trạng thái:** HOÀN THÀNH TOÀN DIỆN (ALL PHASES COMPLETED)

## 1. Tóm Tắt Các Thay Đổi Kỹ Thuật

### 1. Backend Spring Boot (Phase 01)
- Tạo DTO [`BatchAssignItemsRequest.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/dto/BatchAssignItemsRequest.java) nhận mảng các ca phân công kèm `scheduleId` và `scheduleVersion`.
- Bổ sung phương thức `batchAssignShifts(...)` trong [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java) thực thi trong một `@Transactional` an toàn:
  - Tự động nạp ca hiện có và các mẫu ca để thực hiện upsert chống trùng lặp.
  - Tăng `schedule.version` và ghi nhật ký thay đổi nếu tuần đã công bố.
- Cung cấp endpoint `POST /api/v1/schedules/assignments/batch` trong [`ScheduleController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/controller/ScheduleController.java).
- Khởi động lại backend trên cổng 8080 và đã test API trả về HTTP 200 `Batch saved: 1 item. ID: 16`.

### 2. Frontend API & Store Persistence (Phase 02)
- Bổ sung `batchAssignShifts` trong [`scheduleService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/api/scheduleService.ts).
- Cập nhật `applyAutoAssignments` trong [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts) gọi API batch assign để lưu ngay 28 ca vào database và nạp lại ID thật từ server.
- Tái cấu trúc hàm `fetchWeeklySchedule` trong [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts):
  - Thiết lập Backend làm **Single Source of Truth** cho tuần đang nạp (`startDate..endDate`).
  - Xóa bỏ hoàn toàn thuật toán Zombie Merge cũ (`existingList.push(mappedAssignment)` khi lệch ID).
  - Tách cache `localStorage` phân biệt theo tuần (`hrms_schedule_{branchId}_{startDate}`).

### 3. URL Query Parameters Synchronization (Phase 03)
- Tích hợp `useSearchParams` trong [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx):
  - Đọc `start_date` và `branch_id` từ URL khi khởi tạo trang.
  - Đồng bộ 2 chiều: khi đổi tuần hoặc chi nhánh, URL lập tức cập nhật `?start_date=YYYY-MM-DD&branch_id=ID`.
  - Khi người dùng F5 tải lại trang, trình duyệt giữ nguyên tuần và chi nhánh đang làm việc.

### 4. Kiểm Thử & Nghiệm Thu (Phase 04)
- Build frontend: `npm run build` hoàn thành với **0 lỗi**.
- Test API live: Xác thực lưu batch thành công, lấy dữ liệu tuần thành công.
