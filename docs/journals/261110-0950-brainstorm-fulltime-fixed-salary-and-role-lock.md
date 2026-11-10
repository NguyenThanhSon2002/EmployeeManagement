# Brainstorm: Lương Cứng Full-time (Mặc Định 8h/Ngày) & Phân Quyền Khóa Chỉnh Sửa

- **Ngày thực hiện**: 2026-11-10
- **Trạng thái**: Chờ duyệt (Pending Approval)
- **Tác giả**: Antigravity Assistant & Solution Architect

---

## 1. Vấn đề & Mục tiêu (Problem & Objectives)

### 1.1. Hiện trạng
- Trước đây, lương của nhân viên Full-time có thể bị tính phụ thuộc vào giờ công thực tế hoặc tỷ lệ ngày công, và khi quản lý vào form chỉnh sửa phiếu lương (`EditPayrollItemModal.tsx`), bất kỳ ai có quyền truy cập đều có thể chỉnh sửa cả giờ công Full-time và số tiền lương Full-time (`base_pay`).
- Công thức Lương Thực Nhận (Net Salary) trước đây tự động khấu trừ thêm BHXH (10.5%) và Thuế TNCN lũy tiến, khiến cho số tiền thực tế người quản lý muốn chi trả bị giảm đi hoặc bị âm/bằng 0 đối với các khoản lương nhỏ lẻ.

### 1.2. Mục tiêu mới theo chỉ đạo
1. **Lương Full-time là lương cứng (Fixed Salary)**:
   - Không nhân theo giờ công thực tế.
   - Mặc định là 8 tiếng/ngày (chuẩn 26 ngày/tháng = 208h hoặc theo thỏa thuận hợp đồng).
   - Giữ nguyên trọn vẹn số tiền lương cơ bản trong hợp đồng (`base_salary`), không tự động cấn trừ ngày nghỉ (nếu có nghỉ thì đưa vào mục Phạt / Khấu trừ).
