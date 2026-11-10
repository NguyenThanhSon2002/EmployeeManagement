# Journal: Lập Kế Hoạch Lương Cứng Full-Time & Phân Quyền Khóa Chỉnh Sửa

- **Thời gian**: 2026-11-10 09:55
- **Tác giả**: Antigravity Assistant
- **Mục tiêu**: Lập kế hoạch chi tiết triển khai lương cứng Full-time (mặc định 8h/ngày), chỉ Giám đốc và Admin có quyền chỉnh sửa, cùng công thức Lương Thực Nhận chuẩn toàn hệ thống.

---

## 1. Tóm tắt kế hoạch đã tạo
- Kế hoạch được lưu tại: [`plans/261110-0955-fulltime-fixed-salary-and-role-lock/plan.md`](file:///D:/Project/Employee%20Management/plans/261110-0955-fulltime-fixed-salary-and-role-lock/plan.md).
- Bao gồm 4 giai đoạn rõ ràng:
  1. **Phase 1**: Cập nhật logic tính lương cứng Full-time và công thức Net Pay mới trong `PayrollCalculationEngine.java` + Unit Test.
  2. **Phase 2**: Phân quyền RBAC bảo mật ở `PayrollService.java` (chặn Manager sửa lương cứng).
  3. **Phase 3**: Khóa ô nhập Full-time trên giao diện `EditPayrollItemModal.tsx` nếu user không phải Giám đốc / Admin.
  4. **Phase 4**: Rebuild Docker containers và kiểm thử E2E xác thực.

---

## 2. Lệnh thực thi tiếp theo
- Chuẩn bị thực hiện kế hoạch bằng lệnh `/aikit-core:xd:cook` với đường dẫn file plan đã tạo.
