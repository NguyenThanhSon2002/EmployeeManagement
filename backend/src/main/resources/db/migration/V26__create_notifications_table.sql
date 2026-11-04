-- V26: Thông báo trong ứng dụng (đổi ca / nhường ca)
CREATE TABLE IF NOT EXISTS notifications (
                                             id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                             recipient_employee_id BIGINT UNSIGNED NOT NULL,
                                             branch_id BIGINT UNSIGNED NULL,
                                             type VARCHAR(40) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    ref_type VARCHAR(30) NULL,
    ref_id BIGINT UNSIGNED NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_notif_recipient_read (recipient_employee_id, is_read, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;