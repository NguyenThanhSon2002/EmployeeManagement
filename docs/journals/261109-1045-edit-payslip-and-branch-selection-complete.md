# Nhật ký hoàn thành: Chỉnh sửa thông tin phiếu lương & Nâng cấp chọn chi nhánh

**Thời gian:** 09/11/2026 - 10:45 (GMT+7)  
**Tác vụ:** Hoàn thành thực thi toàn bộ kế hoạch `plans/261109-1033-edit-payslip-and-branch-selection`  
**Nhánh Git:** `dev`  

---

## 1. Tóm tắt kết quả đạt được

Đã triển khai thành công 100% các tính năng theo yêu cầu của người dùng:

1. **Cho phép Quản lý cơ sở (`ROLE_MANAGER`) và Giám đốc (`ROLE_DIRECTOR`) chỉnh sửa thông tin chi tiết phiếu lương nhân viên** trước khi duyệt chốt kỳ lương:
   - Các trường điều chỉnh: Số giờ làm việc thực tế, số giờ làm đêm, lương cơ bản theo công, tiền thưởng chuyên cần / thưởng nóng, phụ cấp cố định, khấu trừ phạt đi muộn, khấu trừ nghỉ không lương.
   - Bắt buộc nhập **Ghi chú giải trình** để lưu vết kiểm toán (Audit Trail) phục vụ đối soát minh bạch.

2. **Cơ chế tự động tính lại toàn diện (Full Recalculation Engine):**
   - Khi có bất kỳ sự thay đổi nào về giờ làm việc, thưởng hay giảm trừ phạt:
     - `grossSalary` được tính lại chính xác: `basePay + nightPay + attendanceBonus + allowancesTotal - deductionLate - deductionUnpaidLeave`.
     - `insuranceDeduction` (10.5%) được tính lại nếu là Full-time.
     - `taxDeduction` (Thuế TNCN lũy tiến 7 bậc) tự động tính toán lại dựa trên thu nhập tính thuế mới sau khi trừ giảm trừ bản thân (11 triệu VNĐ), người phụ thuộc (4.4 triệu VNĐ/người), tiền ăn trưa miễn thuế (tối đa 730k) và BHXH.
     - `netSalary` thực nhận phản ánh chính xác từng đồng chênh lệch.
     - Cập nhật lại tổng quỹ lương `totalGross` và `totalNet` của bảng lương kỳ cha (`Payroll`).

3. **Mở rộng quyền chọn và lọc chi nhánh:**
   - Dropdown chi nhánh trên thanh công cụ cho phép cả Quản lý cơ sở và Giám đốc lựa chọn chi nhánh để xem và tính lương.
   - Bổ sung bộ lọc chi nhánh nội bộ bảng đối soát (`Table Branch Filter`), giúp lọc nhanh nhân viên theo chi nhánh trực quan.

4. **Giao diện Modal 2 cột trực quan (`EditPayrollItemModal.tsx`):**
   - **Cột trái:** Form nhập liệu số giờ, thưởng, phạt và ô ghi chú bắt buộc.
   - **Cột phải:** Live Calculation Preview Card hiển thị so sánh tức thì trước vs sau khi sửa (Gross, BHXH, Thuế TNCN, Net thực nhận và số tiền chênh lệch $\pm\Delta$).

5. **Bảo mật và an toàn dữ liệu:**
   - Khóa chặt không cho phép sửa nếu bảng lương đã ở trạng thái `APPROVED` hoặc `LOCKED` (UI vô hiệu hóa nút sửa, Backend ném lỗi 400 `PAYROLL_LOCKED`).
   - Phân quyền nghiêm ngặt theo RBAC: Quản lý chỉ được phép sửa phiếu lương nhân viên thuộc cơ sở mình quản lý; Nhân viên (`ROLE_EMPLOYEE`) gọi API bị chặn 403 `FORBIDDEN`.

---

## 2. Danh sách tệp đã tạo mới và chỉnh sửa

### Backend
- **Tạo mới:** [`backend/src/main/java/com/company/hrms/modules/payroll/dto/UpdatePayrollItemRequest.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/UpdatePayrollItemRequest.java)
- **Chỉnh sửa:**
  - [`backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java)
  - [`backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java)
  - [`backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java)
  - [`backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java)

### Frontend
- **Tạo mới:** [`frontend/src/features/payroll/components/EditPayrollItemModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/components/EditPayrollItemModal.tsx)
- **Chỉnh sửa:**
  - [`frontend/src/features/payroll/types/payroll.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/types/payroll.types.ts)
  - [`frontend/src/features/payroll/api/payrollService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/api/payrollService.ts)
  - [`frontend/src/features/payroll/store/usePayrollStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/store/usePayrollStore.ts)
  - [`frontend/src/features/payroll/PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx)

---

## 3. Kết quả xác thực & kiểm thử

1. **Backend Unit Test:**
   - `mvn test -Dtest=PayrollCalculationEngineTest` $\rightarrow$ **7/7 tests passed**, 0 failures, 0 errors.
2. **Frontend Build:**
   - `npm run build` $\rightarrow$ Biên dịch TypeScript thành công, 0 lỗi linting/type.
3. **Docker Rebuild:**
   - Cả 2 container `hrms-backend` và `hrms-frontend` đã được rebuild và khởi chạy thành công.
4. **Live API E2E Verification:**
   - Đăng nhập tài khoản Quản lý / Giám đốc `EMP-021`.
   - Gửi yêu cầu PUT cập nhật phiếu lương `itemId = 1`: tăng `attendance_bonus` lên 800,000 VNĐ, thêm `deduction_late` 50,000 VNĐ kèm ghi chú đối soát.
   - Kết quả: Gross tự động cập nhật từ 26,530,000 $\rightarrow$ 26,780,000 VNĐ, Thuế TNCN tự động nhảy từ 1,391,250 $\rightarrow$ 1,428,750 VNĐ, Net thực nhận phản ánh chính xác 24,826,250 VNĐ.
   - Thử nghiệm tài khoản Nhân viên `EMP-002` gọi API chỉnh sửa $\rightarrow$ Bị chặn ngay lập tức với mã lỗi HTTP 403 `Forbidden`.
