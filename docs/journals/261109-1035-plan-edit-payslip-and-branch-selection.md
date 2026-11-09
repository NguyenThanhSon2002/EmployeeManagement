# Kế Hoạch Triển Khai: Chỉnh Sửa Phiếu Lương & Nâng Cấp Chọn Chi Nhánh (Edit Payslip & Branch Selection Enhancement)

**Thời gian:** 09/11/2026 10:35 (ICT)  
**Tác giả:** Antigravity (AI Assistant)  
**Nhánh:** `dev`  
**Kế hoạch:** [`plans/261109-1033-edit-payslip-and-branch-selection/plan.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/plan.md)

---

## 1. Mục tiêu và phạm vi kế hoạch

Kế hoạch này giải quyết hai nhu cầu thực tế cốt lõi từ người dùng sau khi đã hoàn thành phân hệ tính lương cơ bản:
1. **Chỉnh sửa thông tin chi tiết phiếu lương:** Cho phép Quản lý cơ sở và Giám đốc điều chỉnh các tham số trong phiếu lương của từng nhân viên (giờ công, giờ ca đêm, phụ cấp, thưởng chuyên cần/thưởng hiệu quả, phạt vi phạm và ghi chú giải trình) trước khi chốt bảng lương. Khi người dùng nhập số liệu điều chỉnh, hệ thống sẽ **tự động tính lại toàn bộ Gross, BHXH (10.5%), Thuế TNCN (lũy tiến 7 bậc) và Net thực nhận**.
2. **Nâng cấp chọn chi nhánh:** Mở rộng quyền chọn chi nhánh cho Quản lý cơ sở (thay vì bị khóa cứng), bổ sung bộ lọc nhanh chi nhánh nội bộ ngay trên bảng đối soát.

---

## 2. Các giai đoạn triển khai chi tiết

- **Phase 1 (Backend DTO & Engine):** [`phase-01-backend-dto-and-engine.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/phase-01-backend-dto-and-engine.md)
  - Tạo `UpdatePayrollItemRequest.java`.
  - Mở rộng `PayrollCalculationEngine.java` với phương thức `recalculateAdjustedPayrollItem(...)`.
- **Phase 2 (Service, Controller & RBAC):** [`phase-02-service-and-controller.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/phase-02-service-and-controller.md)
  - Thêm `updatePayrollItem(...)` trong `PayrollService.java`, cập nhật tự động `totalGross`, `totalNet` của bảng lương cha.
  - Endpoint `PUT /api/v1/payrolls/items/{itemId}` trong `PayrollController.java`.
  - Kiểm tra điều kiện khóa `PAYROLL_LOCKED` và phân quyền chi nhánh.
- **Phase 3 (Frontend Service & Store):** [`phase-03-frontend-store.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/phase-03-frontend-store.md)
  - Bổ sung types `UpdatePayrollItemPayload`.
  - Gọi API trong `payrollService.ts` và cập nhật state tức thì trong `usePayrollStore.ts`.
- **Phase 4 (UI: Edit Modal & Branch Selection):** [`phase-04-ui-edit-modal-and-branch-select.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/phase-04-ui-edit-modal-and-branch-select.md)
  - Xây dựng component `EditPayrollItemModal.tsx` với 2 cột (Inputs điều chỉnh + Live Preview kết quả thuế, bảo hiểm, net).
  - Thêm cột Thao tác với nút "Sửa" trên `PayrollManagementPage.tsx`.
  - Mở rộng dropdown chi nhánh cho Quản lý và bổ sung quick filter chi nhánh.
- **Phase 5 (Kiểm thử, Rebuild Docker & E2E):** [`phase-05-testing-and-deployment.md`](file:///D:/Project/Employee%20Management/plans/261109-1033-edit-payslip-and-branch-selection/phase-05-testing-and-deployment.md)
  - Viết Unit test trong `PayrollCalculationEngineTest.java`.
  - Rebuild Docker container `hrms-backend` và `hrms-frontend`.
  - Kiểm thử trực tiếp trên trình duyệt.

---

## 3. Lệnh triển khai kế tiếp

Người dùng có thể kích hoạt triển khai kế hoạch bằng lệnh:
```bash
/aikit-core:xd:cook plans/261109-1033-edit-payslip-and-branch-selection
```
