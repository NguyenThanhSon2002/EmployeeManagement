# Phase 1: Xây Dựng Directory Store & Khử Phụ Thuộc Auth Khỏi Mock

**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 2.0h  
**Phạm vi file tác động:**
- `frontend/src/shared/directory/useDirectoryStore.ts` (Tạo mới)
- `frontend/src/shared/auth/useAuthStore.ts`
- `frontend/src/App.tsx`

---

## 1. Mục Tiêu Chi Tiết

1. **Tạo `useDirectoryStore`:**
   - Quản lý danh sách: `employees: Employee[]`, `departments: Department[]`, `positions: Position[]`.
   - Cung cấp action `fetchDirectory()`: Gọi song song `employeeService.getEmployees()`, `departmentService.getAllDepartments()`, và nạp danh mục chức danh từ Backend.
   - Cung cấp selector tiện ích:
     - `getEmployeeById(id: number): Employee | undefined`
     - `getDepartmentById(id: number): Department | undefined`
     - `refreshEmployees()`: Làm mới danh sách khi có thêm/sửa nhân viên.
2. **Kích hoạt nạp Directory khi App khởi chạy (`App.tsx`):**
   - Gọi `fetchDirectory()` ngay trong `useEffect` root để toàn bộ app có sẵn dữ liệu nhân viên và phòng ban thật từ MySQL.
3. **Refactor `useAuthStore.ts`:**
   - Xóa bỏ `import { MOCK_EMPLOYEES } from '@/mocks/employees.mock'`.
   - Khởi tạo `currentUser` bằng đối tượng rỗng an toàn hoặc lấy từ `authService.getCurrentUser()`.
   - Khi đăng nhập hoặc đổi role bằng `RoleSwitcher`, gán `currentUser` bằng nhân viên thật lấy từ `useDirectoryStore` dựa trên `res.user.employee_id`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] `useDirectoryStore` gọi thành công API backend, nạp đầy đủ 12 nhân viên từ MySQL (bao gồm `EMP-991` Nguyễn Thanh Sơn).
- [ ] `useAuthStore` không còn phụ thuộc vào `mocks/employees.mock.ts`.
- [ ] Chuyển đổi vai trò Admin / Manager / Nhân viên trên Topbar vẫn cấp phát token thật và hiển thị đúng tên nhân sự tương ứng từ DB.
