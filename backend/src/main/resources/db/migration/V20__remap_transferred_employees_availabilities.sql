-- V20__remap_transferred_employees_availabilities.sql
-- Remap các ca làm việc khả dụng (employee_availabilities) và ca ưu tiên (employee_preferred_shifts)
-- của nhân viên đã chuyển chi nhánh chính sang mẫu ca (work_shifts) tương ứng ở chi nhánh mới theo shift_code.

-- 1. Xóa bản ghi cũ nếu chi nhánh mới đã tồn tại bản ghi khả dụng tương ứng trong cùng ngày
DELETE ea_old FROM employee_availabilities ea_old
JOIN employees e ON ea_old.employee_id = e.id
JOIN work_shifts ws_old ON ea_old.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND ws_old.shift_code = ws_new.shift_code
JOIN employee_availabilities ea_target ON ea_target.employee_id = ea_old.employee_id
                                     AND ea_target.day_of_week = ea_old.day_of_week
                                     AND ea_target.work_shift_id = ws_new.id
WHERE ws_old.branch_id != e.branch_id;

-- 2. Nếu có nhiều bản ghi cũ cùng map về 1 ws_new.id trong cùng 1 ngày, chỉ giữ bản ghi có id nhỏ nhất
DELETE ea2 FROM employee_availabilities ea1
JOIN employee_availabilities ea2 ON ea1.employee_id = ea2.employee_id 
                               AND ea1.day_of_week = ea2.day_of_week
                               AND ea1.id < ea2.id
JOIN employees e ON ea1.employee_id = e.id
JOIN work_shifts ws_old1 ON ea1.work_shift_id = ws_old1.id
JOIN work_shifts ws_old2 ON ea2.work_shift_id = ws_old2.id
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND ws_old1.shift_code = ws_new.shift_code
                        AND ws_old2.shift_code = ws_new.shift_code
WHERE ws_old1.branch_id != e.branch_id 
  AND ws_old2.branch_id != e.branch_id;

-- 3. Cập nhật employee_availabilities sang work_shift_id của chi nhánh mới
UPDATE employee_availabilities ea
JOIN employees e ON ea.employee_id = e.id
JOIN work_shifts ws_old ON ea.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND ws_old.shift_code = ws_new.shift_code
SET ea.work_shift_id = ws_new.id
WHERE ws_old.branch_id != e.branch_id;

-- 4. Ca ưu tiên: Xóa trùng trước khi cập nhật
DELETE eps_old FROM employee_preferred_shifts eps_old
JOIN employees e ON eps_old.employee_id = e.id
JOIN work_shifts ws_old ON eps_old.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND ws_old.shift_code = ws_new.shift_code
JOIN employee_preferred_shifts eps_target ON eps_target.employee_id = eps_old.employee_id
                                         AND eps_target.work_shift_id = ws_new.id
WHERE ws_old.branch_id != e.branch_id;

-- 5. Cập nhật employee_preferred_shifts sang work_shift_id của chi nhánh mới
UPDATE employee_preferred_shifts eps
JOIN employees e ON eps.employee_id = e.id
JOIN work_shifts ws_old ON eps.work_shift_id = ws_old.id
JOIN work_shifts ws_new ON ws_new.branch_id = e.branch_id 
                        AND ws_new.deleted_at IS NULL
                        AND ws_old.shift_code = ws_new.shift_code
SET eps.work_shift_id = ws_new.id
WHERE ws_old.branch_id != e.branch_id;
