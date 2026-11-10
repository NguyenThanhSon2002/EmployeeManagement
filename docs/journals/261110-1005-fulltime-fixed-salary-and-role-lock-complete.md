# Journal: Hoàn Thành Lương Cứng Full-Time & Phân Quyền Khóa Chỉnh Sửa

- **Thời gian**: 2026-11-10 10:05
- **Tác giả**: Antigravity Assistant
- **Trạng thái**: Đã hoàn thành (100% tests pass)

---

## 1. Tóm tắt kết quả triển khai

### A. Lương Full-time là Lương cứng (Fixed Base Salary)
- **Engine**: Trong [`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java):
  - Khi nhân viên là `FULL_TIME` hoặc `MONTHLY`: Lấy trọn vẹn mức lương cơ bản trong hợp đồng `basePay = baseSalary`, không nhân tỷ lệ theo giờ công thực tế.
  - Giờ công chuẩn mặc định 8h/ngày (26 ngày = 208h).
  - Không tự động trừ ngày nghỉ không lương vào lương cứng; nếu có phạt/nghỉ thì quản lý/admin ghi nhận vào mục Phạt/Khấu trừ riêng.

### B. Công thức Lương Thực Nhận (Net Pay) toàn hệ thống
$$\text{Lương Thực Nhận} = \text{Lương Cứng} + (\text{Giờ Part-time ngày} \times \text{Lương Part-time ngày}) + (\text{Giờ Part-time đêm} \times \text{Lương Part-time đêm}) + \text{Thưởng} + \text{Phụ cấp} - \text{Phạt/Khấu trừ}$$
- Đảm bảo Lương Thực Nhận hiển thị và chi trả bằng đúng tổng các khoản thu nhập trừ khấu trừ, không tự động cấn trừ BHXH/Thuế TNCN.

### C. Phân quyền bảo mật 2 lớp (RBAC - Frontend & Backend)
1. **Frontend** ([`EditPayrollItemModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/components/EditPayrollItemModal.tsx)):
   - Kiểm tra `canEditFullTime = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_DIRECTOR'`.
   - Nếu không phải Admin hoặc Giám đốc: 2 ô Giờ công Full-time và Tiền lương Full-time bị khóa (`disabled={true}`), nền xám `#F1F5F9`, hiển thị biểu tượng ổ khóa 🔒 cùng nhãn *"Khóa"* / *"Chỉ Giám đốc/Admin sửa"*.
   - Quản lý vẫn toàn quyền chỉnh sửa các ô: Giờ Part-time, Lương Part-time, Ca đêm, Phụ cấp, Thưởng, Phạt.
2. **Backend Security** ([`PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java) & [`PayrollController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java)):
   - `@PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN', 'MANAGER', 'HR_MANAGER', 'DEPT_MANAGER')")`.
   - Nếu người gọi là Quản lý (`isManager && !isDirectorOrAdmin`), backend tự động bảo toàn giờ công và lương cứng Full-time cũ (`request.setActualHours(item.getActualHours())`, `request.setBasePay(item.getBasePay())`). Quản lý không thể giả mạo payload để thay đổi lương cứng.

---

## 2. Kết quả kiểm thử & Xác thực
1. **Unit tests backend**:
   - `mvn test -Dtest=PayrollCalculationEngineTest` đạt **9/9 tests pass (BUILD SUCCESS)**.
2. **Build frontend**:
   - `npm run build` hoàn thành trong 7.00s với **0 lỗi TypeScript**.
3. **Docker containers**:
   - `docker compose up -d --build` cả backend và frontend thành công.
4. **Kiểm thử API tự động đa vai trò**:
   - **Admin**: Cập nhật lương cứng 25.000.000đ và part-time 500.000đ $\rightarrow$ Lương cứng = 25.000.000đ, Net = 26.900.000đ (**PASS**).
   - **Manager**: Cố gắng sửa lương cứng thành 99.999.999đ và part-time 800.000đ $\rightarrow$ Lương cứng được bảo toàn 25.000.000đ, Part-time cập nhật 800.000đ, Net = 27.200.000đ (**PASS**).
