# GIAI ĐOẠN 1: CẤU HÌNH DUAL-MODE, XÁC THỰC JWT & DANH MỤC NHÂN SỰ, PHÒNG BAN

**Mục tiêu:** Thiết lập cấu hình môi trường Dual-Mode cho Frontend, đồng bộ hoàn chỉnh quy trình đăng nhập/phiên làm việc với JWT thật từ Backend, và chuyển đổi các màn hình Danh mục Nhân sự & Phòng ban sang gọi REST API MySQL.

**Thời lượng dự toán:** 5 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 1.1: Thiết lập Cấu hình Môi trường & Adapter Dual-Mode
- **Tập tin:**
  - `frontend/.env.development`
  - `frontend/.env.production`
  - `frontend/src/config/env.config.ts`
- **Mô tả:**
  - Cấu hình `VITE_API_BASE_URL=/api/v1` và `VITE_USE_MOCK=false`.
  - Cung cấp hàm tiện ích `isMockEnabled()` kiểm tra trạng thái mock.

### Nhiệm vụ 1.2: Chuẩn hóa Backend theo Khuyến nghị Code Review
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/security/service/UserPrincipal.java`
  - `backend/src/main/java/com/company/hrms/security/service/CustomUserDetailsService.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/controller/AttendanceController.java`
- **Mô tả:**
  - Lưu trữ `employeeId` trực tiếp vào `UserPrincipal` khi nạp chi tiết người dùng, tránh nhầm lẫn giữa `users.id` và `employees.id`.
  - Làm phẳng phản hồi `getAttendanceRecords` trả về `PageResponse<AttendanceRecordDto>` trực tiếp.

### Nhiệm vụ 1.3: Đấu nối Xác thực & Quản lý Phiên (`useAuthStore`)
- **Tập tin:**
  - `frontend/src/store/useAuthStore.ts`
  - `frontend/src/services/authService.ts`
  - `frontend/src/components/layout/Topbar.tsx`
- **Mô tả:**
  - Viết hàm `login(username, password)` gọi `authService.login()`, lưu token vào `localStorage`.
  - Lấy thông tin người dùng thật qua `authService.getCurrentUser()` (`/api/v1/auth/me`).
  - Hỗ trợ fallback sang mock nếu `VITE_USE_MOCK=true` hoặc máy chủ BE không hoạt động.

### Nhiệm vụ 1.4: Đấu nối Danh mục Nhân sự & Phòng ban
- **Tập tin:**
  - `frontend/src/features/employees/EmployeeListPage.tsx`
  - `frontend/src/features/employees/EmployeeDetailPage.tsx`
  - `frontend/src/services/employeeService.ts`
- **Mô tả:**
  - Lấy danh sách nhân viên từ `GET /api/v1/employees` có phân trang và tìm kiếm.
  - Lấy danh sách phòng ban từ `GET /api/v1/departments`.
  - Tạo mới nhân viên qua `POST /api/v1/employees` và cập nhật trực tiếp vào MySQL.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Đăng nhập với tài khoản `admin` / `Admin@123` trên giao diện FE thành công, nạp đúng họ tên và vai trò từ MySQL.
2. Màn hình Quản lý nhân viên hiển thị đúng 20 nhân sự đã seed sẵn trong MySQL.
3. Thêm mới một nhân viên trên FE -> Dữ liệu được ghi nhận vào bảng `employees` trong MySQL.
4. Chạy `npm test` trong `frontend/` bảo đảm 35 bài test Vitest vẫn pass 100%.
