-- V8__create_employee_availabilities_table.sql
CREATE TABLE IF NOT EXISTS employee_availabilities (
                                                       id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                                       employee_id BIGINT UNSIGNED NOT NULL,
                                                       work_shift_id BIGINT UNSIGNED NOT NULL,
                                                       day_of_week TINYINT UNSIGNED NOT NULL COMMENT '1 = Thứ Hai, 2 = Thứ Ba, ..., 7 = Chủ Nhật (ISO-8601)',
                                                       is_available BOOLEAN NOT NULL DEFAULT TRUE,
                                                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                                       PRIMARY KEY (id),

    -- Đảm bảo 1 nhân sự không có 2 bản ghi trùng nhau cho cùng 1 ca vào cùng 1 thứ
    CONSTRAINT uq_emp_shift_day UNIQUE (employee_id, work_shift_id, day_of_week),

    -- Ràng buộc toàn vẹn khóa ngoại
    CONSTRAINT fk_ea_employee FOREIGN KEY (employee_id)
    REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_ea_work_shift FOREIGN KEY (work_shift_id)
    REFERENCES work_shifts (id) ON DELETE CASCADE,

    -- Đánh chỉ mục (Index) tối ưu hóa tốc độ truy vấn cho thuật toán xếp ca
    INDEX idx_ea_branch_lookup (day_of_week, work_shift_id),
    INDEX idx_ea_employee_day (employee_id, day_of_week)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu lịch khả dụng đăng ký ca làm việc của nhân viên';