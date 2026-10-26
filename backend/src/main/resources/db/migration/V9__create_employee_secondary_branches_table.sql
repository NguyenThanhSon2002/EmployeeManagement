-- ==============================================================================
-- V9__create_employee_secondary_branches_table.sql
-- Quản lý danh sách cơ sở phụ/kiêm nhiệm mà nhân sự có thể làm việc (Multi-Branch Support)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS employee_secondary_branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_sec_branch UNIQUE (employee_id, branch_id),
    CONSTRAINT fk_esb_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_esb_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_esb_branch (branch_id),
    INDEX idx_esb_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách cơ sở phụ/kiêm nhiệm của nhân viên ngoài cơ sở chính';

-- Seed mẫu: Gán nhân viên id 1 (EMP-001) làm thêm ở Chi nhánh Đống Đa (id 2) và Hoàn Kiếm (id 3)
-- Gán nhân viên id 3 (EMP-003) làm thêm ở Chi nhánh Đống Đa (id 2)
INSERT INTO employee_secondary_branches (employee_id, branch_id, notes) VALUES
(1, 2, 'Hỗ trợ ca linh hoạt chi nhánh Đống Đa'),
(1, 3, 'Hỗ trợ ca cuối tuần chi nhánh Hoàn Kiếm'),
(3, 2, 'Kiêm nhiệm hỗ trợ kỹ thuật chi nhánh Đống Đa')
ON DUPLICATE KEY UPDATE notes = VALUES(notes);
