-- ==============================================================================
-- V23__allow_null_shift_colors.sql
-- Allow nullable color_code and text_color for uncolored shift templates
-- ==============================================================================

ALTER TABLE work_shifts MODIFY COLUMN color_code VARCHAR(20) NULL DEFAULT NULL COMMENT 'Mã màu nền HEX đại diện cho ca trên lịch tuần (NULL nếu không đặt màu)';
ALTER TABLE work_shifts MODIFY COLUMN text_color VARCHAR(20) NULL DEFAULT NULL COMMENT 'Mã màu chữ HEX hiển thị trên ô ca làm việc (NULL nếu không đặt màu)';
ALTER TABLE shift_assignments MODIFY COLUMN snapshot_color_code VARCHAR(20) NULL DEFAULT NULL COMMENT 'Bản sao màu sắc ca tại thời điểm xếp lịch';
