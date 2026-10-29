-- ==============================================================================
-- V18__auto_increment_employee_code.sql
-- Tự động sinh mã nhân viên (EMP-xxx) khi insert vào bảng employees nếu mã chưa có
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_employees_employee_code_auto;

CREATE TRIGGER trg_employees_employee_code_auto
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    DECLARE max_num INT DEFAULT 0;
    IF NEW.employee_code IS NULL OR NEW.employee_code = '' OR NEW.employee_code = 'AUTO' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 5) AS UNSIGNED)), 0)
        INTO max_num
        FROM employees
        WHERE employee_code REGEXP '^EMP-[0-9]+$';
        
        SET NEW.employee_code = CONCAT('EMP-', LPAD(max_num + 1, 3, '0'));
    END IF;
END;
