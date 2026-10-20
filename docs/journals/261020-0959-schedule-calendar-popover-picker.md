# Nhật Ký Kỹ Thuật: Brainstorm & Lập Kế Hoạch Popover Lịch Mini Chọn Nhanh Khoảng Thời Gian

- **Thời gian:** 20/10/2026 - 09:59 (GMT+7)
- **Tác giả:** Solution Brainstormer Agent
- **Báo cáo liên quan:** [plans/reports/261020-0957-schedule-calendar-popover-picker.md](../../plans/reports/261020-0957-schedule-calendar-popover-picker.md)
- **Kế hoạch liên quan:** [plans/261020-0959-schedule-calendar-popover-picker/plan.md](../../plans/261020-0959-schedule-calendar-popover-picker/plan.md)

---

## 1. Yêu Cầu Người Dùng
Người dùng gửi ảnh biểu tượng lịch `Calendar` trên thanh công cụ (`pasted-image-5.png`):
- Muốn khi ấn vào biểu tượng lịch này thì sẽ hiển thị ra bảng thời gian (calendar picker) để chọn khoảng thời gian muốn xem trực tiếp, thay vì phải click từng nút `<` và `>` để lùi/tiến từng tuần hoặc từng tháng.

## 2. Quyết Định Thiết Kế (Đã thống nhất cùng người dùng)
- **Phương án 1 (Popover Lịch Mini Chuyên Nghiệp):**
  - Tách thành component độc lập `DatePickerPopover.tsx` đặt tại `frontend/src/features/schedule/components/`.
  - Khi click vào icon lịch hoặc text ngày trên `ScheduleToolbar`: Mở ra Popover lịch mini ngay dưới nút.
  - Hiển thị đầy đủ lưới ngày trong tháng (bắt đầu từ Thứ Hai T2 đến Chủ Nhật CN).
  - Ở chế độ Tuần: Hover vào ngày sẽ highlight cả 7 ngày của tuần; click vào ngày bất kỳ sẽ tự tính ra thứ Hai và nhảy ngay đến tuần làm việc đó.
  - Ở chế độ Tháng: Click chọn ngày sẽ nhảy ngay đến tháng làm việc đó.
  - Tự động đóng khi click ra ngoài hoặc bấm Escape.
  - Có nút `[Hôm nay]` ở footer popover.
  - Tận dụng `date-fns` có sẵn, không cài thêm thư viện ngoài.
  - Sau khi hoàn thành code, **giữ nguyên thay đổi trong tab Changes** để người dùng kiểm tra trước khi commit.
