# Nhật Ký Kỹ Thuật: Brainstorm Giải Pháp Điều Hướng Chuyển Tháng Cho Lịch Phân Ca

- **Thời gian:** 19/10/2026 - 17:25 (GMT+7)
- **Tác giả:** Solution Brainstormer Agent
- **Báo cáo liên quan:** [plans/reports/261019-1725-month-view-navigation-sync.md](../../plans/reports/261019-1725-month-view-navigation-sync.md)

---

## 1. Yêu Cầu Người Dùng
Người dùng gửi ảnh thực tế (`pasted-image-26236.png`) khi đang mở xem lịch phân ca toàn tháng:
- Nhận xét rằng hiện chưa có chỗ để chuyển tháng, gây bất tiện khi muốn xem hoặc phân ca cho tháng trước/sau.
- Cụm nút hiện tại ở toolbar chỉ nhảy theo tuần (+/- 7 ngày) và nhãn hiển thị vẫn là khoảng tuần `28/09/2026 — 04/10/2026`.

## 2. Quyết Định Thiết Kế (Đã thống nhất cùng người dùng)
- **Phương án 1 (Đồng bộ đa điểm):**
  - Thanh công cụ `ScheduleToolbar` chuyển nút điều hướng thành `<` `[Tháng này]` `>` và nhãn thành `📅 Tháng MM/yyyy` khi ở chế độ xem Tháng.
  - Thêm cụm nút chuyển tháng mini ngay tại tiêu đề bảng `MonthViewGrid` để thao tác tiện lợi ngay tại chỗ.
  - Quản lý state ngày tháng bằng `monthDate` trong `SchedulePage.tsx`, đồng bộ chuẩn xác với `currentStartDate` và backend.

## 3. Bước Tiếp Theo
- Xin ý kiến người dùng để tiến hành tạo kế hoạch chi tiết (`/aikit-core:xd:plan`).
