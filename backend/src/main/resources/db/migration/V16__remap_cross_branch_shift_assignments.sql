-- V16__remap_cross_branch_shift_assignments.sql
-- Remap các phân công ca (shift_assignments) đang trỏ nhầm mẫu ca của chi nhánh khác về đúng mẫu ca tương ứng của chi nhánh sở tại

-- 1. Ưu tiên khớp theo tên ca (shift_name)
UPDATE shift_assignments sa
JOIN schedules s ON sa.schedule_id = s.id
JOIN work_shifts ws_old ON sa.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = s.branch_id 
                        AND ws_new.deleted_at IS NULL 
                        AND ws_new.shift_name = ws_old.shift_name
SET sa.work_shift_id = ws_new.id,
    sa.snapshot_shift_name = ws_new.shift_name,
    sa.snapshot_start_time = ws_new.start_time,
    sa.snapshot_end_time = ws_new.end_time,
    sa.snapshot_break_minutes = ws_new.break_minutes,
    sa.snapshot_color_code = ws_new.color_code
WHERE ws_old.branch_id != s.branch_id;

-- 2. Khớp dự phòng theo mã ca (shift_code) nếu chưa khớp
UPDATE shift_assignments sa
JOIN schedules s ON sa.schedule_id = s.id
JOIN work_shifts ws_old ON sa.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = s.branch_id 
                        AND ws_new.deleted_at IS NULL 
                        AND ws_new.shift_code = ws_old.shift_code
SET sa.work_shift_id = ws_new.id,
    sa.snapshot_shift_name = ws_new.shift_name,
    sa.snapshot_start_time = ws_new.start_time,
    sa.snapshot_end_time = ws_new.end_time,
    sa.snapshot_break_minutes = ws_new.break_minutes,
    sa.snapshot_color_code = ws_new.color_code
WHERE ws_old.branch_id != s.branch_id;
