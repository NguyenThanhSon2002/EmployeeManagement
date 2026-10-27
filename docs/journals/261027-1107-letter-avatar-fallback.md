# Technical Journal: Letter Avatar Fallback & Employee List Avatar Mapping

**Date:** 2026-10-27  
**Branch:** `dev`  
**Plan:** `plans/261027-1107-letter-avatar-fallback/plan.md`  

---

## 1. Problem Statement
- **Lỗi hiển thị ảnh ngoài danh sách nhân viên:** Mặc dù backend đã trả về trường `avatar_url` trong `EmployeeDto`, frontend tại `EmployeeListPage.tsx` và `useDirectoryStore.ts` khi mapping DTO thành `Employee` đã bỏ quên thuộc tính `avatarUrl`. Kết quả là `emp.avatarUrl` luôn là `undefined` và fallback sang ảnh phụ nữ mẫu Unsplash.
- **Yêu cầu ảnh đại diện mặc định chữ cái in hoa:** Khách hàng yêu cầu thay thế toàn bộ ảnh mẫu Unsplash bằng Avatar chữ cái in hoa (Initial Letter Avatar) tương tự Google/Slack (ví dụ tên Bắc ➔ chữ "B", Phương ➔ "P", Linh ➔ "L"), sử dụng bảng màu pastel ngẫu nhiên cố định theo tên.

---

## 2. Agreed Solution & Design
1. **Quy tắc trích xuất chữ cái in hoa:** Lấy chữ cái đầu của **Tên chính** (từ cuối cùng trong họ và tên).
2. **Bảng màu Pastel:** Sử dụng 8 cặp màu pastel nhẹ nhàng với độ tương phản cao, xác định theo hàm băm tên người dùng.
3. **Component dùng chung:** Tạo `UserAvatar.tsx` tự động chuyển đổi giữa ảnh chân dung và avatar chữ cái khi ảnh tải lỗi hoặc không tồn tại.
4. **Sửa dữ liệu mapping:** Bổ sung `avatarUrl: dto.avatar_url || dto.avatarUrl` trong `EmployeeListPage.tsx` và `useDirectoryStore.ts`.
5. **Dọn dẹp:** Loại bỏ hoàn toàn các đường link ảnh Unsplash tĩnh.

---

## 3. Next Steps
- Triển khai theo kế hoạch tại `plans/261027-1107-letter-avatar-fallback/plan.md`.
