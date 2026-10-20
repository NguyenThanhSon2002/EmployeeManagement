-- ==============================================================================
-- V7__seed_employee_user_accounts.sql
-- Cấp phát tài khoản người dùng đăng nhập bằng Mã Nhân Viên (EMP-xxx)
-- Mật khẩu mặc định: Mã nhân viên viết thường bỏ dấu gạch + @123 (emp001@123, ...)
-- Giữ nguyên tài khoản 'admin' (user_id = 1) làm tài khoản quản trị tối cao dự phòng
-- ==============================================================================

-- 1. Cập nhật tài khoản quản lý cũ (id 2) -> username 'EMP-001' và pass 'emp001@123'
UPDATE users 
SET username = 'EMP-001', 
    password_hash = '$2a$10$tYBo2IQXrvp.X2Kef.b4h.lToujAGSgYuuzhackxBeve26vq6926O',
    must_change_password = FALSE,
    is_active = TRUE
WHERE id = 2;

-- 2. Cập nhật tài khoản nhân viên cũ (id 3) -> username 'EMP-002' và pass 'emp002@123'
UPDATE users 
SET username = 'EMP-002', 
    password_hash = '$2a$10$ARZXV2g57kuBPcssVQw0BuYHKxCT0vD0VWSbpdgW7vfi9WZJdbd6a',
    must_change_password = FALSE,
    is_active = TRUE
WHERE id = 3;

-- 3. Tạo mới tài khoản cho Giám đốc Đinh Thị Uyên ('EMP-021', pass 'emp021@123')
-- (Tài khoản id 1 'admin' vẫn giữ nguyên cho Super Admin quản trị hệ thống)
INSERT INTO users (username, password_hash, email, must_change_password, failed_login_attempts, is_active)
VALUES ('EMP-021', '$2a$10$qt4kSrSXhjfcvgnCHtAdUeXI7/JmljhKa1sWi/Md/0B7VTW2Pxqni', 'uyen.dinh@company.com', FALSE, 0, TRUE)
ON DUPLICATE KEY UPDATE 
    username = VALUES(username),
    password_hash = VALUES(password_hash);

-- Gán ROLE_DIRECTOR (role_id = 1) cho EMP-021
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.username = 'EMP-021';

-- Cập nhật nhân viên EMP-021 trỏ tới user EMP-021 vừa tạo
UPDATE employees e
JOIN users u ON u.username = 'EMP-021'
SET e.user_id = u.id
WHERE e.employee_code = 'EMP-021';

-- 4. Tạo tài khoản users cho EMP-003 đến EMP-010
INSERT INTO users (username, password_hash, email, must_change_password, failed_login_attempts, is_active) VALUES
('EMP-003', '$2a$10$ujKCS3muNv0sXI7rl/X0DOpgip6N8NG3H1t/OEwOoyvdD/5HhPneG', 'cuong.le@company.com', FALSE, 0, TRUE),
('EMP-004', '$2a$10$Su1rRVKaqk1GKDWHUDgEEeDwKkQ0wX6cSLRq2erBH1W1MknMcxXI6', 'dung.pham@company.com', FALSE, 0, TRUE),
('EMP-005', '$2a$10$OL1GKNN5cmWJXEqcNJzarOYn64wLbLM8PQ1QvhEo8XI2lC.qiE5Ey', 'em.hoang@company.com', FALSE, 0, TRUE),
('EMP-006', '$2a$10$QYqV/YiQGLg89GaMaFNdAuWk6ldRGOrght8mjxq/iD7M1QcdQciUW', 'giang.vu@company.com', FALSE, 0, TRUE),
('EMP-007', '$2a$10$Vo1beHXFr91Al6IRAWx41uUrKs9/zqFYgKqqjFrcdcRUURPImrV6e', 'ha.do@company.com', FALSE, 0, TRUE),
('EMP-008', '$2a$10$AuSg/1yZJahagUZHgqvrQO7oXpxP8WyfX1Qve37txzgHv2M.HDilO', 'hung.bui@company.com', FALSE, 0, TRUE),
('EMP-009', '$2a$10$HrbCmics5b59lCYnnzgD..kCQzVBk3EI061vzlAWrNMaKmia2Fbky', 'mai.ngo@company.com', FALSE, 0, TRUE),
('EMP-010', '$2a$10$XLui7tM5oj6a2m6b/jIbvOjzzrNwHuH40w305QoV5Som6b7g764VO', 'nam.duong@company.com', FALSE, 0, TRUE)
ON DUPLICATE KEY UPDATE 
    username = VALUES(username),
    password_hash = VALUES(password_hash);

-- 5. Gán vai trò (Roles) tương ứng cho EMP-003 đến EMP-010
-- Quản lý: EMP-004, EMP-008 -> ROLE_MANAGER (role_id = 2)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.username IN ('EMP-004', 'EMP-008');

-- Nhân viên: EMP-003, EMP-005, EMP-006, EMP-007, EMP-009, EMP-010 -> ROLE_EMPLOYEE (role_id = 3)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.username IN ('EMP-003', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-009', 'EMP-010');

-- 6. Liên kết khóa ngoại employees.user_id = users.id cho toàn bộ nhân viên theo mã nhân viên
UPDATE employees e
JOIN users u ON u.username = e.employee_code
SET e.user_id = u.id;

-- 7. Chuẩn hóa position_id chính xác cho nhân sự chủ chốt
-- EMP-001 (Nguyễn Văn An): Quản lý chi nhánh (position_id = 2)
-- EMP-002 (Trần Thị Bích): Quản lý chi nhánh (position_id = 2)
-- EMP-021 (Đinh Thị Uyên): Giám đốc điều hành (position_id = 1)
UPDATE employees SET position_id = 2 WHERE employee_code IN ('EMP-001', 'EMP-002');
UPDATE employees SET position_id = 1 WHERE employee_code = 'EMP-021';

-- 8. Xóa toàn bộ vai trò cũ của các nhân viên đang hoạt động để tránh trùng lặp/tích lũy nhiều vai trò
DELETE ur FROM user_roles ur
JOIN employees e ON e.user_id = ur.user_id
WHERE e.deleted_at IS NULL;

-- 9. Gán lại đúng 1 vai trò duy nhất tương ứng với position_id chuẩn mực
INSERT INTO user_roles (user_id, role_id)
SELECT e.user_id, 
       CASE 
           WHEN e.position_id = 1 THEN 1 -- ROLE_DIRECTOR
           WHEN e.position_id = 2 THEN 2 -- ROLE_MANAGER
           ELSE 3                        -- ROLE_EMPLOYEE
       END
FROM employees e
WHERE e.user_id IS NOT NULL AND e.deleted_at IS NULL;


