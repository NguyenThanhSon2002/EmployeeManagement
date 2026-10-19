-- ==============================================================================
-- V4__replace_department_with_branch.sql
-- Replace Department with Branch & Restructure to 3 Canonical Roles (Director, Manager, Employee)
-- ==============================================================================

-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_code VARCHAR(50) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,
    manager_id BIGINT UNSIGNED NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at DATETIME NULL,
    version INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_branches_code UNIQUE (branch_code),
    INDEX idx_branches_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed Initial Branches
INSERT INTO branches (id, branch_code, branch_name, address, phone_number, is_active) VALUES
(1, 'CN_CAUGIAY', 'Chi nhánh Cầu Giấy', '12 Cầu Giấy, Hà Nội', '0243123456', TRUE),
(2, 'CN_DONGDA', 'Chi nhánh Đống Đa', '45 Chùa Bộc, Hà Nội', '0243654321', TRUE),
(3, 'CN_HOANKIEM', 'Chi nhánh Hoàn Kiếm', '88 Tràng Thi, Hà Nội', '0243987654', TRUE)
ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);

-- 3. Update Employees: Replace department_id with branch_id
ALTER TABLE employees ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER address;
UPDATE employees SET branch_id = 1 WHERE department_id IN (1, 3);
UPDATE employees SET branch_id = 2 WHERE department_id IN (2, 4);

ALTER TABLE employees DROP FOREIGN KEY fk_employees_dept;
ALTER TABLE employees DROP INDEX idx_employees_dept;
ALTER TABLE employees DROP COLUMN department_id;

ALTER TABLE employees ADD CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT;
ALTER TABLE employees ADD INDEX idx_employees_branch (branch_id, employment_status, deleted_at);

-- 4. Update Schedules: Replace department_id with branch_id
ALTER TABLE schedules ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
UPDATE schedules SET branch_id = 1;

ALTER TABLE schedules DROP FOREIGN KEY fk_schedules_dept;
ALTER TABLE schedules DROP INDEX idx_schedules_dept_date;
ALTER TABLE schedules DROP INDEX uq_schedules_dept_week;
ALTER TABLE schedules DROP COLUMN department_id;

-- Deduplicate schedules before creating UNIQUE constraint uq_schedules_branch_week
DELETE s1 FROM schedules s1
INNER JOIN schedules s2 ON s1.branch_id = s2.branch_id AND s1.start_date = s2.start_date AND s1.id != s2.id
WHERE NOT EXISTS (SELECT 1 FROM shift_assignments sa1 WHERE sa1.schedule_id = s1.id)
  AND (
    EXISTS (SELECT 1 FROM shift_assignments sa2 WHERE sa2.schedule_id = s2.id)
    OR s1.id > s2.id
  );

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE schedules ADD CONSTRAINT uq_schedules_branch_week UNIQUE (branch_id, start_date);
ALTER TABLE schedules ADD INDEX idx_schedules_branch_date (branch_id, start_date, end_date, status);

-- 5. Drop Departments Table
ALTER TABLE departments DROP FOREIGN KEY fk_departments_manager;
ALTER TABLE departments DROP FOREIGN KEY fk_departments_parent;
DROP TABLE IF EXISTS departments;

-- 6. Recreate 3 Canonical Roles: Director, Manager, Employee
DELETE FROM role_permissions WHERE role_id > 0;
DELETE FROM user_roles WHERE role_id > 0;
DELETE FROM roles WHERE id > 0;

INSERT INTO roles (id, role_code, role_name, description) VALUES
(1, 'ROLE_DIRECTOR', 'Giám đốc', 'Toàn quyền điều hành hệ thống, quản trị tài khoản và xem báo cáo đa chi nhánh'),
(2, 'ROLE_MANAGER', 'Quản lý cơ sở', 'Xếp ca tuần cho chi nhánh, quản lý nhân sự tại cơ sở và duyệt giải trình chấm công'),
(3, 'ROLE_EMPLOYEE', 'Nhân viên', 'Xem ca cá nhân, đăng ký lịch khả dụng, chấm công và gửi đơn phép');

-- Role permissions mapping
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE permission_code IN (
    'employee:view', 'schedule:view', 'schedule:edit', 'schedule:publish',
    'attendance:checkin', 'attendance:correct', 'leave:request', 'leave:approve', 'report:view'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_code IN (
    'schedule:view', 'attendance:checkin', 'leave:request'
);

-- Users mapping:
-- user 1 (admin) -> Giám đốc (ROLE_DIRECTOR - role 1)
-- user 2 (manager) -> Quản lý (ROLE_MANAGER - role 2)
-- user 3 (employee) -> Nhân viên (ROLE_EMPLOYEE - role 3)
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);
