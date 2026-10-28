-- V15__make_work_shifts_branch_specific.sql
-- Loại bỏ hoàn toàn phạm vi mẫu ca Toàn hệ thống dùng chung (branch_id IS NULL)
-- Chuyển 100% mẫu ca sang quản lý theo chi nhánh cụ thể (branch_id NOT NULL)

-- 1. Với các ca branch_id IS NULL đang được gán trong shift_assignments, gán theo branch_id của nhân viên được phân ca
UPDATE work_shifts ws
SET ws.branch_id = (
    SELECT e.branch_id 
    FROM shift_assignments sa 
    JOIN employees e ON sa.employee_id = e.id 
    WHERE sa.work_shift_id = ws.id 
    LIMIT 1
)
WHERE ws.branch_id IS NULL 
  AND EXISTS (SELECT 1 FROM shift_assignments sa WHERE sa.work_shift_id = ws.id);

-- 2. Với các ca branch_id IS NULL còn lại chưa có phân ca, gán cho chi nhánh đầu tiên
UPDATE work_shifts
SET branch_id = (SELECT id FROM branches WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1)
WHERE branch_id IS NULL;

-- 3. Cập nhật ràng buộc cột branch_id sang NOT NULL
ALTER TABLE work_shifts MODIFY COLUMN branch_id BIGINT UNSIGNED NOT NULL;
