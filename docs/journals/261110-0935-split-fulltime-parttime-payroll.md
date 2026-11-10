# Technical Journal: Phân Tách Ô Lương Full-Time & Part-Time & Định Dạng Tiền Tệ Dấu Chấm

- **Ngày thực hiện:** 2026-11-10
- **Phạm vi:** Phân hệ Tính Lương & Quản Lý Phiếu Lương (Payroll Management)
- **Tác vụ:** 
  1. Thêm định dạng dấu chấm ngăn cách hàng nghìn (`.`) cho tất cả các ô nhập tiền lương ([`CurrencyInput.tsx`](../../frontend/src/features/payroll/components/CurrencyInput.tsx)).
  2. Phân tách khối "Công & Lương" thành 3 cặp ô độc lập: Lương Full-time, Lương Part-time và Lương ca đêm ([`EditPayrollItemModal.tsx`](../../frontend/src/features/payroll/components/EditPayrollItemModal.tsx)).

---

## 1. Bối Cảnh & Vấn Đề
- Người dùng mong muốn khi nhập tiền lương có dấu chấm phân cách hàng nghìn (ví dụ: `25.000.000`, `730.000`, `50.000`) thay vì các số liền kề khó đọc từ `<input type="number">`.
- Đồng thời, người dùng muốn phân tách rõ ràng ô cho **Lương Full-time** và **Lương Part-time**, cho phép chỉnh sửa linh hoạt cả công và lương Full-time lẫn Part-time trên cùng một phiếu lương (phù hợp với các nhân sự kiêm nhiệm, hỗ trợ tăng cường ca part-time ngoài giờ).

---

## 2. Giải Pháp Triển Khai

### 2.1. Component Tiền Tệ Định Dạng Dấu Chấm ([`CurrencyInput.tsx`](../../frontend/src/features/payroll/components/CurrencyInput.tsx))
- Sử dụng `<input type="text" inputMode="numeric">` hỗ trợ bàn phím số trên mobile và desktop.
- Định dạng tức thì khi gõ: `num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')`.
- Thuật toán bảo toàn vị trí con trỏ thông minh (digit-counting algorithm) giúp khi gõ hoặc xóa ở giữa chuỗi không bị nhảy con trỏ về cuối.
- Tự động xóa `0` khi focus để người dùng gõ số mới nhanh chóng mà không cần ấn backspace.

### 2.2. Schema & Backend Engine
- **Migration V30 ([`V30__add_part_time_hours_and_pay_to_payroll_items.sql`](../../backend/src/main/resources/db/migration/V30__add_part_time_hours_and_pay_to_payroll_items.sql)):** Bổ sung 2 cột `part_time_hours` và `part_time_pay` vào bảng `payroll_items`.
- **Entity & DTOs ([`PayrollItem.java`](../../backend/src/main/java/com/company/hrms/modules/payroll/domain/PayrollItem.java), [`UpdatePayrollItemRequest.java`](../../backend/src/main/java/com/company/hrms/modules/payroll/dto/UpdatePayrollItemRequest.java), [`PayrollItemDto.java`](../../backend/src/main/java/com/company/hrms/modules/payroll/dto/PayrollItemDto.java), [`MyPayslipResponse.java`](../../backend/src/main/java/com/company/hrms/modules/payroll/dto/MyPayslipResponse.java)):** Bổ sung các trường và getters/setters tương ứng.
- **Engine ([`PayrollCalculationEngine.java`](../../backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java)):**
  - Công thức tính Gross:
    $$\text{Gross} = \text{basePay} + \text{partTimePay} + \text{nightPay} + \text{bonuses} + \text{allowances} - \text{latePenalties} - \text{unpaidLeave}$$
  - Hỗ trợ tự động tính lại `partTimePay = hourlyRate * partTimeHours` khi thay đổi giờ Part-time.
- **Unit Test ([`PayrollCalculationEngineTest.java`](../../backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java)):** 9/9 bài test thành công (100% pass).

### 2.3. Giao Diện Modal ([`EditPayrollItemModal.tsx`](../../frontend/src/features/payroll/components/EditPayrollItemModal.tsx))
- Khối "Công & Lương Theo Thời Gian Làm Việc" được chia thành 3 cặp ô:
  1. **Cặp 1 (Full-time):** Giờ công Full-time (h) + Ô lương công Full-time (VNĐ).
  2. **Cặp 2 (Part-time):** Giờ công Part-time (h) + Ô lương Part-time theo giờ (VNĐ).
  3. **Cặp 3 (Ca đêm):** Giờ làm việc đêm (22h-06h) + Ô lương làm thêm ca đêm (VNĐ).
- Toàn bộ các ô tiền lương (`basePay`, `partTimePay`, `nightPay`, phụ cấp, thưởng, phạt) đều tích hợp `CurrencyInput` hiển thị dấu chấm ngăn cách rõ ràng.

---

## 3. Kết Quả Kiểm Thử
- **Unit Tests:** `mvn test -Dtest=PayrollCalculationEngineTest` chạy thành công 9/9 tests.
- **Frontend Build:** `npm run build` không có lỗi TypeScript hay cảnh báo cú pháp nào.
- **Docker Deployment:** Cả `hrms-backend` và `hrms-frontend` đã được rebuild và chạy thành công trên cổng 8081 và 8082.
- **E2E Integration Test:** Chạy thành công cập nhật phiếu lương mẫu nhân viên Nguyễn Thu Phương với:
  - Lương Full-time: 25.000.000 VNĐ
  - Lương Part-time: 600.000 VNĐ (15h)
  - Gross: 27.080.000 VNĐ, Net: 25.081.250 VNĐ, trạng thái `CONFIRMED`.
