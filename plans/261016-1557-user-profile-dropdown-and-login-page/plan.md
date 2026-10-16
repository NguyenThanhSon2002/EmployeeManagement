---
title: "Kế Hoạch Triển Khai Popup Hồ Sơ, Nút Đăng Xuất & Màn Hình Đăng Nhập Doanh Nghiệp"
description: "Kế hoạch toàn diện xây dựng UserProfileDropdown popover neo dưới Avatar trên Topbar, nút Đăng xuất an toàn, màn hình Đăng nhập (LoginPage) chuẩn doanh nghiệp với tính năng 1-Click Quick Access, và hệ thống bảo vệ định tuyến ProtectedRoute."
status: completed
priority: P1
effort: 4h
branch: refactor/structure-cleanup
tags: [feature, auth, user-profile-dropdown, logout, login-page, protected-route, quick-access, rbac]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Triển Khai Popup Hồ Sơ, Nút Đăng Xuất & Màn Hình Đăng Nhập Doanh Nghiệp

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Người dùng yêu cầu: *"hiện tại tôi vẫn chưa thấy có nút đăng xuất để quay về trang đăng nhập tài khoản, hãy lên kế hoạch cho tôi một popup khi ấn vào ảnh nhân viên như này và hiển thị nút đăng xuất để ra màn hình đăng nhập đăng ký"*.

### Thực trạng hệ thống:
1. **Thanh Topbar:** Thẻ người dùng trên Topbar ([`Topbar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/Topbar.tsx#L92-L126)) hiện là thẻ `<div>` tĩnh, chưa có sự kiện click, không có dropdown popup menu và không có nút Đăng xuất.
2. **Định tuyến (Routing):** [`AppRoutes.tsx`](file:///D:/Project/Employee%20Management/frontend/src/routes/AppRoutes.tsx) hiện chưa có trang `/login` và chưa có cơ chế bảo vệ định tuyến (Route Guard / Protected Route).
3. **Cơ chế Khởi tạo Auth:** [`useAuthStore.initAuth()`](file:///D:/Project/Employee%20Management/frontend/src/shared/auth/useAuthStore.ts#L139-L144) đang tự động đăng nhập ngầm làm `admin` mỗi khi mở ứng dụng, khiến người dùng không bao giờ thấy màn hình Đăng nhập để thao tác chuyển tài khoản hoặc thoát phiên làm việc.
4. **Backend:** Spring Boot đã có sẵn 100% API xác thực chuẩn RESTful:
   - `POST /api/v1/auth/login` (cấp JWT Token)
   - `POST /api/v1/auth/refresh`
   - `GET /api/v1/auth/me`

---

## 2. Mục Tiêu Kế Hoạch

- **UserProfileDropdown Popover mượt mà:** Click vào ảnh đại diện hoặc tên nhân viên trên Topbar sẽ mở ra Popover menu neo chuẩn xác dưới thẻ người dùng, hiển thị đầy đủ avatar lớn, mã NV, email, huy hiệu chức vụ, nút "Xem hồ sơ" và nút "Đăng xuất" màu đỏ nổi bật.
- **Tương tác chuẩn mực (Click Outside & Escape):** Tự động đóng popup khi click ra ngoài hoặc nhấn phím `Escape`.
- **Màn hình Đăng nhập Doanh nghiệp (LoginPage):** Thiết kế giao diện sang trọng, thanh lịch, có ô nhập tài khoản/mật khẩu, nút ẩn/hiện mật khẩu, thông báo cấp tài khoản nội bộ và **Bảng Đăng nhập Nhanh 1-Click (Admin / Quản lý / Nhân viên)** cực kỳ tiện lợi cho vận hành và kiểm thử.
- **Bảo vệ Định tuyến (Protected Route):** Bắt buộc người dùng đăng nhập mới được truy cập các màn hình nội bộ (`/schedule`, `/employees`, v.v.). Khi bấm Đăng xuất, xóa sạch token trong `localStorage` và chuyển hướng về `/login`.
- **Zero Regression:** Đảm bảo `npm run build` 0 lỗi TypeScript và toàn bộ unit test Vitest + JUnit đạt 100% Pass.

---

## 3. Lộ Trình Triển Khai (3 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Xây Dựng UserProfileDropdown Popover & Tích Hợp Nút Đăng Xuất Trên Topbar](./phase-01-user-profile-dropdown-and-logout.md) | Completed ✅ | 1.5h | Tạo component `UserProfileDropdown.tsx`, neo vào Avatar pill trên `Topbar.tsx`, xử lý click outside & phím Escape. |
| **Phase 2** | [Thiết Kế Màn Hình Đăng Nhập Doanh Nghiệp & Tính Năng 1-Click Quick Access](./phase-02-login-page-and-quick-access.md) | Completed ✅ | 1.5h | Xây dựng `LoginPage.tsx` tại `features/auth/`, form đăng nhập chuẩn, 3 nút 1-click login theo vai trò thực tế MySQL. |
| **Phase 3** | [Bảo Vệ Định Tuyến ProtectedRoute, Đồng Bộ Auth State & Kiểm Thử](./phase-03-protected-routes-and-end-to-end-verification.md) | Completed ✅ | 1.0h | Bỏ auto-login ngầm trong `useAuthStore`, tạo `ProtectedRoute`, kiểm thử luồng đăng xuất/đăng nhập và kiểm thử tự động. |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Accessibility (WCAG 2.1 AA):** Dropdown hỗ trợ đóng bằng phím `Escape`, thuộc tính `aria-haspopup="true"`, `aria-expanded` trên nút mở menu.
2. **Stateless JWT Security:** Đăng xuất xóa sạch `access_token` và `refresh_token` trong `localStorage`, ngăn chặn truy cập trái phép qua lịch sử trình duyệt.
3. **Smooth UX & Fast Dev:** Hỗ trợ 1-click Quick Access login cho 3 tài khoản mẫu (`admin`, `manager`, `employee`) với mật khẩu chuẩn `Admin@123`.
