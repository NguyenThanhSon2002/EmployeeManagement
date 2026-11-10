# Journal: Tối giản hóa xem trước và tính toán điều chỉnh phiếu lương (Chỉ hiển thị Lương Thực Nhận)

- **Thời gian**: 2026-11-10 09:45
- **Tác giả**: Antigravity Assistant
- **Mục tiêu**: Loại bỏ các dòng chi tiết thuế/BHXH/Gross cũ và mới ở cột xem trước, chỉ tính và hiển thị duy nhất Tổng Lương Thực Nhận (Net Pay).

---

## 1. Yêu cầu & Bối cảnh
- Khi Quản lý / Giám đốc điều chỉnh phiếu lương nhân viên qua modal điều chỉnh (`EditPayrollItemModal.tsx`), người dùng muốn:
  - Cột xem trước bên phải chỉ hiển thị duy nhất ô **Lương Thực Nhận (Net Pay)** cùng chênh lệch so với trước.
  - Bỏ toàn bộ các dòng phía trên: `Tổng Gross cũ`, `Tổng Gross mới`, `BHXH (10.5%)`, `Thuế TNCN tạm tính` và dòng chú thích phía dưới.
  - Về mặt tính toán: Khi điều chỉnh thủ công, tổng các khoản cộng/trừ (Lương Full-time + Part-time + Ca đêm + Phụ cấp + Thưởng - Phạt) chính là Lương Thực Nhận (không tự động trừ BHXH/Thuế TNCN làm âm hoặc giảm số tiền người quản lý vừa nhập).

---

## 2. Các thay đổi thực hiện

### Frontend (`frontend/src/features/payroll/components/EditPayrollItemModal.tsx`)
1. Cập nhật `preview` useMemo:
   ```typescript
   const preview = useMemo(() => {
     if (!item) return { net: 0, diffNet: 0 };
     const net = Math.max(
       0,
       Number(basePay || 0) +
         Number(partTimePay || 0) +
         Number(nightPay || 0) +
         Number(totalBonuses || 0) +
         Number(totalAllowances || 0) -
         Number(totalDeductions || 0)
     );
     const diffNet = net - (item.net_salary || 0);
     return { net, diffNet };
   }, [item, basePay, partTimePay, nightPay, totalBonuses, totalAllowances, totalDeductions]);
   ```
2. Tối giản cột bên phải:
   - Giữ lại header "Xem Trước Kết Quả Tính Lại".
   - Bỏ 4 dòng chi tiết Gross / BHXH / Thuế TNCN.
   - Bỏ dòng chú thích chân trang.
   - Hiển thị nổi bật thẻ **Lương Thực Nhận (Net Pay)** với số tiền và chênh lệch so với trước.

### Backend (`backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java`)
1. Trong phương thức `recalculateAdjustedPayrollItem`:
   - Tính Gross mới = `basePay + partTimePay + nightPay + bonuses + allowances - deductions`.
   - Gán `netSalary = grossSalary`.
   - Đặt `insuranceDeduction = BigDecimal.ZERO` và `taxDeduction = BigDecimal.ZERO` khi điều chỉnh thủ công.

### Unit Tests (`backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java`)
- Cập nhật các assertions kiểm tra `recalculateAdjustedPayrollItem` để xác nhận `netSalary == grossSalary` và `insurance == 0`, `tax == 0`.
- 9/9 tests pass (BUILD SUCCESS).

---

## 3. Kiểm thử & Xác thực
- Frontend build: `npm run build` thành công trong 374ms, 0 lỗi TypeScript.
- Backend tests: `mvn test -Dtest=PayrollCalculationEngineTest` pass 9/9 tests.
- Docker containers: Rebuilt và khởi động lại `hrms-backend` và `hrms-frontend`.
- API verification: Chạy kiểm thử tự động, kết quả trả về `Gross Salary: 27080000`, `Net Salary: 27080000`, `Status: CONFIRMED`.
