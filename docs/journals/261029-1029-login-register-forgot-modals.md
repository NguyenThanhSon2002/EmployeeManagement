# Journal: Cập nhật giao diện Đăng nhập (Xóa ghi chú mật khẩu mặc định, thêm Quên mật khẩu & Tạo tài khoản)

- **Thời gian:** 2026-10-29 10:32 (UTC+7)
- **Tác vụ:** Cập nhật màn hình đăng nhập hệ thống [`LoginPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/LoginPage.tsx).

### 1. Thay đổi đã thực hiện
- **Xóa ghi chú mật khẩu mặc định:** Đã gỡ bỏ toàn bộ dòng chữ `💡 Mật khẩu mặc định: Mã nhân viên viết thường + @123` khỏi form đăng nhập.
- **Thêm liên kết 'Quên mật khẩu?':**
  - Đặt ngang hàng với checkbox 'Duy trì đăng nhập' (bố cục flexbox `space-between`).
  - Hỗ trợ đầy đủ trạng thái hover, active và focus-visible bàn phím.
  - Khi bấm, mở modal [`ForgotPasswordModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/components/ForgotPasswordModal.tsx).
- **Thêm nút 'Tạo tài khoản mới':**
  - Đặt dưới nút bấm đăng nhập chính với dòng gợi ý: `Chưa có tài khoản? Tạo tài khoản mới` kèm biểu tượng `UserPlus`.
  - Khi bấm, mở modal [`RegisterAccountModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/components/RegisterAccountModal.tsx).
- **Xây dựng 2 Modal đạt chuẩn Accessibility (WCAG 2.1 AA):**
  - Tích hợp hook [`useModalFocusTrap`](file:///D:/Project/Employee%20Management/frontend/src/hooks/useModalFocusTrap.ts) (tự động focus vào input đầu tiên, bẫy phím Tab/Shift+Tab, đóng bằng phím Escape, đóng khi click backdrop).
  - Validation dữ liệu đầu vào và hiển thị phản hồi tiếp nhận thành công kèm thông báo Toast trực quan.

### 2. Kết quả kiểm tra
- `npm run build` hoàn tất không lỗi (`✓ built in 352ms`).
