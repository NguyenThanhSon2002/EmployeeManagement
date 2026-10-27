# Nhật Ký Kỹ Thuật: Brainstorming Mẫu Ca Làm Việc Theo Chi Nhánh (Branch-Specific Work Shifts)

**Thời gian:** 2026-10-27 15:43  
**Chủ đề:** Kiến trúc hỗ trợ mẫu ca làm việc riêng theo chi nhánh  
**Tập tin báo cáo:** `plans/reports/261027-1542-branch-specific-shift-templates-brainstorm.md`

### 1. Vấn Đề
- Hệ thống hiện tại có mẫu ca `work_shifts` mang tính toàn cục (Global), dẫn tới việc mọi chi nhánh đều chung các ca giống nhau, không phản ánh được giờ giấc và định biên riêng của từng chi nhánh.

### 2. Quyết Định Kiến Trúc (ADR Summary)
- Lựa chọn mô hình **Hybrid**:
  - `branch_id IS NULL`: Ca chuẩn toàn hệ thống (Global).
  - `branch_id = X`: Ca riêng biệt của chi nhánh X.
- Thêm migration Flyway `V14__add_branch_id_to_work_shifts.sql`.
- Cho phép lọc theo chi nhánh trên `ShiftTemplatesPage` và tự động hiển thị đúng ca theo chi nhánh được chọn trên ma trận `SchedulePage`.

### 3. Bước Tiếp Theo
- Kích hoạt quy trình lập kế hoạch chi tiết (`/aikit-core:xd:plan`) với đầy đủ các phase: Database -> Backend -> Frontend Store & Pages -> Kiểm thử tích hợp.
