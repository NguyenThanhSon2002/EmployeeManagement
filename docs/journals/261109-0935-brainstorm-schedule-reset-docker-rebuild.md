# Nhật Ký Kỹ Thuật: Brainstorm Khắc Phục Triệt Để Lỗi Reset Lịch Tuần (Docker Environment)

- **Thời gian:** 09/11/2026 09:35:00
- **Tác vụ:** Điều tra nguyên nhân dữ liệu ca không bị xóa sau khi Reset tuần trên `http://localhost:8082` và thống nhất giải pháp xử lý.
- **Tài liệu phân tích:** `plans/reports/261109-0935-schedule-reset-docker-rebuild-report.md`

## 1. Phát Hiện Cốt Lõi
- Từ 3 ảnh chụp màn hình do người dùng cung cấp:
  - Người dùng bấm "Reset tuần" tại `http://localhost:8082` (chi nhánh Đống Đa, 22 ca).
  - Toast thông báo thành công và màn hình reset về 0 ca.
  - Tuy nhiên, sau khi F5 hoặc chuyển tuần, toàn bộ 22 ca quay trở lại.
- Qua kiểm tra chi tiết hệ thống:
  - Container Docker `hrms-frontend` và `hrms-backend` được tạo và đóng gói từ ngày **06/11 (3 ngày trước)**.
  - Trình duyệt đang chạy bản build cũ chứa logic gọi nhầm API và nuốt lỗi bằng `catch (err) { console.warn(...) }`.
  - Cơ sở dữ liệu MySQL máy chủ chưa bao giờ nhận được lệnh xóa toàn bộ phân ca của tuần.

## 2. Giải Pháp Thống Nhất
1. **Backend:** Cập nhật `ShiftAssignmentRepository` với `@Modifying @Query` để xóa dứt điểm các ca thuộc `schedule_id` bằng câu lệnh SQL trực tiếp.
2. **Frontend:** Cập nhật `useScheduleStore.ts` để gọi lại `fetchWeeklySchedule` sau khi reset thành công nhằm đồng bộ 100% với Single Source of Truth của Backend.
3. **Môi trường:** Rebuild lại hai container Docker `frontend` và `backend` bằng `docker compose up -d --build frontend backend`.

## 3. Bước Tiếp Theo
- Kích hoạt `/xd:plan` để lập kế hoạch chi tiết cho các bước triển khai và kiểm thử.
