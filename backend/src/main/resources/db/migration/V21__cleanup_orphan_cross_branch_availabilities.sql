-- ==============================================================================
-- V21__cleanup_orphan_cross_branch_availabilities.sql
-- Dọn dẹp triệt để các ca khả dụng và ca ưu tiên bị gán sai chi nhánh (cross-branch orphan)
-- phát sinh do các mẫu ca cũ trước khi phân tách chi nhánh.
-- ==============================================================================

-- 1. Xóa các ca khả dụng thuộc chi nhánh mà nhân viên không phụ trách
DELETE ea FROM employee_availabilities ea
JOIN employees e ON ea.employee_id = e.id
JOIN work_shifts ws ON ea.work_shift_id = ws.id
WHERE ws.branch_id != e.branch_id
  AND NOT EXISTS (
      SELECT 1 FROM employee_secondary_branches esb 
      WHERE esb.employee_id = e.id AND esb.branch_id = ws.branch_id
  );

-- 2. Xóa các ca ưu tiên thuộc chi nhánh mà nhân viên không phụ trách
DELETE eps FROM employee_preferred_shifts eps
JOIN employees e ON eps.employee_id = e.id
JOIN work_shifts ws ON eps.work_shift_id = ws.id
WHERE ws.branch_id != e.branch_id
  AND NOT EXISTS (
      SELECT 1 FROM employee_secondary_branches esb 
      WHERE esb.employee_id = e.id AND esb.branch_id = ws.branch_id
  );
