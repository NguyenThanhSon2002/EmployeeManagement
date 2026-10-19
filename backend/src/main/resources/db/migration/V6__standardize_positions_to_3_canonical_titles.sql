-- ==============================================================================
-- V6__standardize_positions_to_3_canonical_titles.sql
-- Chuẩn hóa danh mục chức danh (Positions) thành đúng 3 chức danh duy nhất:
-- 1: POS_DIRECTOR - Giám đốc
-- 2: POS_MANAGER - Quản lý
-- 3: POS_EMPLOYEE - Nhân viên
-- ==============================================================================

-- 1. Re-map current employees to the 3 canonical positions
-- Map position_id 6 (Trưởng phòng/bộ phận) & position_id 2 (Trưởng nhóm) -> Quản lý (2)
UPDATE employees SET position_id = 2 WHERE position_id IN (2, 6);

-- Map other previous positions (3, 4, 5, etc.) -> Nhân viên (3)
UPDATE employees SET position_id = 3 WHERE position_id IN (3, 4, 5);

-- Ensure Director role mapping for head director (e.g. employee 1)
UPDATE employees SET position_id = 1 WHERE id = 1;

-- 2. Insert or update the 3 canonical positions
INSERT INTO positions (id, position_code, position_name, description, is_active) VALUES
(1, 'POS_DIRECTOR', 'Giám đốc', 'Giám đốc điều hành toàn diện công ty / chuỗi cơ sở', TRUE),
(2, 'POS_MANAGER', 'Quản lý', 'Quản lý cơ sở / chi nhánh và điều phối nhân sự', TRUE),
(3, 'POS_EMPLOYEE', 'Nhân viên', 'Nhân viên chuyên môn, nghiệp vụ và vận hành tại cơ sở', TRUE)
ON DUPLICATE KEY UPDATE 
    position_code = VALUES(position_code),
    position_name = VALUES(position_name),
    description = VALUES(description),
    is_active = VALUES(is_active);

-- 3. Delete any obsolete position rows beyond the 3 canonical positions
DELETE FROM positions WHERE id > 3;
