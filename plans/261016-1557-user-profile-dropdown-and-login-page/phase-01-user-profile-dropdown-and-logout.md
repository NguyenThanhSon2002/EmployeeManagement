# Phase 1: Xây Dựng UserProfileDropdown Popover & Tích Hợp Nút Đăng Xuất Trên Topbar

**Mã giai đoạn:** `PHASE-01`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.5 giờ  
**Mục tiêu chính:** Xây dựng component `UserProfileDropdown.tsx` mở ra khi click vào Avatar capsule trên Topbar, hiển thị thẻ hồ sơ sắc nét, nút xem trang cá nhân và nút Đăng xuất màu đỏ.

---

## 1. Các File Cần Tạo Mới & Chỉnh Sửa

1. **Tạo mới:** [`frontend/src/components/layout/UserProfileDropdown.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/UserProfileDropdown.tsx)
2. **Chỉnh sửa:** [`frontend/src/components/layout/Topbar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/Topbar.tsx)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Xây dựng Component `UserProfileDropdown.tsx`
- **Props:**
  - `isOpen: boolean`
  - `user: Employee`
  - `role: RoleType`
  - `onClose: () => void`
  - `onLogout: () => void`
  - `onViewProfile: () => void`
- **Cấu trúc giao diện:**
  - Vị trí: `position: absolute; right: 0; top: calc(100% + 8px); width: 280px; z-index: 1000`.
  - Hiệu ứng: Bóng đổ `var(--shadow-lg)`, bo góc `var(--radius-lg, 12px)`, viền mỏng `var(--color-border)`.
  - **Header Hồ Sơ:**
    - Avatar 44x44px có viền mỏng.
    - Họ và tên in đậm (`14.5px, #0F172A`).
    - Mã nhân viên và Email (`12px, #64748B`).
    - Huy hiệu vai trò:
      - `ROLE_ADMIN` -> `Quản trị viên (ADMIN)` màu tím/xanh dương.
      - `ROLE_HR_MANAGER` -> `Trưởng phòng NS (HR)` màu xanh ngọc.
      - `ROLE_DEPT_MANAGER` -> `Trưởng bộ phận` màu cam.
      - `ROLE_EMPLOYEE` -> `Nhân viên` màu xám.
  - **Menu Items:**
    - Item 1: **"Hồ sơ của tôi"** (Icon `User`), click gọi `onViewProfile` -> điều hướng đến `/employees/${user.id}`.
    - Item 2: **"Cài đặt hệ thống"** (Icon `Settings`), hiển thị nếu vai trò là `ADMIN` -> điều hướng `/settings`.
  - **Footer Action:**
    - Nút **"Đăng xuất"** (Icon `LogOut` màu đỏ `#DC2626`):
      - Bấm kích hoạt `onLogout()`.
- **Sự kiện Tương tác Thông minh:**
  - Lắng nghe sự kiện `mousedown` trên `document`: nếu click ra ngoài container dropdown -> tự động gọi `onClose()`.
  - Lắng nghe sự kiện `keydown`: nếu phím là `Escape` -> tự động gọi `onClose()`.

### Bước 2: Tích hợp vào `Topbar.tsx`
- Chuyển thẻ người dùng từ `<div>` tĩnh thành container có thể tương tác (`cursor: pointer`, hiệu ứng hover nhẹ, thêm icon mũi tên nhỏ `ChevronDown` xoay khi mở).
- Quản lý state mở/đóng:
  ```typescript
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  ```
- Kết nối sự kiện đăng xuất:
  ```typescript
  const handleLogout = () => {
    setIsDropdownOpen(false);
    useAuthStore.getState().logout();
    addToast({
      type: 'info',
      title: 'Đã đăng xuất',
      message: 'Phiên làm việc đã kết thúc. Hẹn gặp lại bạn!',
    });
    navigate('/login');
  };
  ```

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bấm vào thẻ Avatar trên Topbar hiển thị mượt mà Dropdown popover bên dưới.
- [ ] Click ra ngoài hoặc bấm `Escape` sẽ đóng Dropdown.
- [ ] Nút "Hồ sơ của tôi" chuyển hướng chính xác đến trang lý lịch cá nhân của nhân viên đó.
- [ ] Nút "Đăng xuất" kích hoạt xóa token và chuẩn bị chuyển hướng người dùng.
