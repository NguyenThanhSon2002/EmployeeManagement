# Nhật ký lập kế hoạch: Tái cấu trúc Modal Chỉnh Sửa Phiếu Lương & Danh Sách Động

**Thời gian:** 10/11/2026 - 08:45 (GMT+7)  
**Tác vụ:** Lập kế hoạch chi tiết triển khai `plans/261110-0842-edit-payroll-modal-redesign`  
**Nhánh Git:** `dev`  

---

## 1. Tóm tắt phiên lập kế hoạch

Dựa trên yêu cầu của người dùng về việc:
1. Sắp xếp lại trường Giờ công ban ngày cạnh Lương ban ngày, Giờ làm đêm cạnh Lương làm đêm.
2. Thêm các danh sách động cho Phụ cấp, Thưởng, Phạt tương tự như cách thêm chi nhánh phụ trách trong form nhân viên.
3. Cho phép tự động tính toán nhưng có thể ghi đè sửa tay và lưu vết chi tiết JSON.

Đã xây dựng kế hoạch thực hiện hoàn chỉnh gồm 4 giai đoạn độc lập:
- **Phase 1:** Migration `V29` bổ sung `adjustments_detail JSON` trong bảng `payroll_items`, mở rộng DTO `UpdatePayrollItemRequest`, `PayrollItemDto`, `MyPayslipResponse`.
- **Phase 2:** Cập nhật engine tính toán `PayrollCalculationEngine.java` và tích hợp `PayrollService.java`, hỗ trợ điều chỉnh `nightPay` độc lập, chạy unit test kiểm thử.
- **Phase 3:** Nâng cấp types frontend và tái cấu trúc giao diện `EditPayrollItemModal.tsx` với 2 cặp Công-Lương và 3 khối Dynamic List (Phụ cấp, Thưởng, Phạt) kèm datalist gợi ý và empty state.
- **Phase 4:** Tích hợp hiển thị chi tiết phụ cấp/thưởng/phạt trên `MyPayslipPage.tsx`, chạy build frontend & backend, rebuild Docker và kiểm thử E2E 4 kịch bản.

---

## 2. Các tài liệu đã khởi tạo
- **Báo cáo phân tích:** [`plans/reports/261110-0842-edit-payroll-modal-redesign-report.md`](../../plans/reports/261110-0842-edit-payroll-modal-redesign-report.md)
- **Kế hoạch chính:** [`plans/261110-0842-edit-payroll-modal-redesign/plan.md`](../../plans/261110-0842-edit-payroll-modal-redesign/plan.md)
- **Phase 1:** [`plans/261110-0842-edit-payroll-modal-redesign/phase-01-database-migration-and-backend-dto.md`](../../plans/261110-0842-edit-payroll-modal-redesign/phase-01-database-migration-and-backend-dto.md)
- **Phase 2:** [`plans/261110-0842-edit-payroll-modal-redesign/phase-02-backend-engine-and-service-adjustments.md`](../../plans/261110-0842-edit-payroll-modal-redesign/phase-02-backend-engine-and-service-adjustments.md)
- **Phase 3:** [`plans/261110-0842-edit-payroll-modal-redesign/phase-03-frontend-types-and-modal-redesign.md`](../../plans/261110-0842-edit-payroll-modal-redesign/phase-03-frontend-types-and-modal-redesign.md)
- **Phase 4:** [`plans/261110-0842-edit-payroll-modal-redesign/phase-04-payslip-breakdown-and-rebuild-verification.md`](../../plans/261110-0842-edit-payroll-modal-redesign/phase-04-payslip-breakdown-and-rebuild-verification.md)

---

## 3. Bước tiếp theo
Chờ lệnh thực thi từ người dùng (`/aikit-core:xd:cook` hoặc bắt đầu Phase 1).
