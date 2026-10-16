# GIAI ĐOẠN 1: SỬA LỖI TYPESCRIPT, AUTO-AUTH BOOTSTRAP & LIVE ROLESWITCHER

**Mục tiêu:** Cấp phát JWT token tự động khi mở ứng dụng, kết nối thanh chuyển vai trò với API đăng nhập thực tế của Backend, và khắc phục toàn bộ 8 lỗi TypeScript để đưa ứng dụng về trạng thái biên dịch hoàn hảo.

**Thời lượng dự toán:** 2.5 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 1.1: Khắc phục triệt để 8 lỗi biên dịch TypeScript
- **Tập tin liên quan:**
  - `frontend/src/features/attendance/AttendanceOverviewPage.tsx`
  - `frontend/src/features/employees/EmployeeDetailPage.tsx`
  - `frontend/src/features/employees/EmployeeListPage.tsx`
  - `frontend/src/store/useAuthStore.ts`
  - `frontend/src/store/useScheduleStore.ts`
- **Nội dung sửa đổi:**
  1. `AttendanceOverviewPage.tsx`: Chỉnh sửa chữ ký gọi `fetchRecords` trong `useAttendanceStore` cho phép nhận 2 tham số `(dateStr?: string, departmentId?: number)`.
  2. `EmployeeDetailPage.tsx` & `EmployeeListPage.tsx`: Bổ sung thuộc tính `parentDepartmentId: null` và `managerId: null` vào hàm ánh xạ Department, tránh lỗi `Property missing in type`.
  3. `EmployeeDetailPage.tsx`: Loại bỏ thuộc tính `nationalId` không tồn tại trong kiểu `Employee` hoặc bổ sung vào kiểu `Employee` trong `domain.types.ts`.
  4. `useAuthStore.ts`: Loại bỏ import không dùng `UserInfo`.
  5. `useScheduleStore.ts`: Loại bỏ trường thừa `employmentType` trong ánh xạ `backendEmployees`, và chuẩn hóa `applicableDays: '1,2,3,4,5,6,7'` dạng chuỗi để khớp với `ShiftTemplate`.
- **Kiểm tra nghiệm thu:** Chạy `npm run build` không còn bất kỳ lỗi nào (`tsc -b && vite build` thành công).

---

### Nhiệm vụ 1.2: Triển khai Auto-Auth Bootstrap trong `useAuthStore`
- **Tập tin:** `frontend/src/store/useAuthStore.ts`
- **Mô tả logic:**
  - Khi ứng dụng khởi động và gọi `initAuth()`:
    - Nếu đã có `access_token` trong `localStorage`: Gọi `/api/v1/auth/me` để xác thực token.
    - Nếu **chưa có token** và đang chạy ở trình duyệt (`!isMockEnabled()`):
      - Tự động gọi API `authService.login({ username: 'admin', password: 'Admin@123' })`.
      - Nhận `access_token` thật từ Spring Boot, lưu vào `localStorage`.
      - Cập nhật `currentUser`, `currentRole = 'ROLE_ADMIN'`, `isAuthenticated = true`.
- **Kết quả đạt được:** Mọi request tiếp theo của ứng dụng đều có header `Authorization: Bearer <token>`, hoàn toàn chấm dứt tình trạng nhận lỗi `403 Forbidden` từ Spring Boot.

---

### Nhiệm vụ 1.3: Nâng cấp `RoleSwitcher.tsx` kết nối Live Authentication
- **Tập tin:**
  - `frontend/src/components/layout/RoleSwitcher.tsx`
  - `frontend/src/store/useAuthStore.ts`
- **Mô tả logic:**
  - Bổ sung hàm `switchRoleToBackend(role: RoleType): Promise<void>` trong `useAuthStore`.
  - Ánh xạ vai trò tương ứng với tài khoản MySQL đã seed sẵn:
    - `ROLE_ADMIN` -> Gọi login với `admin / Admin@123` (Nhân viên: Đinh Thị Uyên - ID 21)
    - `ROLE_DEPT_MANAGER` -> Gọi login với `manager / Admin@123` (Nhân viên: Nguyễn Văn An - ID 1)
    - `ROLE_EMPLOYEE` -> Gọi login với `employee / Admin@123` (Nhân viên: Trần Thị Bích - ID 2)
  - Khi người dùng bấm chuyển quyền trên Topbar:
    - Thực hiện đăng nhập lấy token mới của tài khoản đó.
    - Hiển thị Toast thông báo: *"Đã chuyển sang vai trò [Tên Vai Trò] (Tài khoản: [username])"*.
    - Làm mới dữ liệu các trang nghiệp vụ theo đúng phân quyền mới.

---

## 2. Tiêu Chí Nghiệm Thu Giai Đoạn 1
1. `npm run build` thành công 100% không còn lỗi TypeScript.
2. Mở trình duyệt `http://localhost:5173`, kiểm tra `localStorage.getItem('access_token')` có giá trị JWT hợp lệ.
3. Chuyển đổi vai trò trên Topbar thực hiện đổi token thật và cập nhật tên người dùng hiển thị đúng thông tin trong MySQL.
