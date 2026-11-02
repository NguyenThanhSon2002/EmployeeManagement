-- ==============================================================================
-- V22__fix_work_shifts_unique_soft_delete.sql
-- Khắc phục xung đột Unique Index (shift_code, branch_id) khi xóa mềm mẫu ca.
-- Cho phép tạo lại hoặc chuyển ca cùng mã vào chi nhánh đã có bản ghi xóa mềm.
-- ==============================================================================

-- 1. Đổi mã các bản ghi đã xóa mềm cũ để giải phóng cặp (shift_code, branch_id)
UPDATE work_shifts
SET shift_code = CONCAT(shift_code, '_DEL_', id)
WHERE deleted_at IS NOT NULL AND shift_code NOT LIKE '%_DEL_%';

-- 2. Thêm cột ảo active_flag: 1 khi đang hoạt động, NULL khi đã xóa mềm
ALTER TABLE work_shifts 
    ADD COLUMN active_flag TINYINT GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) VIRTUAL;

-- 3. Xóa unique constraint cũ không xét xóa mềm
ALTER TABLE work_shifts DROP INDEX uq_work_shifts_code_branch;

-- 4. Tạo unique constraint mới kết hợp active_flag
-- Trong MySQL, các dòng có active_flag = NULL không bị xem là trùng lặp
ALTER TABLE work_shifts 
    ADD CONSTRAINT uq_work_shifts_code_branch_active UNIQUE (shift_code, branch_id, active_flag);
