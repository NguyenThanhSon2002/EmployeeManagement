-- ==============================================================================
-- V2__seed_master_data.sql
-- Seed initial master data: Roles, Permissions, Departments, Positions, Shifts, Holidays, Leave Types, System Settings
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (id, role_code, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên hệ thống', 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền'),
(2, 'ROLE_HR_MANAGER', 'Trưởng phòng Nhân sự', 'Quản lý hồ sơ nhân viên, phê duyệt phép và tổng hợp bảng chấm công'),
(3, 'ROLE_DEPT_MANAGER', 'Trưởng bộ phận', 'Xếp ca tuần cho phòng ban, phê duyệt đơn giải trình và duyệt phép cấp 1'),
(4, 'ROLE_EMPLOYEE', 'Nhân viên', 'Xem lịch ca cá nhân, chấm công qua web và nộp đơn nghỉ phép')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- 2. Permissions
INSERT INTO permissions (id, permission_code, permission_name, module_name) VALUES
(1, 'employee:view', 'Xem hồ sơ nhân viên', 'EMPLOYEE'),
(2, 'employee:edit', 'Chỉnh sửa hồ sơ nhân viên', 'EMPLOYEE'),
(3, 'schedule:view', 'Xem lịch ca tuần', 'SCHEDULE'),
(4, 'schedule:edit', 'Xếp ca và điều chỉnh ca', 'SCHEDULE'),
(5, 'schedule:publish', 'Công bố lịch ca tuần', 'SCHEDULE'),
(6, 'attendance:checkin', 'Thực hiện chấm công', 'ATTENDANCE'),
(7, 'attendance:correct', 'Duyệt giải trình chấm công', 'ATTENDANCE'),
(8, 'leave:request', 'Nộp đơn xin nghỉ phép', 'LEAVE'),
(9, 'leave:approve', 'Phê duyệt đơn nghỉ phép', 'LEAVE'),
(10, 'report:view', 'Xem và xuất báo cáo', 'REPORT'),
(11, 'setting:edit', 'Cấu hình tham số hệ thống', 'SETTING')
ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name);

-- 3. Role Permissions Mapping
-- Admin has all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- HR Manager permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE permission_code IN (
    'employee:view', 'employee:edit', 'schedule:view', 'attendance:checkin',
    'attendance:correct', 'leave:request', 'leave:approve', 'report:view'
);

-- Dept Manager permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_code IN (
    'employee:view', 'schedule:view', 'schedule:edit', 'schedule:publish',
    'attendance:checkin', 'attendance:correct', 'leave:request', 'leave:approve'
);

-- Employee permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE permission_code IN (
    'schedule:view', 'attendance:checkin', 'leave:request'
);

-- 4. Departments
INSERT INTO departments (id, department_code, department_name, parent_department_id, is_active) VALUES
(1, 'DEPT_IT', 'Phòng Công Nghệ Thông Tin', NULL, TRUE),
(2, 'DEPT_HR', 'Phòng Hành Chính Nhân Sự', NULL, TRUE),
(3, 'DEPT_OPS', 'Phòng Vận Hành & Khai Thác', NULL, TRUE),
(4, 'DEPT_SALES', 'Phòng Kinh Doanh & Tiếp Thị', NULL, TRUE)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- 5. Positions
INSERT INTO positions (id, position_code, position_name, description, is_active) VALUES
(1, 'POS_DEV', 'Kỹ sư phát triển phần mềm', 'Phát triển và bảo trì hệ thống', TRUE),
(2, 'POS_LEAD', 'Trưởng nhóm kỹ thuật', 'Quản lý kỹ thuật và phân bổ tác vụ', TRUE),
(3, 'POS_HR_SPEC', 'Chuyên viên Nhân sự', 'Tuyển dụng, đào tạo và chấm công', TRUE),
(4, 'POS_OPS_SPEC', 'Chuyên viên Vận hành', 'Vận hành hệ thống và xử lý đơn hàng', TRUE),
(5, 'POS_SALES_EXEC', 'Chuyên viên Kinh doanh', 'Phát triển thị trường và chăm sóc khách hàng', TRUE),
(6, 'POS_DEPT_MGR', 'Trưởng phòng / Bộ phận', 'Quản trị điều hành bộ phận', TRUE)
ON DUPLICATE KEY UPDATE position_name = VALUES(position_name);

