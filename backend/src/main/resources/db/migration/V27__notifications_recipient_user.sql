-- V27: Cho phép thông báo gắn theo tài khoản (users), dùng cho Giám đốc/Admin chưa có hồ sơ nhân sự
ALTER TABLE notifications
    MODIFY COLUMN recipient_employee_id BIGINT UNSIGNED NULL,
    ADD COLUMN recipient_user_id BIGINT UNSIGNED NULL AFTER recipient_employee_id,
    ADD CONSTRAINT fk_notif_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD INDEX idx_notif_user_read (recipient_user_id, is_read, created_at);