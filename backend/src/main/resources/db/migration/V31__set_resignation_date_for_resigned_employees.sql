-- V31: Cập nhật ngày nghỉ việc mặc định cho các nhân sự đã nghỉ việc nhưng chưa có resignation_date
UPDATE employees
SET resignation_date = '2026-11-10'
WHERE employment_status = 'RESIGNED' AND resignation_date IS NULL;
