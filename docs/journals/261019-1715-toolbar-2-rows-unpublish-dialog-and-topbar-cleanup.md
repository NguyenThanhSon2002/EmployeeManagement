# Nhật Ký Kỹ Thuật: Hoàn Thành Brainstorm & Kế Hoạch Cho Toolbar 2 Hàng, Nút Thu Hồi Công Bố & Tối Giản Topbar

- **Thời gian:** 19/10/2026 - 17:15
- **Tác giả:** Solution Brainstormer & Planner Agent
- **Kế hoạch liên quan:** [plans/261019-1715-toolbar-2-rows-unpublish-dialog-and-topbar-cleanup/plan.md](../../plans/261019-1715-toolbar-2-rows-unpublish-dialog-and-topbar-cleanup/plan.md)
- **Báo cáo giải pháp:** [plans/reports/261019-1715-toolbar-2-rows-unpublish-dialog-and-topbar-cleanup.md](../../plans/reports/261019-1715-toolbar-2-rows-unpublish-dialog-and-topbar-cleanup.md)

---

## 1. Bối Cảnh & Phản Hồi Người Dùng
Người dùng yêu cầu 3 nội dung trọng tâm:
1. **Topbar:** Xóa dòng chữ phụ `Chi nhánh Cầu Giấy` bên dưới tên hệ thống `Hệ Thống Quản Lý Phân Ca & Nhân Sự` ([pasted-image-2697.png]).
2. **ScheduleToolbar:** Chuyển toàn bộ nhóm nút bấm, chọn chi nhánh và chế độ xem trong [pasted-image-30459.png] xuống dòng bên dưới (thanh công cụ thành 2 hàng rõ rệt); đồng thời giữ lại chữ `BẢN NHÁP` (và `ĐÃ CÔNG BỐ`) ở hàng trên.
3. **Nút quay lại bản nháp:** Khi quản lý lỡ bấm nhầm "Công bố lịch", cung cấp một nút để quay lại bản nháp kèm theo hộp thoại xác nhận: *"Bạn có chắc muốn thu hồi lịch đã công bố để chuyển về bản nháp không?"*.

## 2. Giải Pháp Thiết Kế
- Tách `ScheduleToolbar.tsx` thành flex container 2 hàng độc lập (`display: flex, flexDirection: column, gap: 12px`).
- Tạo mới component `UnpublishConfirmDialog.tsx` để hiển thị modal xác nhận có cảnh báo, phím tắt ESC và click ngoài để đóng.
- Tận dụng hàm `unpublishSchedule()` đã có sẵn trong `useScheduleStore` để chuyển trạng thái lịch từ `PUBLISHED` về `DRAFT`.
- Loại bỏ dòng chi nhánh phụ tại `Topbar.tsx`, căn giữa tiêu đề hệ thống.

## 3. Kết Quả Triển Khai Thực Tế
- **Topbar:** Đã dọn sạch dòng `Chi nhánh Cầu Giấy`, chỉ hiển thị duy nhất `Hệ Thống Quản Lý Phân Ca & Nhân Sự` với font size 15px, font-weight 700.
- **ScheduleToolbar:** Đã tách thành 2 hàng:
  - **Hàng 1:** Bộ nút `< [Hôm nay] >`, khoảng ngày `19/10/2026 — 25/10/2026`, và huy hiệu trạng thái `• BẢN NHÁP` (vàng) / `• ĐÃ CÔNG BỐ` (xanh).
  - **Hàng 2:** Bộ chọn chi nhánh, toggle xem [Tuần | Tháng], và toàn bộ các nút hành động `[ Xuất CSV ]`, `[ Lịch sử ]`, `[ Sao chép tuần ]`, `[ + Gán hàng loạt ]`, `[ Công bố lịch ]` / `[ ✨ Đã xuất bản ]` kèm `[ ↩️ Quay lại bản nháp ]`.
- **Hộp thoại thu hồi công bố:**
  - Component `UnpublishConfirmDialog.tsx` được tạo mới với bẫy tiêu điểm `useModalFocusTrap`, giao diện cảnh báo hoàn tác đẹp mắt.
  - Câu hỏi xác nhận: *"Bạn có chắc muốn thu hồi lịch đã công bố để chuyển về bản nháp không?"*.
  - Kết nối hoàn hảo với `unpublishSchedule()` trong `useScheduleStore`, chuyển trạng thái về `DRAFT` và bắn Toast thông báo thành công.
- **Kiểm thử:**
  - `npm run build` (tsc -b && vite build): Đạt 100% exit code 0.
  - `npm run lint`: 0 error.
