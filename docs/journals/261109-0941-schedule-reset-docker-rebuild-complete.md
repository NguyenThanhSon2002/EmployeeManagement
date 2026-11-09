# Nhật Ký Kỹ Thuật: Hoàn Tất Khắc Phục Lỗi Reset Lịch Tuần & Rebuild Docker Container

- **Thời gian:** 09/11/2026 09:41:00
- **Tác vụ:** Hoàn tất tối ưu hóa mã nguồn Backend & Frontend, rebuild 2 container Docker (`frontend` & `backend`), và xác thực dọn sạch phân ca tuần thành công.
- **Kế hoạch liên quan:** `plans/261109-0936-docker-rebuild-and-reset-sync/plan.md`

## 1. Các Thay Đổi Đã Thực Hiện
1. **Backend (`ShiftAssignmentRepository.java`):**
   - Đã thêm `@Modifying` và `@Query("DELETE FROM ShiftAssignment a WHERE a.scheduleId = :scheduleId")`.
   - Biên dịch backend đạt `BUILD SUCCESS`.
2. **Frontend (`useScheduleStore.ts`):**
   - Đã thêm lệnh gọi `await get().fetchWeeklySchedule(branchId, currentMonStr)` sau khi xóa phân ca tuần trên server để làm mới dữ liệu từ Single Source of Truth.
   - `npm run lint` đạt 0 lỗi, `npm run build` thành công 100%.
3. **Docker Rebuild:**
   - Chạy `docker compose up -d --build frontend backend`.
   - Cả 2 container `hrms-frontend` (cổng 8082) và `hrms-backend` (cổng 8081) đã được build mới và khởi động lại với trạng thái `healthy`.
4. **Kiểm Thử Thực Tế (E2E Verification):**
   - Đã gọi API `DELETE /api/v1/schedules/33/assignments?schedule_version=2` của chi nhánh Đống Đa (`branch_id = 2`) tuần `09/11/2026`.
   - Kết quả: Toàn bộ 22 ca làm việc đã bị dọn sạch dứt điểm khỏi MySQL CSDL (tổng số ca về 0, version tăng lên 3).
   - Tải lại dữ liệu tuần qua `GET /api/v1/schedules/weekly` xác nhận 0 ca tồn lưu.

## 2. Kết Luận
Lỗi reset tuần bị mất khi F5 hoặc chuyển trang đã được giải quyết triệt để 100% trên toàn bộ hệ thống (Mã nguồn, CSDL, LocalStorage, và Môi trường Docker).