2. **Phân quyền chặt chẽ (RBAC)**:
   - **Chỉ Giám đốc (`ROLE_DIRECTOR`) và Quản trị viên (`ROLE_ADMIN`)** mới có quyền thay đổi/điều chỉnh Lương cứng Full-time (`actual_hours` và `base_pay`).
   - **Quản lý (`ROLE_MANAGER`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`) và Nhân viên**: Bị KHÓA ô lương cứng (chỉ xem, có biểu tượng ổ khóa 🔒). Họ chỉ được quyền chỉnh sửa Giờ Part-time, Lương Part-time, Ca đêm, Thưởng, Phụ cấp và Phạt/Khấu trừ.
   - Khóa ở cả 2 lớp: **Frontend UI** (read-only/disabled) và **Backend Security** (chặn ghi đè dữ liệu nếu không đủ quyền).
3. **Công thức Lương Thực Nhận (Net Pay)**:
   $$\text{Lương Thực Nhận} = \text{Lương cứng Full-time} + (\text{Giờ part-time ngày} \times \text{Lương part-time ngày}) + (\text{Giờ part-time đêm} \times \text{Lương part-time đêm}) + \text{Thưởng} + \text{Phụ cấp} - \text{Phạt/Khấu trừ}$$
   - Không tự động trừ BHXH hay Thuế TNCN khi tính toán.
   - Giữ nguyên cấu trúc form hiện tại theo đúng phản hồi của người dùng.

---

## 2. Đánh giá các phương án kỹ thuật (Architectural Options)

### Phương án 1 (Khuyến nghị): Khóa 2 lớp (Dual-layer Guard: Frontend UI + Backend Service)
- **Frontend**:
  - Đọc `currentRole` từ `useAuthStore`.
  - Xác định cờ: `const canEditFullTime = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_DIRECTOR';`.
  - Trong Cặp 1 (Full-time): nếu `!canEditFullTime` thì thuộc tính `disabled={true}`, nền xám mờ `#F1F5F9`, hiển thị badge `🔒 Chỉ Giám đốc / Admin có quyền sửa`.
- **Backend**:
  - Tại `PayrollService.updatePayrollItem`: Lấy `currentUser` và kiểm tra quyền:
    - Nếu người dùng có role `ROLE_ADMIN` hoặc `ROLE_DIRECTOR`: Cho phép cập nhật `actual_hours` và `base_pay`.
    - Nếu là role khác (ví dụ `ROLE_MANAGER`): Giữ nguyên `actual_hours` và `base_pay` cũ của `PayrollItem`, bỏ qua giá trị gửi lên (hoặc quăng `AccessDeniedException` nếu có hành vi cố tình giả mạo payload).
- **Tính toán engine**:
  - Cập nhật cả `calculatePayrollItem` (khi chạy bảng lương tự động hàng tháng) và `recalculateAdjustedPayrollItem` (khi điều chỉnh thủ công) đảm bảo Full-time lấy trọn vẹn `contract.getBaseSalary()`, mặc định 8h/ngày, và Net Pay = Tổng các khoản thu nhập trừ khấu trừ.
- **Ưu điểm**: Bảo mật toàn diện, an toàn trước cả thao tác bypass DevTools, logic rõ ràng, tuân thủ nguyên tắc Least Privilege (Quyền hạn tối thiểu).
- **Nhược điểm**: Cần sửa cả frontend và backend (nhưng phạm vi thay đổi rất gọn gàng).

### Phương án 2: Chỉ khóa ở giao diện Frontend (UI-only Guard)
- Chỉ đặt thuộc tính `disabled={!canEditFullTime}` trên component `input` và `CurrencyInput`.
- Backend nhận payload và ghi đè như bình thường.
- **Ưu điểm**: Nhanh, không cần động vào backend service.
- **Nhược điểm**: Thiếu an toàn nếu người dùng biết inspect network request hoặc dùng Postman/Curl; vi phạm nguyên tắc bảo mật phòng thủ theo chiều sâu (Defense in Depth).

👉 **Kết luận**: Chọn **Phương án 1**.

---

## 3. Thiết kế chi tiết giải pháp (Detailed Design)

### 3.1. Backend
1. **`PayrollCalculationEngine.java`**:
   - `calculatePayrollItem`:
     - Khi `employmentType == "FULL_TIME"` hoặc `salaryType == "MONTHLY"`:
       - `basePay = contract.getBaseSalary()` (lương cứng trọn vẹn, không nhân tỷ lệ).
       - `actualHours = (actualHours != null && actualHours > 0) ? actualHours : STANDARD_HOURS_PER_MONTH` (mặc định 8h/ngày * 26 ngày = 208h).
       - Khấu trừ ngày nghỉ không lương ban đầu = 0 (để Quản lý/Admin linh hoạt đưa vào mục Khấu trừ riêng nếu muốn).
       - `netSalary = basePay.add(partTimePay).add(nightPay).add(attendanceBonus).add(allowancesTotal).subtract(deductionLate).subtract(deductionUnpaidLeave)`.
       - Không tự động trừ BHXH / Thuế TNCN.
   - `recalculateAdjustedPayrollItem`:
     - Giữ nguyên công thức Net = Tổng thu nhập - Khấu trừ đã cấu hình.
2. **`PayrollService.java`**:
   - Trong phương thức `updatePayrollItem(Long itemId, UpdatePayrollItemRequest req, Long currentUserId)`:
     - Lấy danh sách roles của `currentUserId`.
     - Nếu user không có quyền `ROLE_ADMIN` hoặc `ROLE_DIRECTOR`:
       - Đặt `req.setActualHours(existingItem.getActualHours())` và `req.setBasePay(existingItem.getBasePay())` để vô hiệu hóa việc ghi đè lương cứng.
3. **`PayrollCalculationEngineTest.java`**:
   - Bổ sung và cập nhật các unit test đảm bảo lương cứng full-time luôn được bảo toàn và Net = Tổng lương.

### 3.2. Frontend
1. **`EditPayrollItemModal.tsx`**:
   - Import `useAuthStore` để lấy `currentRole`.
   - Khởi tạo biến quyền:
     ```typescript
     const canEditFullTime = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_DIRECTOR';
     ```
   - Tại Cặp 1 (Giờ công Full-time & Lương công Full-time):
     - Thêm icon `Lock` và tooltip/badge: `Chỉ Giám đốc/Admin có quyền sửa` khi `!canEditFullTime`.
     - Thuộc tính `disabled={isSaving || !canEditFullTime}`.
   - Form giữ nguyên cấu trúc 3 cặp hiện tại (Full-time, Part-time ngày, Part-time đêm) theo đúng ý kiến của người dùng.

---

## 4. Kế hoạch xác thực (Validation Plan)
1. **Unit Tests Backend**:
   - Chạy `mvn test -Dtest=PayrollCalculationEngineTest` kiểm tra 100% kịch bản tính lương cứng Full-time và công thức Net Pay mới.
2. **Kiểm tra phân quyền API (Backend Integration Test)**:
   - Thử nghiệm gửi request điều chỉnh với tài khoản Manager $\rightarrow$ xác nhận `actual_hours` và `base_pay` không bị thay đổi.
   - Thử nghiệm gửi request với tài khoản Admin/Director $\rightarrow$ xác nhận cập nhật thành công.
3. **Kiểm tra giao diện Frontend**:
   - Đăng nhập quyền Giám đốc/Admin: 2 ô Full-time mở cho phép chỉnh sửa.
   - Đăng nhập quyền Quản lý/Nhân viên: 2 ô Full-time bị khóa, có biểu tượng ổ khóa, các ô Part-time/Ca đêm/Phụ cấp/Thưởng/Phạt vẫn sửa bình thường.
