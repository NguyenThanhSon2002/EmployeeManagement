-- ==============================================================================
-- V28__create_salary_contracts_and_payroll_tables.sql
-- Phân hệ Tính Lương Tự Động & Thưởng Chuyên Cần
-- ==============================================================================

-- 1. Bảng hợp đồng & cấu hình mức lương nhân viên
CREATE TABLE IF NOT EXISTS salary_contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    salary_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' COMMENT 'MONTHLY hoặc HOURLY',
    base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Lương cơ bản tháng (Full-time)',
    hourly_rate DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Lương theo giờ (Part-time)',
    allowance_lunch DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Phụ cấp ăn trưa',
    allowance_travel DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Phụ cấp đi lại/đa chi nhánh',
    insurance_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Mức lương đóng BHXH',
    tax_dependents INT NOT NULL DEFAULT 0 COMMENT 'Số người phụ thuộc giảm trừ gia cảnh',
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_salary_contract_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_salary_contracts_emp (employee_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng tổng hợp kỳ lương (toàn chuỗi hoặc theo chi nhánh)
CREATE TABLE IF NOT EXISTS payrolls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NULL COMMENT 'Chi nhánh (NULL nếu tính gộp toàn chuỗi)',
    period_month INT NOT NULL COMMENT 'Tháng tính lương (1 - 12)',
    period_year INT NOT NULL COMMENT 'Năm tính lương (YYYY)',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, APPROVED, PAID, LOCKED',
    total_gross DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    total_net DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    total_employees INT NOT NULL DEFAULT 0,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payroll_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payroll_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_payroll_period_branch (period_month, period_year, branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng chi tiết phiếu lương nhân viên trong kỳ
CREATE TABLE IF NOT EXISTS payroll_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    employment_type VARCHAR(20) NOT NULL COMMENT 'FULL_TIME, PART_TIME, PROBATION',
    salary_type VARCHAR(20) NOT NULL COMMENT 'MONTHLY, HOURLY',
    standard_hours DECIMAL(8, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ công chuẩn',
    actual_hours DECIMAL(8, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ công thực tế',
    night_hours DECIMAL(8, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ làm việc ban đêm (22h-06h)',
    late_minutes INT NOT NULL DEFAULT 0 COMMENT 'Tổng số phút đi muộn trong tháng',
    unpaid_leave_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số ngày nghỉ không lương',
    base_pay DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Lương cơ bản theo công thực tế',
    night_pay DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Phụ cấp làm thêm ban đêm (+30%)',
    attendance_bonus DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Thưởng chuyên cần tự động',
    allowances_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng các loại phụ cấp cố định',
    deduction_late DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ phạt đi muộn',
    deduction_unpaid_leave DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ ngày nghỉ không lương',
    insurance_deduction DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ BHXH, BHYT, BHTN (10.5%)',
    tax_deduction DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ thuế TNCN tạm tính',
    gross_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, CONFIRMED',
    note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payroll_item_payroll FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_item_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_payroll_item_emp (payroll_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed hợp đồng lương ban đầu cho nhân sự hiện có
INSERT INTO salary_contracts (employee_id, salary_type, base_salary, hourly_rate, allowance_lunch, allowance_travel, insurance_salary, tax_dependents, effective_from, is_active)
SELECT 
    e.id,
    CASE WHEN e.employment_type = 'PART_TIME' THEN 'HOURLY' ELSE 'MONTHLY' END,
    CASE 
        WHEN e.position_id = 1 THEN 25000000.00 -- Giám đốc
        WHEN e.position_id = 2 THEN 15000000.00 -- Quản lý
        WHEN e.employment_type = 'PART_TIME' THEN 0.00
        ELSE 8500000.00                          -- Nhân viên Full-time
    END,
    CASE WHEN e.employment_type = 'PART_TIME' THEN 35000.00 ELSE 0.00 END,
    730000.00, -- Phụ cấp ăn trưa
    300000.00, -- Phụ cấp đi lại
    CASE WHEN e.employment_type = 'PART_TIME' THEN 0.00 ELSE 5000000.00 END, -- Mức đóng BHXH
    0,
    '2026-01-01',
    1
FROM employees e
WHERE e.deleted_at IS NULL
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
