# Technical Journal: Fix Hourly Rate and Night Rate Payroll Calculation

- **Date:** 2026-11-10 16:20
- **Author:** Antigravity AI
- **Scope:** Payroll Recalculation Engine & EditPayrollItemModal Live Preview

## 1. Context & Problem Statement
- Khi người dùng mở modal chỉnh sửa phiếu lương (`EditPayrollItemModal.tsx`) cho nhân sự có làm việc ca đêm (ví dụ EMP-002: 20 giờ ca đêm) và nhập:
  - Đơn giá giờ part-time: 25.000 đ
  - Đơn giá làm thêm ca đêm: 35.000 đ
- Modal trước đó xem 2 ô này là **tổng tiền** (`part_time_pay` và `night_pay`) thay vì **đơn giá theo giờ**, dẫn đến kết quả xem trước thực nhận bị sai lệch nghiêm trọng: `25.000 + 35.000 = 60.000 đ` (bỏ qua hoàn toàn 20 giờ làm việc thực tế: đáng lẽ là `20h x 35.000 = 700.000 đ`).
- Ngoài ra, hàm `handleActualHoursChange` trước đó tự động tính lại `basePay` theo tỷ lệ giờ công làm lương cứng của Full-time bị reset về 0 khi giờ công = 0, trái ngược với nguyên tắc nghiệp vụ: *"Lương cứng giữ nguyên, chỉ người dùng trực tiếp sửa mới đổi"*.

## 2. Root Cause Analysis
1. `EditPayrollItemModal.tsx` liên kết ô nhập "Lương Part-time theo giờ (VNĐ)" với state `partTimePay` và "Lương làm thêm ca đêm (VNĐ)" với state `nightPay`. Người dùng nhập đơn giá 25k và 35k nhưng hệ thống ghi nhận trực tiếp là tổng tiền.
2. Công thức Live Preview `preview.net` cộng trực tiếp `basePay + partTimePay + nightPay` mà không nhân với số giờ làm việc.
3. Khi thay đổi `actualHours`, hàm `handleActualHoursChange` can thiệp ghi đè `basePay = hourlyRate * newHours`, xóa mất lương cứng cố định theo hợp đồng của nhân sự Full-time.
4. `PayrollItemDto` thiếu 2 trường `base_salary` và `hourly_rate` từ hợp đồng khiến modal không nắm được đơn giá gốc khi khởi tạo.

## 3. Implementation Details
1. **Backend (`PayrollItemDto.java` & `PayrollService.java`):**
   - Bổ sung `baseSalary` và `hourlyRate` vào `PayrollItemDto`.
   - Trong `PayrollService.getPayrollDetails` và `updatePayrollItem`: Tra cứu hợp đồng lương hiệu lực tương ứng trong kỳ và gán `baseSalary`, `hourlyRate` vào DTO trả về cho frontend.
2. **Frontend Type Definition (`payroll.types.ts`):**
   - Thêm `base_salary?: number` và `hourly_rate?: number` vào `PayrollItem`.
3. **Frontend Modal UI & Formula Engine (`EditPayrollItemModal.tsx`):**
   - Đổi state quản lý nhập liệu: `partTimeRate` (đơn giá Part-time) và `nightRate` (đơn giá ca đêm).
   - Tự động tính toán thành tiền:
     - `computedPartTimePay = Math.round(partTimeHours * partTimeRate)`
     - `computedNightPay = Math.round(nightHours * nightRate)`
   - Công thức Lương thực nhận Live Preview chuẩn xác:
     $$\text{Net Pay} = \text{basePay} + \text{computedPartTimePay} + \text{computedNightPay} + \text{Phụ cấp} + \text{Thưởng} - \text{Khấu trừ}$$
   - Khóa cơ chế tự động can thiệp lương cứng: Sửa giờ công Full-time (`actualHours`) **không bao giờ** làm thay đổi `basePay`. Lương cứng giữ nguyên cố định trừ khi người dùng trực tiếp gõ vào ô lương cứng.
   - Hiển thị nhãn rõ ràng: `Đơn giá Part-time (VNĐ/h)` và `Đơn giá ca đêm (VNĐ/h)`.
   - Hiển thị badge kết quả trực quan ngay dưới từng ô:
     - `= Thành tiền Part-time: {partTimePay} ({partTimeHours}h × {partTimeRate})`
     - `= Thành tiền ca đêm: {nightPay} ({nightHours}h × {nightRate})`
   - Bổ sung bảng **Chi Tiết Công Thức Tính** trong khối Xem Trước Kết Quả Tính Lại ở cột bên phải, minh bạch từng khoản cộng/trừ.

## 4. Verification & Testing
- Backend unit tests: 17/17 tests PASS (`mvn test -Dtest="PayrollCalculationEngineTest,EmployeeBranchTransferTest"`).
- Frontend production build: `npm run build` PASS (0 errors).
- Docker containers rebuilt and verified live on `http://localhost:8081` & `http://localhost:8082`.
- End-to-end API test với EMP-002: Lương cứng 8.500.000 đ + 20h ca đêm x 35.000 đ/h = 9.200.000 đ chính xác 100%.
