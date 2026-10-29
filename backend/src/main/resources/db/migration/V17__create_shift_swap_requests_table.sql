-- V17__create_shift_swap_requests_table.sql
-- Tạo bảng quản lý yêu cầu đổi ca / nhường ca giữa nhân sự

CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,
    branch_id BIGINT UNSIGNED NOT NULL,
    requester_id BIGINT UNSIGNED NOT NULL,
    requester_assignment_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    target_assignment_id BIGINT UNSIGNED NULL,
    type VARCHAR(20) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PEER',
    peer_note VARCHAR(255) NULL,
    peer_responded_at DATETIME NULL,
    manager_id BIGINT UNSIGNED NULL,
    manager_note VARCHAR(255) NULL,
    approved_at DATETIME NULL,
    version INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL,

    CONSTRAINT fk_swap_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_swap_requester FOREIGN KEY (requester_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_swap_req_assign FOREIGN KEY (requester_assignment_id) REFERENCES shift_assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_swap_target FOREIGN KEY (target_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_swap_target_assign FOREIGN KEY (target_assignment_id) REFERENCES shift_assignments(id) ON DELETE SET NULL,
    CONSTRAINT fk_swap_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,

    INDEX idx_swap_branch_status (branch_id, status),
    INDEX idx_swap_requester (requester_id),
    INDEX idx_swap_target (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
