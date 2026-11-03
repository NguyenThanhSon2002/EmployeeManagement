-- ==============================================================================
-- V24__add_transferred_from_employee_id_to_shift_assignments.sql
-- Thêm trường lưu vết nhân sự được sắp xếp ban đầu trước khi nhường ca (HANDOVER)
-- ==============================================================================

ALTER TABLE shift_assignments
    ADD COLUMN transferred_from_employee_id BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID nhân sự được phân bổ ban đầu trước khi nhường ca (nếu có)' AFTER employee_id,
    ADD CONSTRAINT fk_shift_assignments_transferred_from FOREIGN KEY (transferred_from_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    ADD INDEX idx_shift_assign_transferred (transferred_from_employee_id);
