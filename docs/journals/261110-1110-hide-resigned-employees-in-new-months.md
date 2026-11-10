# Nhật Ký Phát Triển: Ẩn Nhân Sự Đã Nghỉ Việc Khi Sang Tháng Mới

- **Thời gian:** 11:10 10/11/2026
- **Mục tiêu:** Đáp ứng yêu cầu người dùng: "Với nhân sự đã nghỉ việc thì hãy chỉ hiển thị nốt tháng đang làm việc thôi, còn lại sang tháng mới hãy bỏ hiển thị người này đi."

## Các Thay Đổi Đã Thực Hiện

### 1. Database Migration
- **[`V31__set_resignation_date_for_resigned_employees.sql`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration/V31__set_resignation_date_for_resigned_employees.sql)**:
  - Cập nhật ngày nghỉ việc `resignation_date = '2026-11-10'` cho nhân viên `EMP-101` (Triệu Vy) và các nhân viên trạng thái `RESIGNED` chưa có ngày nghỉ việc.

### 2. Backend Logic
- **[`PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java)**:
  - Trong hàm `generatePayroll`: Lọc danh sách nhân viên tham gia tính lương `targetEmployees`:
    - Loại bỏ nhân viên có ngày vào làm sau kỳ lương (`hireDate > periodEnd`).
    - Đối với nhân sự `RESIGNED` hoặc có `resignationDate`:
      - Nếu `resignationDate.isBefore(periodStart)`: Đã nghỉ việc trước kỳ lương này $\rightarrow$ **Loại bỏ hoàn toàn khỏi bảng lương** ("sang tháng mới hãy bỏ hiển thị").
      - Nếu `resignationDate` nằm trong kỳ lương (`periodStart <= resignationDate <= periodEnd`): **Giữ lại trong kỳ lương này** để quyết toán đợt cuối và hiển thị nốt tháng đang làm việc.
      - Nếu chưa có ngày nghỉ việc cụ thể: Chỉ hiển thị nếu có phát sinh công làm việc trong tháng.
- **[`EmployeeService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java)**:
  - Tự động gán `resignationDate = LocalDate.now()` khi nhân viên được chuyển sang trạng thái `RESIGNED` nếu chưa có ngày cụ thể.
  - Reset `resignationDate = null` khi nhân sự được chuyển về trạng thái `OFFICIAL` / `PROBATION`.

### 3. Frontend Form & Domain Types
- **[`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts)** & **[`employeeMapper.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/api/employeeMapper.ts)**:
  - Bổ sung trường `resignationDate?: string | null;` vào domain `Employee` và mapper hai chiều với API backend.
- **[`useEmployeeForm.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/hooks/useEmployeeForm.ts)**:
  - Bổ sung `resignationDate` vào `EmployeeFormData`, tự động điền khi mở modal và gửi lên API khi submit.
- **[`EmployeeContractFields.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/form/EmployeeContractFields.tsx)**:
  - Khi chọn trạng thái "Đã nghỉ việc" (`RESIGNED`), tự động hiển thị ô nhập **"Ngày Nghỉ Việc (Chấm dứt HĐ)"** kèm giải thích rõ ràng cho người dùng.

## Kết Quả Kiểm Thử
- **Tháng 11/2026 (Tháng nghỉ việc):** `EMP-101` (Triệu Vy) hiển thị nốt dòng lương với badge `• Đã nghỉ việc` (tổng 7 nhân sự).
- **Tháng 12/2026 (Sang tháng mới):** Bảng lương tự động loại trừ `EMP-101`, chỉ hiển thị 6 nhân sự đang làm việc.
