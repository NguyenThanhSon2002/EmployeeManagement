# Phase 3: Bảo Vệ Định Tuyến ProtectedRoute, Đồng Bộ Auth State & Kiểm Thử

**Mã giai đoạn:** `PHASE-03`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.0 giờ  
**Mục tiêu chính:** Hoàn thiện cơ chế bảo vệ định tuyến `ProtectedRoute`, gỡ bỏ đăng nhập ngầm không mong muốn trong `useAuthStore`, viết bài kiểm thử cho Dropdown & Login, và kiểm tra toàn diện hệ thống.

---

## 1. Các File Cần Chỉnh Sửa & Kiểm Thử

1. [`frontend/src/shared/auth/useAuthStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/shared/auth/useAuthStore.ts)
2. [`frontend/src/routes/AppRoutes.tsx`](file:///D:/Project/Employee%20Management/frontend/src/routes/AppRoutes.tsx)
3. [`frontend/src/features/auth/__tests__/login-flow.test.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/__tests__/login-flow.test.tsx)
4. [`frontend/src/components/layout/__tests__/UserProfileDropdown.test.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/__tests__/UserProfileDropdown.test.tsx)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Refactor `useAuthStore.ts`
- **Gỡ bỏ tự động login làm admin khi không có token:**
  ```typescript
  initAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const user = await authService.getCurrentUser();
        ...
        set({ token, isAuthenticated: true, ... });
        return;
      } catch (err) {
        authService.logout();
      }
    }
    // Không tự động đăng nhập ngầm nữa
    set({ token: null, isAuthenticated: false, isLoading: false });
  }
  ```
- **Hàm `logout()`:**
  - Xóa token khỏi `localStorage`, đặt `isAuthenticated: false, token: null`.

### Bước 2: Thiết lập `ProtectedRoute` trong `AppRoutes.tsx`
- Tạo wrapper component `ProtectedRoute`:
  ```tsx
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
    return <>{children}</>;
  };
  ```
- Tại `AppRoutes.tsx`:
  - Route `/login` được mở công khai (Public Route). Nếu đã `isAuthenticated` thì redirect sang `/schedule`.
  - Toàn bộ các route nội bộ (`/schedule`, `/dashboard`, `/employees`, `/attendance`, `/reports`, `/settings`) được bảo vệ bằng `<ProtectedRoute>`.

### Bước 3: Viết Bài Kiểm Thử Tự Động (Unit Tests)
- Viết test kiểm tra `UserProfileDropdown`:
  - Render đúng thông tin cá nhân của người dùng đang đăng nhập.
  - Bấm nút "Đăng xuất" gọi callback `onLogout`.
  - Bấm phím Escape gọi `onClose`.
- Viết test kiểm tra `LoginPage`:
  - Render form đăng nhập và 3 nút 1-Click login.
  - Nhập sai mật khẩu hiển thị thông báo lỗi.

### Bước 4: Kiểm tra Toàn Diện & Build Verification
1. `npm test -- --run`: Đảm bảo toàn bộ test suites đều Pass 100%.
2. `npm run build`: Đảm bảo 0 lỗi TypeScript, build thành công dưới 500ms.
3. `mvn test-compile`: Kiểm tra backend sẵn sàng.

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [x] Truy cập đường dẫn bất kỳ khi chưa đăng nhập sẽ tự động chuyển hướng về `/login`.
- [x] Đăng nhập thành công sẽ lưu token và mở ra giao diện làm việc chính.
- [x] Bấm nút "Đăng xuất" trong Avatar dropdown sẽ xóa token và quay trở lại màn hình `/login`.
- [x] Cả 3 nút 1-Click Demo Login (`admin`, `manager`, `employee`) hoạt động trơn tru.
- [x] Lệnh `npm run build` và `npm test` đều xanh 100% (50/50 tests passed).
