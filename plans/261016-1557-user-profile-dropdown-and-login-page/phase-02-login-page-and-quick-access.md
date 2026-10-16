# Phase 2: Thiết Kế Màn Hình Đăng Nhập Doanh Nghiệp & Tính Năng 1-Click Quick Access

**Mã giai đoạn:** `PHASE-02`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.5 giờ  
**Mục tiêu chính:** Xây dựng màn hình Đăng nhập `LoginPage.tsx` tại `frontend/src/features/auth/` theo chuẩn phong cách doanh nghiệp, hỗ trợ form đăng nhập chuẩn mực và bảng đăng nhập nhanh 1-Click cực kỳ tiện ích.

---

## 1. Các File Cần Tạo Mới & Chỉnh Sửa

1. **Tạo mới:** [`frontend/src/features/auth/LoginPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/LoginPage.tsx)
2. **Chỉnh sửa:** [`frontend/src/routes/route-paths.ts`](file:///D:/Project/Employee%20Management/frontend/src/routes/route-paths.ts)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Khai báo Route Path `/login`
Trong [`route-paths.ts`](file:///D:/Project/Employee%20Management/frontend/src/routes/route-paths.ts):
```typescript
export const ROUTE_PATHS = {
  LOGIN: '/login',
  HOME: '/',
  SCHEDULE: '/schedule',
  ...
} as const;
```

### Bước 2: Thiết kế `LoginPage.tsx`
- **Giao diện & Bố cục:**
  - Nền trang thanh lịch với gradient nhẹ và họa tiết lưới kỹ thuật (`var(--color-bg)`).
  - Khung Đăng nhập (Card) đặt tại vị trí trung tâm màn hình, đổ bóng sang trọng `var(--shadow-xl)`.
  - **Banner Thương Hiệu:**
    - Logo biểu tượng `CalendarCheck2` hoặc `Building2`.
    - Tiêu đề: **HỆ THỐNG QUẢN LÝ PHÂN CA & NHÂN SỰ**.
    - Mô tả phụ: *"Giải pháp xếp ca thông minh tuân thủ Luật Lao Động Việt Nam 2019"*.
  - **Form Đăng Nhập Tiêu Chuẩn:**
    - Trường **Tài khoản:** Input có icon `User`, placeholder *"Nhập username (ví dụ: admin, manager)"*.
    - Trường **Mật khẩu:** Input có icon `Lock`, nút Bật/Tắt con mắt ẩn hiện mật khẩu (`Eye` / `EyeOff`).
    - Hộp kiểm *"Ghi nhớ đăng nhập"*.
    - Nút bấm **"Đăng nhập hệ thống"** (`btn btn-primary`, full width, có spinner loading khi đang xác thực).
    - Hộp cảnh báo lỗi màu đỏ nếu API trả về 401 Unauthorized (sai tài khoản/mật khẩu).
  - **Khu Vực "Đăng Nhập Nhanh 1-Click" (Quick Access Helper):**
    - Hộp viền nét đứt màu xanh nhạt hoặc tím: *"⚡ Trải nghiệm nhanh với các tài khoản mẫu"*
    - 3 nút bấm phân loại rõ ràng:
      - 🛡️ **Quản trị viên (ADMIN):** Điền `admin` & `Admin@123` -> Tự động đăng nhập.
      - 👔 **Trưởng phòng (MANAGER):** Điền `manager` & `Admin@123` -> Tự động đăng nhập.
      - 👤 **Nhân viên (EMPLOYEE):** Điền `employee` & `Admin@123` -> Tự động đăng nhập.
  - **Thông Báo Quy Trình Đăng Ký Tài Khoản:**
    - Ghi chú: *"Tài khoản hệ thống HRMS được cấp phát nội bộ bởi Phòng Nhân sự. Để yêu cầu tài khoản mới, vui lòng liên hệ Bộ phận IT/HR."*

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Giao diện `LoginPage.tsx` hiển thị sắc nét, chuẩn responsive trên cả Desktop và Laptop.
- [ ] Nhập tài khoản và mật khẩu đúng gọi API `POST /api/v1/auth/login`, nhận JWT token và lưu vào `localStorage`.
- [ ] Bấm các nút 1-Click tự động đăng nhập tức thì vào vai trò tương ứng.
- [ ] Nhập sai thông tin hiển thị thông báo lỗi thân thiện.
