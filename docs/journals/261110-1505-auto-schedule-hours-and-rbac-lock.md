# Journal: Tự Động Tổng Hợp Giờ Làm Từ Lịch Phân Ca & Phân Quyền Khóa Sửa Giờ Công

- **Thời gian**: 2026-11-10 15:05
- **Nhiệm vụ**: Tự động tính giờ làm việc ngày và ca đêm từ `shift_assignments` khi chưa có máy chấm công; chỉ Giám đốc và Admin có quyền sửa giờ làm, Quản lý/Nhân viên ẩn ô sửa.
- **Kế hoạch tham chiếu**: [`plans/261110-1447-auto-schedule-hours-and-rbac-lock/plan.md`](file:///D:/Project/Employee%20Management/plans/261110-1447-auto-schedule-hours-and-rbac-lock/plan.md)

## Các thay đổi chính

1. **Backend Engine ([`PayrollCalculationEngine.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/engine/PayrollCalculationEngine.java))**:
   - Thêm phương thức `calculateNightMinutes` tính toán các phút làm việc trong khung giờ 22:00 - 06:00 theo Điều 98 Bộ Luật Lao Động 2019.
   - Nâng cấp `calculatePayrollItem` nhận danh sách `List<ShiftAssignment>`: Khi `attendances` rỗng (chưa tích hợp máy chấm công), tự động bóc tách giờ ca ngày và giờ ca đêm từ các ca được phân công trong tháng.
   - Áp dụng công thức lương chuẩn xác:
     - Part-time: Giờ ca ngày hưởng 100% đơn giá hợp đồng, giờ ca đêm hưởng 130% đơn giá (+30% phụ cấp làm đêm).
     - Full-time: Lương cứng cố định theo hợp đồng + phụ cấp làm thêm ban đêm (+30% theo đơn giá giờ quy đổi).
2. **Backend Service & RBAC Guard ([`PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java))**:
   - Inject `ShiftAssignmentRepository` vào `PayrollService`.
   - Trong `updatePayrollItem`: Kiểm tra nếu không phải Giám đốc hoặc Admin (`!isDirectorOrAdmin`), hệ thống khóa và tự động khôi phục `actualHours`, `partTimeHours`, `nightHours`, `basePay` về giá trị gốc của hệ thống.
3. **Frontend Modal ([`EditPayrollItemModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/components/EditPayrollItemModal.tsx))**:
   - Xác định quyền `canEditHours = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_DIRECTOR'`.
   - Với Giám đốc & Admin: Hiển thị các ô input số để chỉnh sửa linh hoạt.
   - Với Quản lý cơ sở & Nhân viên: **Ẩn hoàn toàn các ô input**, thay bằng giao diện read-only hiển thị số giờ dạng văn bản kèm huy hiệu bảo mật `🔒 Theo lịch phân ca` / `🔒 Cố định`.
4. **Kiểm thử & Triển khai**:
   - 12 unit tests chạy thành công 100% trong [`PayrollCalculationEngineTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/payroll/PayrollCalculationEngineTest.java).
   - Đóng gói frontend `npm run build` thành công.
   - Build lại Docker containers `hrms-backend` và `hrms-frontend`.
   - Xác minh API: Tổng hợp chính xác giờ công tháng 11/2026; Quản lý cơ sở bị khóa không thể can thiệp giờ công và lương cứng.
