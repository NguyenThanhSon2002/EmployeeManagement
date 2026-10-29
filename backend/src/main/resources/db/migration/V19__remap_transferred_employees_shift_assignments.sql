-- V19__remap_transferred_employees_shift_assignments.sql
-- Remap các phân công ca (shift_assignments) của nhân sự đã được điều chuyển sang chi nhánh mới (từ tuần 2026-10-26 trở đi)
-- về đúng Lịch tuần (schedules) và Mẫu ca (work_shifts) của chi nhánh sở tại hiện tại của nhân sự.

-- 0. Dọn dẹp các phân ca bị gán nhầm schedule_id của tuần khác về đúng schedule_id của tuần đó
UPDATE shift_assignments sa
JOIN schedules s ON sa.schedule_id = s.id
JOIN schedules s_correct ON s_correct.branch_id = s.branch_id 
                         AND sa.work_date BETWEEN s_correct.start_date AND s_correct.end_date
SET sa.schedule_id = s_correct.id
WHERE sa.work_date < s.start_date OR sa.work_date > s.end_date;

-- 1. Đảm bảo tồn tại bản ghi Lịch tuần (schedules) cho chi nhánh mới của nhân viên
INSERT INTO schedules (branch_id, start_date, end_date, status, version)
SELECT DISTINCT e.branch_id, s.start_date, s.end_date, 'DRAFT', 1
FROM shift_assignments sa
JOIN schedules s ON sa.schedule_id = s.id
JOIN employees e ON sa.employee_id = e.id
LEFT JOIN schedules s_target ON s_target.branch_id = e.branch_id AND s_target.start_date = s.start_date
WHERE s.branch_id != e.branch_id
  AND sa.work_date >= '2026-10-26'
  AND s_target.id IS NULL;

-- 2. Cập nhật các phân công ca sang đúng Lịch tuần và Mẫu ca tương ứng của chi nhánh mới
UPDATE shift_assignments sa
JOIN schedules s ON sa.schedule_id = s.id
JOIN employees e ON sa.employee_id = e.id
JOIN schedules s_target ON s_target.branch_id = e.branch_id AND s_target.start_date = s.start_date
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND (
                            sa.snapshot_shift_name = ws_new.shift_name 
                            OR sa.snapshot_shift_name LIKE CONCAT(ws_new.shift_name, ' %')
                            OR ws_new.shift_name LIKE CONCAT(sa.snapshot_shift_name, ' %')
                        )
SET sa.schedule_id = s_target.id,
    sa.work_shift_id = ws_new.id,
    sa.snapshot_shift_name = ws_new.shift_name,
    sa.snapshot_start_time = ws_new.start_time,
    sa.snapshot_end_time = ws_new.end_time,
    sa.snapshot_break_minutes = ws_new.break_minutes,
    sa.snapshot_cross_midnight = ws_new.is_cross_midnight,
    sa.snapshot_color_code = ws_new.color_code,
    sa.planned_start_time = CONCAT(sa.work_date, ' ', ws_new.start_time),
    sa.planned_end_time = CASE 
        WHEN ws_new.is_cross_midnight THEN CONCAT(DATE_ADD(sa.work_date, INTERVAL 1 DAY), ' ', ws_new.end_time)
        ELSE CONCAT(sa.work_date, ' ', ws_new.end_time)
    END
WHERE s.branch_id != e.branch_id
  AND sa.work_date >= '2026-10-26';
