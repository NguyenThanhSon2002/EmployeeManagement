-- ==============================================================================
-- V13__add_employee_avatar.sql
-- Add avatar_url column to employees table
-- ==============================================================================

ALTER TABLE employees ADD COLUMN avatar_url VARCHAR(500) NULL AFTER hire_date;
