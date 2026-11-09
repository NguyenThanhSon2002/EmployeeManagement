# Triển Khai Hoàn Tất: Phân Hệ Tính Lương Tự Động & Thưởng Chuyên Cần (Core Payroll & Attendance Bonus)

**Thời gian:** 09/11/2026 10:30 (ICT)  
**Tác giả:** Antigravity (AI Assistant)  
**Nhánh:** `dev`  
**Kế hoạch:** [`plans/261109-1005-core-payroll-and-attendance-bonus/plan.md`](file:///D:/Project/Employee%20Management/plans/261109-1005-core-payroll-and-attendance-bonus/plan.md)  
**Báo cáo thiết kế:** [`plans/reports/261109-1003-payroll-and-kpi-system-report.md`](file:///D:/Project/Employee%20Management/plans/reports/261109-1003-payroll-and-kpi-system-report.md)

---

## 1. Tóm tắt kết quả triển khai

Đã hoàn thành toàn diện 5 giai đoạn phát triển phân hệ **Tính Lương Tự Động & Thưởng Chuyên Cần (Giai đoạn 1)** cho hệ thống HRMS:

1. **Cơ sở dữ liệu & JPA Entities (Phase 1):**
   - Migration Flyway [`V28__create_salary_contracts_and_payroll_tables.sql`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration/V28__create_salary_contracts_and_payroll_tables.sql): Tạo các bảng `salary_contracts`, `payrolls`, `payroll_items` và seed hợp đồng lương khởi tạo cho nhân sự.
   - Entities: [`SalaryContract.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/domain/SalaryContract.java), [`Payroll.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/domain/Payroll.java), [`PayrollItem.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/domain/PayrollItem.java).
   - Repositories: [`SalaryContractRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/repository/SalaryContractRepository.java), [`PayrollRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/repository/PayrollRepository.java), [`PayrollItemRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/repository/PayrollItemRepository.java).

2. **Động cơ tính lương & Nghiệp vụ (Phase 2):**
   - [`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java):
     - Lương Full-time theo tháng, Part-time theo giờ công thực tế.
     - Phụ cấp làm thêm ban đêm (`22:00 - 06:00`) cộng thêm 30% lương theo Điều 98 Bộ luật Lao động 2019.
     - Thưởng chuyên cần tự động: 500,000 VNĐ (Full-time), 300,000 VNĐ (Part-time từ 80h/tháng) nếu $\le 1$ lần đi muộn, $\le 15$ phút trễ và 0 ngày nghỉ không phép.
     - Phạt đi muộn khi vượt quá 15 phút.
     - Khấu trừ ngày nghỉ không lương (`leave_type_id = 4`).
     - Khấu trừ BHXH bắt buộc 10.5% (Full-time).
     - Biểu thuế TNCN lũy tiến 7 bậc Việt Nam.
     - Lương thực nhận Net.
   - [`PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java): Quản lý vòng đời bảng lương (`DRAFT` $\rightarrow$ `APPROVED` / `LOCKED`), scoping chi nhánh, xuất Excel.

3. **RESTful API Controllers & RBAC (Phase 3):**
   - [`PayrollController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java): `/api/v1/payrolls` (generate, get list, get details, approve, export Excel, my-payslip).
   - [`SalaryContractController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/controller/SalaryContractController.java): Quản lý hợp đồng lương.
   - Phân quyền: Nhân viên cơ sở bị chặn 403 Forbidden nếu gọi API quản trị; chỉ được xem phiếu lương của chính mình.

4. **Giao diện người dùng Frontend (Phase 4):**
   - [`PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx): Màn hình Quản lý Bảng Lương (`/payroll`), KPI Metric Cards, bảng đối soát chi tiết, nút tính lương, chốt duyệt, xuất file Excel.
   - [`MyPayslipPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/MyPayslipPage.tsx): Màn hình Phiếu Lương Của Tôi (`/my-payslip`), phân rã chi tiết 3 khối: Thu Nhập - Giảm Trừ - Thực Lĩnh, hỗ trợ in phiếu lương chuẩn A4.
   - Cập nhật [`AppRoutes.tsx`](file:///D:/Project/Employee%20Management/frontend/src/routes/AppRoutes.tsx), [`Sidebar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/Sidebar.tsx).

5. **Kiểm thử & Đóng gói Docker (Phase 5):**
   - Unit tests: [`PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java) 100% pass (6/6 test cases).
   - Frontend build: `npm run build` thành công, 0 lỗi TypeScript/linter.
   - Rebuild Docker: `hrms-backend` (port 8081) và `hrms-frontend` (port 8082) hoạt động ổn định và healthy.
   - E2E API Verification: Đã kiểm thử đầy đủ đăng nhập, tính lương, duyệt bảng lương, lấy phiếu lương cá nhân và chặn RBAC 403.
