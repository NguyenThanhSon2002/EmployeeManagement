-- ==============================================================================
-- V3__seed_admin_user.sql
-- Seed Admin, Managers, and Initial Employees
-- Default Password for all seeded users: Admin@123
-- Hash: $2a$10$xa/zqTnMd9OcSpRkm2eyBOdKj9eNna7sqql.QAPwJaRP0VnyThcUK
-- ==============================================================================

-- 1. Create Users
INSERT INTO users (id, username, password_hash, email, must_change_password, failed_login_attempts, is_active) VALUES
(1, 'admin', '$2a$10$xa/zqTnMd9OcSpRkm2eyBOdKj9eNna7sqql.QAPwJaRP0VnyThcUK', 'admin@company.com', FALSE, 0, TRUE),
(2, 'manager', '$2a$10$xa/zqTnMd9OcSpRkm2eyBOdKj9eNna7sqql.QAPwJaRP0VnyThcUK', 'an.nguyen@company.com', FALSE, 0, TRUE),
(3, 'employee', '$2a$10$xa/zqTnMd9OcSpRkm2eyBOdKj9eNna7sqql.QAPwJaRP0VnyThcUK', 'bich.tran@company.com', FALSE, 0, TRUE)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- 2. Assign User Roles
-- admin -> ROLE_ADMIN
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);
-- manager -> ROLE_DEPT_MANAGER
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (2, 3);
-- employee -> ROLE_EMPLOYEE
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (3, 4);

-- 3. Seed Initial Employees matching frontend mock data
INSERT INTO employees (
    id, user_id, employee_code, full_name, email, phone_number, national_id,
    date_of_birth, gender, department_id, position_id, manager_id, employment_status,
    employment_type, hire_date, is_active
) VALUES
(1, 2, 'EMP-001', 'Nguyễn Văn An', 'an.nguyen@company.com', '0901234567', '001202001111', '1990-05-12', 'MALE', 1, 6, NULL, 'OFFICIAL', 'FULL_TIME', '2022-03-01', TRUE),
(2, 3, 'EMP-002', 'Trần Thị Bích', 'bich.tran@company.com', '0902345678', '001202001112', '1995-08-20', 'FEMALE', 1, 1, 1, 'OFFICIAL', 'FULL_TIME', '2023-05-15', TRUE),
(3, NULL, 'EMP-003', 'Lê Văn Cường', 'cuong.le@company.com', '0903456789', '001202001113', '1998-11-05', 'MALE', 1, 1, 1, 'PROBATION', 'FULL_TIME', '2026-09-01', TRUE),
(4, NULL, 'EMP-004', 'Phạm Văn Dũng', 'dung.pham@company.com', '0904567890', '001202001114', '1992-03-15', 'MALE', 1, 2, 1, 'OFFICIAL', 'FULL_TIME', '2022-10-10', TRUE),
(5, NULL, 'EMP-005', 'Hoàng Thị Em', 'em.hoang@company.com', '0905678901', '001202001115', '1996-07-22', 'FEMALE', 1, 1, 1, 'OFFICIAL', 'FULL_TIME', '2023-01-05', TRUE),
(6, NULL, 'EMP-006', 'Vũ Văn Giang', 'giang.vu@company.com', '0906789012', '001202001116', '1994-12-30', 'MALE', 1, 1, 1, 'OFFICIAL', 'FULL_TIME', '2021-06-18', TRUE),
(7, NULL, 'EMP-007', 'Đỗ Thị Hà', 'ha.do@company.com', '0907890123', '001202001117', '1997-04-14', 'FEMALE', 1, 1, 1, 'OFFICIAL', 'FULL_TIME', '2024-02-01', TRUE),
(8, NULL, 'EMP-008', 'Bùi Văn Hùng', 'hung.bui@company.com', '0908901234', '001202001118', '1991-09-09', 'MALE', 1, 2, 1, 'OFFICIAL', 'FULL_TIME', '2020-11-15', TRUE),
(9, NULL, 'EMP-009', 'Ngô Thị Mai', 'mai.ngo@company.com', '0909012345', '001202001119', '1999-01-25', 'FEMALE', 1, 1, 1, 'PROBATION', 'FULL_TIME', '2026-08-15', TRUE),
(10, NULL, 'EMP-010', 'Dương Văn Nam', 'nam.duong@company.com', '0910123456', '001202001120', '1993-06-17', 'MALE', 1, 1, 1, 'OFFICIAL', 'FULL_TIME', '2022-04-20', TRUE),
(21, 1, 'EMP-021', 'Đinh Thị Uyên', 'uyen.dinh@company.com', '0921234567', '001202001121', '1988-02-14', 'FEMALE', 2, 3, NULL, 'OFFICIAL', 'FULL_TIME', '2020-01-01', TRUE)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 4. Update Manager ID of IT Department to Nguyễn Văn An (id: 1)
UPDATE departments SET manager_id = 1 WHERE id = 1;
