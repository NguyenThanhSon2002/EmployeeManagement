-- V11__create_employee_preferred_shifts_table.sql
CREATE TABLE IF NOT EXISTS employee_preferred_shifts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id BIGINT UNSIGNED NOT NULL,
    work_shift_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT uq_emp_preferred_shift UNIQUE (employee_id, work_shift_id),
    CONSTRAINT fk_eps_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_eps_work_shift FOREIGN KEY (work_shift_id) REFERENCES work_shifts (id) ON DELETE CASCADE,
    INDEX idx_eps_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu ca làm việc ưu tiên mong muốn của nhân viên';
