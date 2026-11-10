-- ==============================================================================
-- V29__add_adjustments_detail_to_payroll_items.sql
-- Thêm cột adjustments_detail để lưu trữ chi tiết các khoản phụ cấp, thưởng, phạt động dạng JSON
-- ==============================================================================

ALTER TABLE payroll_items
ADD COLUMN adjustments_detail JSON NULL COMMENT 'Chi tiết các khoản phụ cấp, thưởng, phạt động dạng JSON'
AFTER note;
