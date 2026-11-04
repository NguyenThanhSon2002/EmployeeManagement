-- V25: Phân biệt ca do nhân viên tự đăng ký (SELF_CLAIM) với ca do quản lý phân công (MANAGER)
ALTER TABLE shift_assignments
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'MANAGER'
    COMMENT 'Nguồn tạo ca: MANAGER (quản lý phân) hoặc SELF_CLAIM (nhân viên tự đăng ký)' AFTER status;

-- Đánh dấu các ca tự nhận đã có sẵn (ghi nhận qua lý do mặc định của chức năng nhận ca)
UPDATE shift_assignments
SET source = 'SELF_CLAIM'
WHERE override_reason IN ('Nhân viên đăng ký nhận ca trống', 'Nhân viên tự nguyện đăng ký nhận ca');