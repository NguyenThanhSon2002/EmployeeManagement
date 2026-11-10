-- ==============================================================================
-- V30__add_part_time_hours_and_pay_to_payroll_items.sql
-- Bổ sung số giờ công và lương Part-time riêng biệt cho payroll_items
-- ==============================================================================

ALTER TABLE payroll_items
ADD COLUMN part_time_hours DECIMAL(8, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ làm việc Part-time' AFTER actual_hours,
ADD COLUMN part_time_pay DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Lương làm việc Part-time theo giờ' AFTER base_pay;
