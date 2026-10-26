-- ==============================================================================
-- V10__add_position_id_to_employee_secondary_branches.sql
-- Bổ sung position_id để gán chức danh riêng cho nhân sự tại từng chi nhánh phụ trách
-- ==============================================================================

ALTER TABLE employee_secondary_branches
ADD COLUMN position_id BIGINT UNSIGNED NULL AFTER branch_id;

-- Khóa ngoại liên kết tới positions(id)
ALTER TABLE employee_secondary_branches
ADD CONSTRAINT fk_esb_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;

-- Cập nhật dữ liệu mẫu seed:
-- Nhân viên 1 (EMP-001) sang Chi nhánh 2 (Đống Đa) làm Quản lý (position_id = 2)
-- Nhân viên 1 (EMP-001) sang Chi nhánh 3 (Hoàn Kiếm) làm Nhân viên (position_id = 3)
-- Nhân viên 3 (EMP-003) sang Chi nhánh 2 (Đống Đa) làm Nhân viên (position_id = 3)
UPDATE employee_secondary_branches SET position_id = 2 WHERE employee_id = 1 AND branch_id = 2;
UPDATE employee_secondary_branches SET position_id = 3 WHERE employee_id = 1 AND branch_id = 3;
UPDATE employee_secondary_branches SET position_id = 3 WHERE employee_id = 3 AND branch_id = 2;
