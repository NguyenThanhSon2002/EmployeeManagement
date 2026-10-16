# Phase 01: Xây Dựng Component SmartTimePicker Chuẩn Web Desktop

**Mục tiêu:** Tạo component [`SmartTimePicker.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/SmartTimePicker.tsx) thay thế hoàn toàn cho `IOSTimePicker.tsx`, tối ưu 100% cho trải nghiệm chuột và bàn phím máy tính.

---

## 1. Chi Tiết Kỹ Thuật Component `SmartTimePicker`

### A. Ô Nhập Liệu (Input Capsule)
- Cho phép người dùng **gõ phím trực tiếp**: Hỗ trợ nhập số dạng `08:00`, `14:30`, tự động lọc ký tự không hợp lệ.
- Khi người dùng blur hoặc gõ xong: Tự động format chuẩn `HH:mm` (validate 00:00 - 23:59).
- Icon `Clock` bên trái và icon `ChevronDown` bên phải để mở danh sách mốc giờ gợi ý.
- Viền xám nhạt `#CBD5E1`, khi focus đổi sang viền xanh `#2563EB` và shadow vòng sáng nhạt.

### B. Danh Sách Gợi Ý Mốc Giờ (Quick Dropdown)
- Hiển thị danh sách các mốc giờ cách nhau 30 phút (`06:00`, `06:30`, `07:00`, ..., `23:30`).
- Phía trên cùng có thanh ghim chọn nhanh các ca thông dụng: `06:00`, `08:00`, `12:00`, `14:00`, `17:00`, `22:00`.
- Tự động cuộn đến mốc giờ đang được chọn khi mở dropdown.
- Bấm chọn bất kỳ mốc giờ nào: Lập tức gọi `onChange` và tự động đóng dropdown, phản hồi tức thì 0ms độ trễ.
- Hỗ trợ đóng khi click ra ngoài (click-outside) và phím `Escape`.

### C. Ngăn Chặn Lỗi Tràn / Cắt Cụt Form (Layout Overflow Prevention)
- Chiều rộng `width: 100%` đồng bộ hoàn toàn với cột input cha.
- Chiều cao danh sách tối đa `max-height: 190px`, nằm gọn gàng ngay dưới ô input.
- `zIndex: 1000` với shadow đa tầng nhẹ nhàng, không tạo thanh cuộn bất thường cho container modal.