-- 6. Work Shifts (Mẫu ca làm việc)
INSERT INTO work_shifts (id, shift_code, shift_name, start_time, end_time, break_minutes, is_cross_midnight, color_code, text_color, min_staffing, max_staffing, applicable_days, is_active) VALUES
(1, 'CA_SANG', 'Ca Sáng (06:00 - 14:00)', '06:00:00', '14:00:00', 30, FALSE, '#1677FF', '#FFFFFF', 3, 10, '1,2,3,4,5,6,7', TRUE),
(2, 'CA_CHIEU', 'Ca Chiều (14:00 - 22:00)', '14:00:00', '22:00:00', 30, FALSE, '#52C41A', '#FFFFFF', 3, 10, '1,2,3,4,5,6,7', TRUE),
(3, 'CA_DEM', 'Ca Đêm (22:00 - 06:00)', '22:00:00', '06:00:00', 30, TRUE, '#722ED1', '#FFFFFF', 2, 8, '1,2,3,4,5,6,7', TRUE),
(4, 'CA_HC', 'Hành Chính (08:00 - 17:00)', '08:00:00', '17:00:00', 60, FALSE, '#FA8C16', '#FFFFFF', 1, 15, '1,2,3,4,5', TRUE)
ON DUPLICATE KEY UPDATE shift_name = VALUES(shift_name);

-- 7. Leave Types
INSERT INTO leave_types (id, type_code, type_name, is_paid, requires_attachment, is_active) VALUES
(1, 'ANNUAL_LEAVE', 'Nghỉ phép năm', TRUE, FALSE, TRUE),
(2, 'SICK_LEAVE', 'Nghỉ ốm đau', TRUE, TRUE, TRUE),
(3, 'MATERNITY_LEAVE', 'Nghỉ thai sản', TRUE, TRUE, TRUE),
(4, 'UNPAID_LEAVE', 'Nghỉ không lương', FALSE, FALSE, TRUE),
(5, 'COMPASSIONATE_LEAVE', 'Nghỉ việc riêng có lương', TRUE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- 8. Company Holidays (2026)
INSERT INTO company_holidays (id, holiday_date, holiday_name, is_recurring, is_paid) VALUES
(1, '2026-01-01', 'Tết Dương Lịch', TRUE, TRUE),
(2, '2026-02-16', 'Nghỉ Tết Nguyên Đán (29 Tết)', FALSE, TRUE),
(3, '2026-02-17', 'Nghỉ Tết Nguyên Đán (Mùng 1)', FALSE, TRUE),
(4, '2026-02-18', 'Nghỉ Tết Nguyên Đán (Mùng 2)', FALSE, TRUE),
(5, '2026-02-19', 'Nghỉ Tết Nguyên Đán (Mùng 3)', FALSE, TRUE),
(6, '2026-04-26', 'Giỗ Tổ Hùng Vương (10/3 Âm lịch)', FALSE, TRUE),
(7, '2026-04-30', 'Ngày Giải Phóng Miền Nam', TRUE, TRUE),
(8, '2026-05-01', 'Ngày Quốc Tế Lao Động', TRUE, TRUE),
(9, '2026-09-02', 'Ngày Quốc Khánh', TRUE, TRUE)
ON DUPLICATE KEY UPDATE holiday_name = VALUES(holiday_name);

-- 9. System Settings
INSERT INTO system_settings (id, setting_key, setting_value, data_type, description) VALUES
(1, 'MIN_REST_BETWEEN_SHIFTS_HOURS', '11.0', 'NUMBER', 'Thời gian nghỉ ngơi tối thiểu giữa 2 ca làm việc liên tiếp theo Điều 110 BLLĐ 2019'),
(2, 'MAX_WEEKLY_HOURS', '48.0', 'NUMBER', 'Số giờ làm việc bình thường tối đa trong một tuần'),
(3, 'MAX_DAILY_HOURS', '12.0', 'NUMBER', 'Số giờ làm việc tối đa trong một ngày (bao gồm cả làm thêm giờ)'),
(4, 'GRACE_PERIOD_MINUTES', '5', 'NUMBER', 'Thời gian ân hạn cho phép check-in muộn không bị tính vi phạm'),
(5, 'LEAVE_CONFLICT_SEVERITY', 'WARNING', 'STRING', 'Mức độ cảnh báo khi xếp ca trùng ngày nghỉ phép đã duyệt (WARNING hoặc MANDATORY)')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
