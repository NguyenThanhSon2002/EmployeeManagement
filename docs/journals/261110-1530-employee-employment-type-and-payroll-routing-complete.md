# Ký Sự Triển Khai: Quản Lý Hình Thức Nhân Sự (Full-time / Part-time) & Định Tuyến Giờ Lương Tự Động

- **Ngày thực hiện**: 10/11/2026
- **Trạng thái**: Hoàn thành 100%
- **Kế hoạch tham chiếu**: [`plans/261110-1512-employee-employment-type-and-payroll-routing/plan.md`](file:///D:/Project/Employee%20Management/plans/261110-1512-employee-employment-type-and-payroll-routing/plan.md)

---

## 1. Mục Tiêu & Bối Cảnh

Hệ thống cần quản lý rõ ràng nhân sự làm việc theo hình thức **Toàn thời gian (Full-time)** hay **Bán thời gian (Part-time)** ngay tại module Nhân sự. Từ đó:
1. Phân định rõ ràng trên giao diện danh sách nhân sự (thêm cột riêng biệt "Hình Thức").
2. Quản lý phân quyền chặt chẽ (RBAC): Chỉ Giám đốc và Admin mới có quyền đổi hình thức làm việc giữa Full-time và Part-time; Quản lý cơ sở và nhân viên bị khóa không thể tự ý sửa đổi.
3. Khi chọn Part-time, cho phép nhập mức lương theo giờ (VNĐ/h) với giá trị mặc định là 35.000 đ/h.
4. Tự động đồng bộ sang bảng hợp đồng lương `salary_contracts` (`salary_type = 'HOURLY'` kèm `hourly_rate` cho Part-time; `salary_type = 'MONTHLY'` kèm `base_salary` cho Full-time).
5. Khi tính lương tự động (`generatePayroll`):
   - **Part-time**: Toàn bộ số giờ làm việc tổng hợp từ lịch phân ca đổ chính xác vào cột **Giờ công Part-time** (`part_time_hours`) và tính thành **Lương Part-time theo giờ** (`part_time_pay = part_time_hours * hourly_rate`). Ô **Giờ công Full-time** (`actual_hours`) và **Lương cứng** (`base_pay`) được đặt bằng 0.
   - **Full-time**: Nhận lương cứng cố định theo chức danh (`base_pay`), giờ làm từ lịch đổ vào `actual_hours`, các ô Part-time bằng 0.
   - **Ca đêm**: Cả hai hình thức đều được tự động cộng phụ cấp làm đêm 30% (`night_pay`) dựa trên số giờ làm đêm thực tế từ 22:00 đến 06:00 sáng hôm sau.

---

## 2. Các Thay Đổi Đã Thực Hiện

### Backend
1. **[`EmployeeDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/dto/EmployeeDto.java)**:
   - Bổ sung `@JsonProperty("hourly_rate") private BigDecimal hourlyRate;` kèm getter & setter.
2. **[`EmployeeService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java)**:
   - Inject `SalaryContractRepository salaryContractRepository`.
   - Bổ sung helper `syncSalaryContract` để tự động tạo/cập nhật hợp đồng lương khi tạo hoặc cập nhật nhân viên (xác lập `HOURLY` kèm `hourlyRate` hoặc `MONTHLY` kèm `baseSalary`).
   - Kiểm tra RBAC trong `updateEmployee`: Nếu có yêu cầu thay đổi `employmentType` mà người thao tác không phải Giám đốc / Admin thì lập tức ném exception `FORBIDDEN_EMPLOYMENT_TYPE_CHANGE` (HTTP 403).
   - Trong `toDto(Employee entity)`: Truy vấn hợp đồng active để trả về `hourlyRate` tương ứng.
3. **[`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java)**:
   - Sử dụng thống nhất cờ `isPartTime = "HOURLY".equalsIgnoreCase(salaryType) || "PART_TIME".equalsIgnoreCase(employee.getEmploymentType());`.
   - Cập nhật chuẩn hóa `standardHours`, `actualHours`, `partTimeHours`, `basePay`, `partTimePay`, `nightPay`, và tiêu chí xét thưởng chuyên cần cho nhân viên Part-time (đạt từ 80h trở lên).
4. **Unit Tests**:
   - [`PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java): Thêm test case `testPartTime_RoutesHoursToPartTimeAndCalculatesHourlyPay_WhenAttendanceEmpty`. Tổng cộng 13/13 tests passed 100%.
   - [`EmployeeBranchTransferTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/employee/EmployeeBranchTransferTest.java): Cập nhật mock `SalaryContractRepository`, 4/4 tests passed 100%.

### Frontend
1. **[`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts)**:
   - Export `EmploymentType = 'FULL_TIME' | 'PART_TIME';`.
   - Thêm `employmentType?: EmploymentType | string; hourlyRate?: number;` vào interface `Employee`.
2. **[`employeeMapper.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/api/employeeMapper.ts)**:
   - Map `hourlyRate` từ DTO sang Domain Model và ngược lại (`payload.hourly_rate = data.hourlyRate`).
3. **[`useEmployeeForm.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/hooks/useEmployeeForm.ts)**:
   - Thêm `employmentType` và `hourlyRate` vào `EmployeeFormData`, khởi tạo mặc định và gửi lên API qua `onSubmit`.
4. **[`EmployeeContractFields.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/form/EmployeeContractFields.tsx)**:
   - Thêm dropdown "Hình Thức Làm Việc" (`FULL_TIME` / `PART_TIME`), disabled kèm biểu tượng khóa `🔒 Khóa` nếu người dùng không phải Giám đốc (`!isDirector`).
   - Nếu chọn `PART_TIME`, hiển thị thêm ô nhập "Mức Lương Theo Giờ (VNĐ/h)" (mặc định 35.000 đ/h, bước nhảy 1.000 đ). Nếu là Full-time, hiển thị thông báo "💼 Lương cứng cố định theo hợp đồng chức danh".
5. **[`EmployeeTable.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/list/EmployeeTable.tsx)**:
   - Bổ sung cột riêng biệt `<th>Hình Thức</th>`.
   - Hiển thị badge:
     - Full-time: Badge xanh dương dịu mắt kèm icon `<Clock size={12}/> Full-time`.
     - Part-time: Badge màu hổ phách/cam kèm icon `<Briefcase size={12}/> Part-time`.
   - Cập nhật toàn bộ các hàng rỗng, đang tải, lỗi và hàng mở rộng sang `colSpan={9}`.

---

## 3. Kết Quả Kiểm Thử Thực Tế

1. **Docker Rebuild**:
   - `hrms-backend` và `hrms-frontend` đã được rebuild và restart khỏe mạnh.
2. **Kiểm tra RBAC Chặn Quản Lý Đổi Hình Thức Làm Việc**:
   - Dùng tài khoản `EMP-004` (Quản lý - ROLE_MANAGER) gửi request PUT đổi `employment_type`:
   - Kết quả: Server trả về lỗi chuẩn `403 Forbidden` (`FORBIDDEN_EMPLOYMENT_TYPE_CHANGE`: *"Chỉ Giám đốc hoặc Admin mới có quyền thay đổi hình thức làm việc (Full-time / Part-time)."*).
3. **Kiểm tra Cập nhật Nhân Viên Part-time qua Admin**:
   - Chuyển `EMP-003` (Gia Linh) sang `PART_TIME` với đơn giá `35.000 đ/h`.
   - Cập nhật thành công, API trả về `employment_type = 'PART_TIME'`, `hourly_rate = 35000`.
4. **Kiểm tra Sinh Bảng Lương Tháng 11/2026**:
   - `EMP-003` (Part-time):
     - `BasePay = 0` (lương cứng bằng 0).
     - `FT_Hours = 0` (giờ full-time bằng 0).
     - `PT_Hours = 31.00h` (tổng hợp đầy đủ từ lịch phân ca).
     - `PT_Pay = 1.085.000 đ` (31h * 35.000 đ/h).
     - `NightPay = 10.500 đ` (1h làm đêm * 35.000 * 30%).
     - `NetSalary = 2.125.500 đ` (gồm lương part-time + phụ cấp chuyên cần/ăn trưa).
   - Các nhân viên `FULL_TIME` khác (`EMP-001`, `EMP-002`, `EMP-021`, `EMP-153`, `EMP-101`, `EMP-308`):
     - `BasePay` giữ nguyên lương cứng (25tr, 15tr, 8.5tr).
     - `FT_Hours` nhận số giờ từ lịch phân ca.
     - `PT_Hours = 0`, `PT_Pay = 0`.
