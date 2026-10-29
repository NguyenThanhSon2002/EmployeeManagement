# Journal: Đăng ký tài khoản nhân viên mới (Dropdown Chi nhánh, Tự động tăng Mã NV, Mặc định Thử việc & Role Nhân viên)

- **Thời gian:** 2026-10-29 10:46 (UTC+7)
- **Tác vụ:** Hoàn thiện popup Đăng ký tài khoản mới và luồng xử lý từ Database đến Giao diện.

### 1. Thay đổi đã thực hiện
- **Database (Flyway Migration V18):**
  - Tạo Trigger `trg_employees_employee_code_auto` trên bảng `employees`: nếu `employee_code` trống/NULL thì tự động sinh mã `EMP-` + max(stt) + 1 (VD: `EMP-022`).
- **Backend (Spring Boot):**
  - Cập nhật [`EmployeeRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/repository/EmployeeRepository.java): Thêm `findAllEmpCodes()` và kiểm tra trùng số điện thoại.
  - Cập nhật [`EmployeeService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java):
    - Thêm `generateNextEmployeeCode()` đảm bảo tính toàn vẹn và tự sinh mã tăng dần.
    - Thêm phương thức `registerEmployee(RegisterRequest request)`: Tự động gán `positionId = 3` (Nhân viên), `roles = [ROLE_EMPLOYEE]`, `employmentStatus = "PROBATION"` (Thử việc).
  - Cập nhật [`AuthController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/auth/controller/AuthController.java) & [`SecurityConfig.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/security/config/SecurityConfig.java): Mở public hai API `GET /api/v1/auth/branches` và `POST /api/v1/auth/register`.
- **Frontend:**
  - Cập nhật [`authService.ts`](file:///D:/Project/Employee%20Management/frontend/src/shared/auth/authService.ts): Thêm gọi API `getPublicBranches()` và `register()`.
  - Cập nhật [`RegisterAccountModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/components/RegisterAccountModal.tsx):
    - Đổi ô nhập chi nhánh thành `<select>` lấy dữ liệu từ hệ thống.
    - Xóa trường nhập Mã NV (vì đã tự động tăng).
    - Màn hình kết quả hiển thị thông tin tài khoản vừa cấp kèm nút sao chép và nút "Đăng nhập ngay".
  - Cập nhật [`LoginPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/auth/LoginPage.tsx): Tự động điền tài khoản vừa tạo khi bấm "Đăng nhập ngay".

### 2. Kết quả kiểm tra
- Backend: Compile thành công trên JDK 21 (`BUILD SUCCESS`), kiểm tra test pass.
- Frontend: `tsc -b && vite build` hoàn tất không lỗi (`✓ built in 345ms`).
