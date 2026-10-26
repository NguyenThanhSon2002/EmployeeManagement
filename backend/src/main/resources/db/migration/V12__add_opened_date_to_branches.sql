-- V12: Add opened_date to branches
ALTER TABLE branches ADD COLUMN opened_date DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER phone_number;

-- Update existing default branches to have a realistic initial opening date
UPDATE branches SET opened_date = '2026-01-01' WHERE id IN (1, 2, 3);
