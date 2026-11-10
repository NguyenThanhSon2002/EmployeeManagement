# Nhật ký hoàn thành: Tái Cấu Trúc Modal Chỉnh Sửa Phiếu Lương & Danh Sách Động

**Thời gian:** 10/11/2026 - 09:00 (GMT+7)  
**Tác vụ:** Hoàn thành thực thi toàn bộ kế hoạch `plans/261110-0842-edit-payroll-modal-redesign`  
**Nhánh Git:** `dev`  

---

## 1. Tóm tắt kết quả đạt được

Đã triển khai thành công 100% các tính năng theo đúng yêu cầu người dùng:

1. **Sắp xếp lại giao diện Công & Lương theo cặp (ban ngày & ban đêm):**
   - **Cặp 1:** [Giờ công thực tế ban ngày] đi kèm [Lương công ban ngày (VNĐ)].
   - **Cặp 2:** [Giờ làm việc đêm (22h-06h)] đi kèm [Lương làm thêm ca đêm (VNĐ)].
   - Khi thay đổi số giờ công ban ngày hoặc ca đêm, hệ thống tự động tính toán lại mức lương gợi ý theo đơn giá giờ hợp đồng, đồng thời cho phép Quản lý/Giám đốc chỉnh sửa tay bất kỳ giá trị nào.

2. **3 Khối Danh sách động (Dynamic Lists) cho Phụ cấp, Thưởng, Phạt:**
   - Xây dựng theo pattern "+ Thêm chi nhánh phụ trách" trong `EmployeeWorkBranchFields.tsx`:
     - **Phụ cấp:** Bấm `+ Thêm phụ cấp` $\rightarrow$ Tên khoản phụ cấp (kèm datalist gợi ý nhanh hoặc tự gõ) + Số tiền (VNĐ) + Nút xóa thùng rác đỏ.
     - **Thưởng:** Bấm `+ Thêm khoản thưởng` $\rightarrow$ Tên khoản thưởng + Số tiền (VNĐ) + Nút xóa thùng rác đỏ.
     - **Phạt / Khấu trừ:** Bấm `+ Thêm khoản phạt` $\rightarrow$ Lý do phạt/khấu trừ + Số tiền (VNĐ) + Nút xóa thùng rác đỏ.
   - Hiển thị sub-total tổng phụ cấp, tổng thưởng, tổng khấu trừ trực tiếp tại chân mỗi khối.
   - Empty state viền nét đứt tinh tế khi danh sách chưa có khoản nào.

3. **Mở rộng Cơ sở dữ liệu & Backend Architecture:**
   - Migration `V29__add_adjustments_detail_to_payroll_items.sql` bổ sung cột `adjustments_detail JSON` vào bảng `payroll_items`.
   - Cập nhật entity [`PayrollItem.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/domain/PayrollItem.java) và DTOs [`UpdatePayrollItemRequest.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/UpdatePayrollItemRequest.java), [`PayrollItemDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/PayrollItemDto.java), [`MyPayslipResponse.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/dto/MyPayslipResponse.java).
   - Nâng cấp [`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java): hỗ trợ điều chỉnh độc lập `nightPay`, lưu trữ chuỗi `adjustmentsDetail`, tính toán lại toàn diện Gross, BHXH 10.5%, Thuế TNCN lũy tiến 7 bậc và Net thực nhận.
   - Thêm test case vào [`PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java) $\rightarrow$ **8/8 unit tests passed (100%)**.

4. **Trải nghiệm nhân viên trên Phiếu Lương Điện Tử ([`MyPayslipPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/MyPayslipPage.tsx)):**
   - Tự động parse và hiển thị phân rã chi tiết từng khoản phụ cấp, thưởng, phạt đã điều chỉnh, giúp nhân viên nắm rõ từng cấu phần thu nhập và giảm trừ minh bạch.

---

## 2. Kết quả kiểm thử & Triển khai
1. **Frontend Build:** `npm run build` $\rightarrow$ **Thành công (0 errors, 0 lints)**.
2. **Backend Unit Test:** `mvn test -Dtest=PayrollCalculationEngineTest` $\rightarrow$ **8/8 passed**.
3. **Docker Rebuild:** Cả hai container `hrms-backend` và `hrms-frontend` đã được build và khởi chạy thành công. Flyway migration `V29` được áp dụng trơn tru.
4. **E2E Live API Test:**
   - Cập nhật phiếu lương qua API PUT `/api/v1/payrolls/items/1`:
     - Giờ công ban ngày: 12h, Lương ban ngày: 25,000,000 đ
     - Giờ ban đêm: 3h, Lương ca đêm: 650,000 đ
     - Phụ cấp động: Ăn trưa 730k, Đi lại 300k
     - Thưởng động: Thưởng KPI 500k
     - Phạt động: Phạt đi muộn 50k
     - **Kết quả tính toán:** Gross đạt đúng 27,130,000 đ, Thuế TNCN: 1,481,250 đ, Net thực nhận: 25,123,750 đ chính xác 100%.
   - Gọi API `/api/v1/payrolls/my-payslip?month=11&year=2026` của nhân viên $\rightarrow$ Trả về đầy đủ cấu trúc JSON phân rã chi tiết phụ cấp, thưởng và khấu trừ.
