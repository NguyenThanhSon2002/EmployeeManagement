# Nhật Ký Kỹ Thuật: Brainstorm & Lập Kế Hoạch Sửa Lỗi Cập Nhật Chi Nhánh Mẫu Ca (Soft-Delete Unique Collision)

- **Ngày:** 02/11/2026
- **Nhánh:** `dev`
- **Tác giả:** Antigravity (AI Assistant) & User
- **Trạng thái:** Brainstorm & Kế hoạch hoàn tất, sẵn sàng thực hiện

---

## 1. Phát Hiện Vấn Đề Gốc
- **Người dùng phản ánh:** Đã cập nhật Ca Đêm sang Chi nhánh Đống Đa thành công (có toast xanh), nhưng trên giao diện vẫn hiển thị "Chi nhánh Cầu Giấy".
- **Kiểm tra Logs & Database MySQL:**
  - `java.sql.SQLIntegrityConstraintViolationException: Duplicate entry 'CA_DEM-2' for key 'uq_work_shifts_code_branch'`.
  - Bảng `work_shifts` có unique index `(shift_code, branch_id)` không xét `deleted_at`.
  - Tại chi nhánh Đống Đa (`branch_id = 2`) đã tồn tại ca đêm cũ mang mã `CA_DEM` bị xóa mềm (`id = 8, deleted_at = '2026-11-02 07:07:59'`).
  - Frontend `useScheduleStore.updateShiftTemplate` bắt lỗi nhưng chỉ `console.error` (nuốt lỗi), đồng thời khi cập nhật optimistic không có trường `branchName`.

---

## 2. Quyết Định Kiến Trúc & Thiết Kế
- **Phương án lựa chọn:** Phương án 1 (Sửa tận gốc cả Database Migration và Store Frontend).
- **Kế hoạch triển khai:** [plans/261102-1433-fix-shift-branch-unique-constraint/plan.md](file:///D:/Project/Employee%20Management/plans/261102-1433-fix-shift-branch-unique-constraint/plan.md).
- **Tài liệu Brainstorm:** [docs/brainstorms/261102-1432-fix-shift-branch-update-unique-constraint.md](file:///D:/Project/Employee%20Management/docs/brainstorms/261102-1432-fix-shift-branch-update-unique-constraint.md).
