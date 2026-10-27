-- V14__add_branch_id_to_work_shifts.sql
-- Thêm cột branch_id vào bảng work_shifts (NULL = Toàn hệ thống/Global)
ALTER TABLE work_shifts 
    ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER shift_name,
    ADD CONSTRAINT fk_work_shifts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- Cập nhật ràng buộc unique: cùng mã ca có thể tồn tại ở các chi nhánh khác nhau
ALTER TABLE work_shifts DROP INDEX uq_work_shifts_code;
ALTER TABLE work_shifts ADD CONSTRAINT uq_work_shifts_code_branch UNIQUE (shift_code, branch_id);

-- Đánh index phục vụ tra cứu ca theo chi nhánh
ALTER TABLE work_shifts ADD INDEX idx_work_shifts_branch (branch_id, is_active, deleted_at);
