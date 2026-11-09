# Nhật Ký Kỹ Thuật: Lập Kế Hoạch Triển Khai Phân Hệ Tính Lương Tự Động & Thưởng Chuyên Cần (Giai Đoạn 1)

- **Thời gian:** 09/11/2026 10:06:00
- **Tác vụ:** Lập kế hoạch 5 phase chi tiết cho Giai đoạn 1 của phân hệ Tính Lương Tự Động (Payroll) & Thưởng Chuyên Cần.
- **Tài liệu kế hoạch:** `plans/261109-1005-core-payroll-and-attendance-bonus/plan.md`

## Tóm Tắt 5 Phase
1. **Phase 1: Database Migration & JPA Domain Entities:** Migration `V28` tạo bảng `salary_contracts`, `payrolls`, `payroll_items`, các entity và repository.
2. **Phase 2: Payroll Calculation Engine & Business Services:** Xây dựng `PayrollCalculationEngine.java` và `PayrollService.java` xử lý giờ công, phụ cấp ca đêm (+30%), thưởng chuyên cần, trừ phạt đi muộn, BHXH (10.5%), thuế TNCN lũy tiến 7 bậc.
3. **Phase 3: REST API Controllers & Security Scoping:** Các endpoint `/api/v1/salary-contracts`, `/api/v1/payrolls`, xuất file Excel và phân quyền RBAC chặt chẽ.
4. **Phase 4: Frontend Payroll Management & My Payslip UI:** Xây dựng giao diện Quản lý bảng lương chi nhánh (`/payroll`) và Phiếu lương cá nhân (`/my-payslip`).
5. **Phase 5: Verification, Testing & Docker Deployment:** Unit tests kiểm tra tính chính xác công thức, rebuild Docker containers, và kiểm thử E2E trên trình duyệt tại cổng 8082.

## Lệnh Thực Thi Tiếp Theo
- `/aikit-core:xd:cook plans/261109-1005-core-payroll-and-attendance-bonus`
