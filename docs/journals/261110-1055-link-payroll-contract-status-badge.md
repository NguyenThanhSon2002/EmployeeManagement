# Nhật Ký Phát Triển: Liên Kết Trạng Thái Hợp Đồng Nhân Viên Vào Bảng Lương

- **Thời gian:** 10:55 10/11/2026
- **Mục tiêu:** Đồng bộ cột "Loại HĐ" trong Bảng lương ([`PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx)) liên kết với cột "Trạng Thái" trong danh sách nhân sự ([`EmployeeTable.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/list/EmployeeTable.tsx)).

## Những Thay Đổi Đã Thực Hiện

### 1. Backend DTO & Service Mapping
- **[`PayrollItemDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/PayrollItemDto.java)** & **[`MyPayslipResponse.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/MyPayslipResponse.java)**:
  - Bổ sung trường `@JsonProperty("employment_status") private String employmentStatus;` cùng getter & setter.
- **[`PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java)**:
  - Khi gom dữ liệu phiếu lương (`getPayrollDetails`, `updatePayrollItem`, `getMyPayslip`), map trực tiếp `employmentStatus` từ hồ sơ nhân viên (`Employee.getEmploymentStatus()`).
  - Thêm `payrollItemRepository.flush()` sau khi xóa các item cũ khi tính lại bảng lương để tránh lỗi duplicate key `uk_payroll_item_emp`.
- **[`PayrollRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/repository/PayrollRepository.java)**:
  - Thêm cặp ngoặc đơn chuẩn hóa điều kiện `((:branchId IS NULL AND p.branchId IS NULL) OR p.branchId = :branchId)` cho `findByPeriodAndBranch`.
- **[`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java)**:
  - Nhân sự đã nghỉ việc (`RESIGNED`) không có giờ công thực tế trong kỳ (`actualHours == 0`) sẽ không tính lương cứng hoặc thưởng chuyên cần, trả về mức lương = 0đ chính xác.
- **[`PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java)**:
  - Thêm test `testResignedEmployee_ZeroHours_ReceivesZeroSalary()` kiểm tra nhân sự nghỉ việc nhận lương 0đ. 10/10 test đều PASS.

### 2. Frontend UI Synchronization
- **[`payroll.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/types/payroll.types.ts)**:
  - Bổ sung trường `employment_status?: string;` vào interface `PayrollItem` và `MyPayslip`.
- **[`PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx)**:
  - Đổi tiêu đề cột từ `"Loại HĐ"` thành `"Trạng Thái"`.
  - Hiển thị badge trạng thái chuẩn màu sắc theo [`EmployeeTable.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/list/EmployeeTable.tsx):
    - `• Chính thức` (badge xanh lá `badge badge-success`)
    - `• Đã nghỉ việc` (badge đỏ `badge badge-error`)
    - `• Thử việc` (badge vàng `badge badge-warning`)
    - `• Nghỉ chế độ` (badge xanh dương `badge badge-info`)
  - Chú thích loại hợp đồng bên dưới badge: `Full-time` / `Part-time`.
  - Hiệu ứng dòng nhân viên nghỉ việc: `opacity: 0.6`, `backgroundColor: '#F8FAFC'`.
- **[`EditPayrollItemModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/components/EditPayrollItemModal.tsx)** & **[`MyPayslipPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/MyPayslipPage.tsx)**:
  - Cập nhật hiển thị trạng thái hợp đồng tiếng Việt kèm loại hợp đồng.

### 3. Kết quả xác thực
- API `/api/v1/payrolls/generate` và `/api/v1/payrolls/2` trả về đầy đủ `employment_status`.
- Nhân viên `EMP-101` (Triệu Vy) hiển thị badge **`• Đã nghỉ việc`** với lương 0đ và dòng được làm mờ đúng chuẩn.
- Các nhân viên còn lại hiển thị badge **`• Chính thức`**.
