-- ==============================================================================
-- V5__add_table_column_comments.sql
-- Add Business Documentation Comments to Database Tables & Columns
-- Database: MySQL 8.0+ | Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Users
-- ------------------------------------------------------------------------------
ALTER TABLE users
    COMMENT = 'Bảng tài khoản người dùng và xác thực đăng nhập',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Mã định danh duy nhất (Khóa chính) của tài khoản',
    MODIFY COLUMN username VARCHAR(50) NOT NULL COMMENT 'Tên đăng nhập vào hệ thống',
    MODIFY COLUMN password_hash VARCHAR(255) NOT NULL COMMENT 'Chuỗi mật khẩu băm mã hóa bảo mật BCrypt',
    MODIFY COLUMN email VARCHAR(100) NOT NULL COMMENT 'Email nhận thông báo và đặt lại mật khẩu',
    MODIFY COLUMN must_change_password BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cờ bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên',
    MODIFY COLUMN failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần đăng nhập sai mật khẩu liên tiếp',
    MODIFY COLUMN locked_until DATETIME NULL COMMENT 'Thời điểm hết hạn khóa tài khoản tạm thời do nhập sai mật khẩu',
    MODIFY COLUMN last_login_at DATETIME NULL COMMENT 'Thời điểm tài khoản đăng nhập thành công gần nhất',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái tài khoản (1: Đang hoạt động, 0: Bị vô hiệu hóa)',
    MODIFY COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm tài khoản',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật tài khoản gần nhất';

-- ------------------------------------------------------------------------------
-- 2. Roles
-- ------------------------------------------------------------------------------
ALTER TABLE roles
    COMMENT = 'Bảng vai trò người dùng hệ thống (Giám đốc, Quản lý, Nhân viên)',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh vai trò',
    MODIFY COLUMN role_code VARCHAR(50) NOT NULL COMMENT 'Mã vai trò duy nhất (ROLE_DIRECTOR, ROLE_MANAGER, ROLE_EMPLOYEE)',
    MODIFY COLUMN role_name VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị vai trò (Giám đốc, Quản lý cơ sở, Nhân viên)',
    MODIFY COLUMN description VARCHAR(255) NULL COMMENT 'Mô tả phạm vi trách nhiệm và quyền hạn của vai trò',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo vai trò';

-- ------------------------------------------------------------------------------
-- 3. Permissions
-- ------------------------------------------------------------------------------
ALTER TABLE permissions
    COMMENT = 'Bảng danh mục các quyền hạn chức năng chi tiết',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh quyền chức năng',
    MODIFY COLUMN permission_code VARCHAR(100) NOT NULL COMMENT 'Mã quyền chức năng duy nhất (vd: employee:view, schedule:edit)',
    MODIFY COLUMN permission_name VARCHAR(150) NOT NULL COMMENT 'Tên hiển thị mô tả quyền chức năng',
    MODIFY COLUMN module_name VARCHAR(50) NOT NULL COMMENT 'Phân hệ chức năng quản lý quyền (EMPLOYEE, SCHEDULE, ATTENDANCE,...)';

-- ------------------------------------------------------------------------------
-- 4. User Roles
-- ------------------------------------------------------------------------------
ALTER TABLE user_roles
    COMMENT = 'Bảng trung gian phân vai trò cho tài khoản người dùng',
    MODIFY COLUMN user_id BIGINT UNSIGNED NOT NULL COMMENT 'Tài khoản người dùng được gán vai trò',
    MODIFY COLUMN role_id BIGINT UNSIGNED NOT NULL COMMENT 'Vai trò được gán cho tài khoản';

-- ------------------------------------------------------------------------------
-- 5. Role Permissions
-- ------------------------------------------------------------------------------
ALTER TABLE role_permissions
    COMMENT = 'Bảng trung gian cấu hình quyền hạn chức năng cho vai trò',
    MODIFY COLUMN role_id BIGINT UNSIGNED NOT NULL COMMENT 'Vai trò được phân quyền',
    MODIFY COLUMN permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Quyền chức năng được cấp cho vai trò';

-- ------------------------------------------------------------------------------
-- 6. Branches
-- ------------------------------------------------------------------------------
ALTER TABLE branches
    COMMENT = 'Bảng danh mục chi nhánh / cơ sở làm việc của chuỗi',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh chi nhánh/cơ sở',
    MODIFY COLUMN branch_code VARCHAR(50) NOT NULL COMMENT 'Mã chi nhánh duy nhất (vd: CN_CAUGIAY, CN_DONGDA)',
    MODIFY COLUMN branch_name VARCHAR(150) NOT NULL COMMENT 'Tên đầy đủ của chi nhánh / cơ sở làm việc',
    MODIFY COLUMN address VARCHAR(255) NULL COMMENT 'Địa chỉ cơ sở làm việc của chi nhánh',
    MODIFY COLUMN phone_number VARCHAR(20) NULL COMMENT 'Số điện thoại liên lạc của chi nhánh',
    MODIFY COLUMN manager_id BIGINT UNSIGNED NULL COMMENT 'Nhân viên là Quản lý trưởng chi nhánh này',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động (1: Đang hoạt động, 0: Đóng cửa)',
    MODIFY COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm chi nhánh',
    MODIFY COLUMN version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Phiên bản bản ghi phục vụ khóa lạc quan (Optimistic Locking)',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bản ghi chi nhánh',
    MODIFY COLUMN created_by BIGINT UNSIGNED NULL COMMENT 'Người tạo bản ghi chi nhánh',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật chi nhánh gần nhất',
    MODIFY COLUMN updated_by BIGINT UNSIGNED NULL COMMENT 'Người cập nhật chi nhánh gần nhất';

-- ------------------------------------------------------------------------------
-- 7. Positions
-- ------------------------------------------------------------------------------
ALTER TABLE positions
    COMMENT = 'Bảng danh mục vị trí / chức danh công việc của nhân viên',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh chức danh công việc',
    MODIFY COLUMN position_code VARCHAR(50) NOT NULL COMMENT 'Mã chức danh công việc duy nhất (vd: POS_BARISTA, POS_CASHIER)',
    MODIFY COLUMN position_name VARCHAR(150) NOT NULL COMMENT 'Tên chức danh công việc hiển thị',
    MODIFY COLUMN description TEXT NULL COMMENT 'Mô tả tóm tắt nhiệm vụ của chức danh công việc',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái áp dụng (1: Đang dùng, 0: Ngừng dùng)',
    MODIFY COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm chức danh công việc';

-- ------------------------------------------------------------------------------
-- 8. Employees
-- ------------------------------------------------------------------------------
ALTER TABLE employees
    COMMENT = 'Bảng hồ sơ thông tin nhân viên',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh hồ sơ nhân viên',
    MODIFY COLUMN user_id BIGINT UNSIGNED NULL COMMENT 'Tài khoản đăng nhập hệ thống liên kết với nhân viên',
    MODIFY COLUMN employee_code VARCHAR(50) NOT NULL COMMENT 'Mã số nhân viên định danh nội bộ (vd: NV001)',
    MODIFY COLUMN full_name VARCHAR(150) NOT NULL COMMENT 'Họ và tên đầy đủ của nhân viên',
    MODIFY COLUMN email VARCHAR(100) NOT NULL COMMENT 'Email liên hệ công việc hoặc cá nhân của nhân viên',
    MODIFY COLUMN phone_number VARCHAR(20) NOT NULL COMMENT 'Số điện thoại liên lạc của nhân viên',
    MODIFY COLUMN national_id VARCHAR(20) NULL COMMENT 'Số CCCD / CMND hoặc hộ chiếu của nhân viên',
    MODIFY COLUMN date_of_birth DATE NULL COMMENT 'Ngày tháng năm sinh của nhân viên',
    MODIFY COLUMN gender VARCHAR(10) NULL COMMENT 'Giới tính (MALE, FEMALE, OTHER)',
    MODIFY COLUMN address VARCHAR(255) NULL COMMENT 'Địa chỉ nơi cư trú hoặc tạm trú của nhân viên',
    MODIFY COLUMN branch_id BIGINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Chi nhánh / Cơ sở làm việc trực thuộc của nhân viên',
    MODIFY COLUMN position_id BIGINT UNSIGNED NOT NULL COMMENT 'Vị trí / Chức danh công việc của nhân viên',
    MODIFY COLUMN manager_id BIGINT UNSIGNED NULL COMMENT 'Nhân viên quản lý trực tiếp (người duyệt công/phép)',
    MODIFY COLUMN employment_status VARCHAR(20) NOT NULL DEFAULT 'PROBATION' COMMENT 'Trạng thái lao động (PROBATION, ACTIVE, SUSPENDED, RESIGNED)',
    MODIFY COLUMN employment_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME' COMMENT 'Hình thức làm việc (FULL_TIME, PART_TIME, INTERN)',
    MODIFY COLUMN hire_date DATE NOT NULL COMMENT 'Ngày chính thức nhận việc hoặc ký hợp đồng',
    MODIFY COLUMN resignation_date DATE NULL COMMENT 'Ngày chấm dứt hợp đồng lao động và nghỉ việc',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động (1: Đang làm việc, 0: Đã nghỉ việc)',
    MODIFY COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm hồ sơ nhân viên',
    MODIFY COLUMN version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Phiên bản bản ghi phục vụ khóa lạc quan (Optimistic Locking)',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo hồ sơ nhân viên',
    MODIFY COLUMN created_by BIGINT UNSIGNED NULL COMMENT 'Người tạo hồ sơ nhân viên',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật hồ sơ gần nhất',
    MODIFY COLUMN updated_by BIGINT UNSIGNED NULL COMMENT 'Người cập nhật hồ sơ gần nhất';

-- ------------------------------------------------------------------------------
-- 9. Work Shifts
-- ------------------------------------------------------------------------------
ALTER TABLE work_shifts
    COMMENT = 'Bảng định nghĩa các mẫu ca làm việc chuẩn',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh mẫu ca làm việc',
    MODIFY COLUMN shift_code VARCHAR(50) NOT NULL COMMENT 'Mã định danh ca làm việc duy nhất (vd: CA_SANG, CA_CHIEU)',
    MODIFY COLUMN shift_name VARCHAR(100) NOT NULL COMMENT 'Tên ca làm việc hiển thị trên giao diện xếp lịch',
    MODIFY COLUMN start_time TIME NOT NULL COMMENT 'Giờ bắt đầu ca làm việc tiêu chuẩn',
    MODIFY COLUMN end_time TIME NOT NULL COMMENT 'Giờ kết thúc ca làm việc tiêu chuẩn',
    MODIFY COLUMN break_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số phút nghỉ giữa ca không tính công',
    MODIFY COLUMN is_cross_midnight BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Ca làm việc có kéo dài xuyên đêm qua 0h00 không',
    MODIFY COLUMN color_code VARCHAR(20) NOT NULL DEFAULT '#1677FF' COMMENT 'Mã màu nền HEX đại diện cho ca trên lịch tuần',
    MODIFY COLUMN text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' COMMENT 'Mã màu chữ HEX hiển thị trên ô ca làm việc',
    MODIFY COLUMN min_staffing INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Số nhân sự tối thiểu cần có trong ca',
    MODIFY COLUMN max_staffing INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Số nhân sự tối đa cho phép phân vào ca',
    MODIFY COLUMN applicable_days VARCHAR(50) NOT NULL DEFAULT '1,2,3,4,5,6,7' COMMENT 'Các thứ trong tuần áp dụng ca (1: Thứ 2 đến 7: Chủ nhật)',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái mẫu ca (1: Đang áp dụng, 0: Ngừng dùng)',
    MODIFY COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm mẫu ca làm việc';

-- ------------------------------------------------------------------------------
-- 10. Schedules
-- ------------------------------------------------------------------------------
ALTER TABLE schedules
    COMMENT = 'Bảng kế hoạch lịch làm việc tuần theo chi nhánh',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bảng lịch tuần',
    MODIFY COLUMN branch_id BIGINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Chi nhánh / Cơ sở áp dụng bảng lịch tuần này',
    MODIFY COLUMN start_date DATE NOT NULL COMMENT 'Ngày đầu tuần áp dụng lịch (Thứ Hai)',
    MODIFY COLUMN end_date DATE NOT NULL COMMENT 'Ngày cuối tuần áp dụng lịch (Chủ Nhật)',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái lịch (DRAFT: Bản nháp, PUBLISHED: Đã công bố)',
    MODIFY COLUMN published_at DATETIME NULL COMMENT 'Thời điểm Quản lý bấm nút công bố lịch tuần',
    MODIFY COLUMN published_by BIGINT UNSIGNED NULL COMMENT 'Tài khoản người dùng thực hiện công bố lịch',
    MODIFY COLUMN version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Phiên bản lịch tuần chống xung đột khi xếp ca đồng thời',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bảng lịch tuần',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật bảng lịch tuần gần nhất';

-- ------------------------------------------------------------------------------
-- 11. Shift Assignments
-- ------------------------------------------------------------------------------
ALTER TABLE shift_assignments
    COMMENT = 'Bảng chi tiết phân ca làm việc cho nhân viên theo ngày',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bản ghi phân ca',
    MODIFY COLUMN schedule_id BIGINT UNSIGNED NOT NULL COMMENT 'Thuộc bảng lịch tuần nào',
    MODIFY COLUMN employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên được phân công làm ca',
    MODIFY COLUMN work_shift_id BIGINT UNSIGNED NOT NULL COMMENT 'Mẫu ca làm việc gốc được chọn',
    MODIFY COLUMN work_date DATE NOT NULL COMMENT 'Ngày làm việc cụ thể của ca phân công',
    MODIFY COLUMN snapshot_shift_name VARCHAR(100) NOT NULL COMMENT 'Bản sao tên ca tại thời điểm xếp lịch',
    MODIFY COLUMN snapshot_start_time TIME NOT NULL COMMENT 'Bản sao giờ bắt đầu ca tại thời điểm xếp lịch',
    MODIFY COLUMN snapshot_end_time TIME NOT NULL COMMENT 'Bản sao giờ kết thúc ca tại thời điểm xếp lịch',
    MODIFY COLUMN snapshot_break_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Bản sao số phút nghỉ giải lao tại thời điểm xếp lịch',
    MODIFY COLUMN snapshot_cross_midnight BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Bản sao cờ ca qua đêm tại thời điểm xếp lịch',
    MODIFY COLUMN snapshot_color_code VARCHAR(20) NOT NULL DEFAULT '#1677FF' COMMENT 'Bản sao màu sắc ca tại thời điểm xếp lịch',
    MODIFY COLUMN planned_start_time DATETIME NOT NULL COMMENT 'Ngày giờ bắt đầu ca dự kiến chính xác',
    MODIFY COLUMN planned_end_time DATETIME NOT NULL COMMENT 'Ngày giờ kết thúc ca dự kiến chính xác',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED' COMMENT 'Trạng thái phân ca (ASSIGNED, CONFIRMED, CANCELLED)',
    MODIFY COLUMN override_rule VARCHAR(50) NULL COMMENT 'Tên quy tắc phân ca bị ghi đè ngoại lệ',
    MODIFY COLUMN override_reason TEXT NULL COMMENT 'Lý do Quản lý quyết định đặc cách ghi đè quy tắc phân ca',
    MODIFY COLUMN version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Phiên bản bản ghi phục vụ khóa lạc quan',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo phân ca',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật phân ca gần nhất';

-- ------------------------------------------------------------------------------
-- 12. Attendance Records
-- ------------------------------------------------------------------------------
ALTER TABLE attendance_records
    COMMENT = 'Bảng dữ liệu chấm công thực tế của nhân viên theo ngày',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bản ghi chấm công',
    MODIFY COLUMN employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên chấm công',
    MODIFY COLUMN shift_assignment_id BIGINT UNSIGNED NULL COMMENT 'Ca làm việc kế hoạch tương ứng của ngày hôm đó',
    MODIFY COLUMN work_date DATE NOT NULL COMMENT 'Ngày làm việc được ghi nhận công',
    MODIFY COLUMN check_in_time DATETIME NULL COMMENT 'Thời điểm thực tế nhân viên quét vào ca',
    MODIFY COLUMN check_out_time DATETIME NULL COMMENT 'Thời điểm thực tế nhân viên quét ra ca',
    MODIFY COLUMN actual_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng số giờ nhân viên thực tế có mặt làm việc',
    MODIFY COLUMN regular_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ làm việc tiêu chuẩn được tính lương',
    MODIFY COLUMN overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ làm thêm ngoài giờ được tính hệ số tăng ca (OT)',
    MODIFY COLUMN night_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Số giờ làm việc ban đêm hưởng phụ cấp ca đêm',
    MODIFY COLUMN late_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số phút đến muộn so với giờ vào ca quy định',
    MODIFY COLUMN early_leave_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số phút về sớm trước giờ tan ca quy định',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' COMMENT 'Đánh giá ngày công (PRESENT, ABSENT, LATE, ON_LEAVE)',
    MODIFY COLUMN source VARCHAR(30) NOT NULL DEFAULT 'WEB_PORTAL' COMMENT 'Phương thức chấm công (WEB_PORTAL, MOBILE_APP, BIOMETRIC, IMPORT)',
    MODIFY COLUMN is_manually_corrected BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu công đã từng được điều chỉnh qua giải trình',
    MODIFY COLUMN check_in_ip VARCHAR(45) NULL COMMENT 'Địa chỉ IP mạng lúc nhân viên thực hiện check-in',
    MODIFY COLUMN check_out_ip VARCHAR(45) NULL COMMENT 'Địa chỉ IP mạng lúc nhân viên thực hiện check-out',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bản ghi chấm công',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật bản ghi chấm công gần nhất';

-- ------------------------------------------------------------------------------
-- 13. Attendance Corrections
-- ------------------------------------------------------------------------------
ALTER TABLE attendance_corrections
    COMMENT = 'Bảng đơn giải trình / khiếu nại điều chỉnh chấm công',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh đơn giải trình chấm công',
    MODIFY COLUMN attendance_record_id BIGINT UNSIGNED NOT NULL COMMENT 'Bản ghi chấm công cần được đính chính thông tin',
    MODIFY COLUMN employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên nộp đơn giải trình',
    MODIFY COLUMN original_check_in DATETIME NULL COMMENT 'Thời gian check-in cũ đang lưu trên hệ thống',
    MODIFY COLUMN original_check_out DATETIME NULL COMMENT 'Thời gian check-out cũ đang lưu trên hệ thống',
    MODIFY COLUMN requested_check_in DATETIME NOT NULL COMMENT 'Thời gian check-in mới nhân viên đề xuất công nhận lại',
    MODIFY COLUMN requested_check_out DATETIME NOT NULL COMMENT 'Thời gian check-out mới nhân viên đề xuất công nhận lại',
    MODIFY COLUMN reason TEXT NOT NULL COMMENT 'Lý do giải trình (quên quét thẻ, mạng cơ sở lỗi,...)',
    MODIFY COLUMN attachment_url VARCHAR(255) NULL COMMENT 'Đường dẫn ảnh/tài liệu minh chứng đính kèm',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái xét duyệt (PENDING, APPROVED, REJECTED)',
    MODIFY COLUMN reviewed_by BIGINT UNSIGNED NULL COMMENT 'Tài khoản Quản lý đã xét duyệt đơn',
    MODIFY COLUMN reviewed_at DATETIME NULL COMMENT 'Thời điểm Quản lý xét duyệt đơn',
    MODIFY COLUMN rejection_reason TEXT NULL COMMENT 'Lý do từ chối đơn giải trình (nếu không duyệt)',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm nộp đơn giải trình';

-- ------------------------------------------------------------------------------
-- 14. Leave Types
-- ------------------------------------------------------------------------------
ALTER TABLE leave_types
    COMMENT = 'Bảng danh mục các loại nghỉ phép',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh loại nghỉ phép',
    MODIFY COLUMN type_code VARCHAR(50) NOT NULL COMMENT 'Mã loại nghỉ phép duy nhất (ANNUAL, SICK, UNPAID, MATERNITY)',
    MODIFY COLUMN type_name VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị của loại nghỉ phép',
    MODIFY COLUMN is_paid BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Có được hưởng nguyên lương khi nghỉ phép hay không',
    MODIFY COLUMN requires_attachment BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Bắt buộc đính kèm giấy tờ chứng minh hay không',
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái áp dụng loại phép (1: Đang dùng, 0: Ngừng dùng)';

-- ------------------------------------------------------------------------------
-- 15. Leave Balances
-- ------------------------------------------------------------------------------
ALTER TABLE leave_balances
    COMMENT = 'Bảng quỹ phép và hạn mức ngày phép của nhân viên theo năm',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bản ghi quỹ phép',
    MODIFY COLUMN employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên sở hữu quỹ phép',
    MODIFY COLUMN leave_type_id BIGINT UNSIGNED NOT NULL COMMENT 'Loại phép tương ứng của quỹ này',
    MODIFY COLUMN year INT UNSIGNED NOT NULL COMMENT 'Năm dương lịch áp dụng quỹ phép (vd: 2026)',
    MODIFY COLUMN total_allocated DECIMAL(4,1) NOT NULL DEFAULT 12.0 COMMENT 'Tổng số ngày phép được cấp cho nhân viên trong năm',
    MODIFY COLUMN used_days DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Số ngày phép đã sử dụng và được duyệt nghỉ',
    MODIFY COLUMN pending_days DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Số ngày phép trong đơn chờ duyệt (giữ chỗ tạm)',
    MODIFY COLUMN carried_over_days DECIMAL(4,1) NOT NULL DEFAULT 0.0 COMMENT 'Số ngày phép còn dư từ năm trước chuyển sang';

-- ------------------------------------------------------------------------------
-- 16. Leave Requests
-- ------------------------------------------------------------------------------
ALTER TABLE leave_requests
    COMMENT = 'Bảng đơn xin nghỉ phép của nhân viên',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh đơn xin nghỉ phép',
    MODIFY COLUMN employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên làm đơn xin nghỉ phép',
    MODIFY COLUMN leave_type_id BIGINT UNSIGNED NOT NULL COMMENT 'Loại phép nhân viên đăng ký xin nghỉ',
    MODIFY COLUMN start_date DATE NOT NULL COMMENT 'Ngày bắt đầu đợt nghỉ phép',
    MODIFY COLUMN end_date DATE NOT NULL COMMENT 'Ngày kết thúc đợt nghỉ phép',
    MODIFY COLUMN total_days DECIMAL(4,1) NOT NULL COMMENT 'Tổng số ngày xin nghỉ (hỗ trợ nghỉ nửa ngày như 0.5 ngày)',
    MODIFY COLUMN reason TEXT NOT NULL COMMENT 'Lý do xin nghỉ phép cụ thể',
    MODIFY COLUMN attachment_url VARCHAR(255) NULL COMMENT 'Đường dẫn file/ảnh minh chứng đính kèm đơn',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'Trạng thái xử lý (SUBMITTED, TIER1_APPROVED, APPROVED, REJECTED, CANCELLED)',
    MODIFY COLUMN tier1_reviewed_by BIGINT UNSIGNED NULL COMMENT 'Tài khoản Quản lý duyệt đơn ở cấp 1',
    MODIFY COLUMN tier1_reviewed_at DATETIME NULL COMMENT 'Thời điểm Quản lý cấp 1 xét duyệt đơn',
    MODIFY COLUMN tier2_reviewed_by BIGINT UNSIGNED NULL COMMENT 'Tài khoản Giám đốc duyệt đơn ở cấp 2 (duyệt cuối)',
    MODIFY COLUMN tier2_reviewed_at DATETIME NULL COMMENT 'Thời điểm Giám đốc cấp 2 xét duyệt đơn',
    MODIFY COLUMN rejection_reason TEXT NULL COMMENT 'Lý do từ chối đơn xin nghỉ (nếu không duyệt)',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm nộp đơn xin nghỉ phép';

-- ------------------------------------------------------------------------------
-- 17. Company Holidays
-- ------------------------------------------------------------------------------
ALTER TABLE company_holidays
    COMMENT = 'Bảng danh mục các ngày nghỉ lễ tết của công ty',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh ngày nghỉ lễ',
    MODIFY COLUMN holiday_date DATE NOT NULL COMMENT 'Ngày diễn ra dịp nghỉ lễ (vd: 2026-05-01)',
    MODIFY COLUMN holiday_name VARCHAR(150) NOT NULL COMMENT 'Tên gọi của dịp nghỉ lễ',
    MODIFY COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Có tự động lặp lại hàng năm theo dương lịch không',
    MODIFY COLUMN is_paid BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Nghỉ ngày lễ có được tính nguyên lương không';

-- ------------------------------------------------------------------------------
-- 18. Schedule Change History
-- ------------------------------------------------------------------------------
ALTER TABLE schedule_change_history
    COMMENT = 'Bảng nhật ký sửa đổi, hoán đổi ca sau khi lịch đã công bố',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bản ghi lịch sử',
    MODIFY COLUMN schedule_id BIGINT UNSIGNED NOT NULL COMMENT 'Bảng lịch tuần bị thay đổi',
    MODIFY COLUMN shift_assignment_id BIGINT UNSIGNED NOT NULL COMMENT 'Bản ghi phân ca bị thay đổi nội dung',
    MODIFY COLUMN action_type VARCHAR(20) NOT NULL COMMENT 'Hành động sửa đổi (ADD, UPDATE, REMOVE, SWAP)',
    MODIFY COLUMN old_value JSON NULL COMMENT 'Dữ liệu phân ca cũ trước khi sửa đổi dạng JSON',
    MODIFY COLUMN new_value JSON NULL COMMENT 'Dữ liệu phân ca mới sau khi sửa đổi dạng JSON',
    MODIFY COLUMN change_reason TEXT NOT NULL COMMENT 'Lý do điều chỉnh ca sau khi đã công bố lịch',
    MODIFY COLUMN changed_by BIGINT UNSIGNED NOT NULL COMMENT 'Tài khoản người dùng thực hiện điều chỉnh ca',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thực hiện điều chỉnh ca';

-- ------------------------------------------------------------------------------
-- 19. Audit Logs
-- ------------------------------------------------------------------------------
ALTER TABLE audit_logs
    COMMENT = 'Bảng nhật ký kiểm toán hành vi người dùng trên toàn hệ thống',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh bản ghi kiểm toán',
    MODIFY COLUMN user_id BIGINT UNSIGNED NULL COMMENT 'Người dùng thực hiện thao tác (NULL nếu do hệ thống)',
    MODIFY COLUMN action VARCHAR(50) NOT NULL COMMENT 'Hành động nghiệp vụ (LOGIN, CREATE, UPDATE, DELETE, APPROVE)',
    MODIFY COLUMN entity_name VARCHAR(50) NOT NULL COMMENT 'Tên bảng hoặc thực thể bị tác động (Employee, Schedule,...)',
    MODIFY COLUMN entity_id BIGINT UNSIGNED NULL COMMENT 'Khóa chính ID của đối tượng bị thay đổi',
    MODIFY COLUMN ip_address VARCHAR(45) NULL COMMENT 'Địa chỉ IP của máy khách gửi yêu cầu',
    MODIFY COLUMN user_agent VARCHAR(255) NULL COMMENT 'Thông tin trình duyệt và thiết bị của người dùng',
    MODIFY COLUMN details JSON NULL COMMENT 'Dữ liệu chi tiết thay đổi trước và sau dạng JSON',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thực hiện hành vi thao tác';

-- ------------------------------------------------------------------------------
-- 20. System Settings
-- ------------------------------------------------------------------------------
ALTER TABLE system_settings
    COMMENT = 'Bảng lưu trữ các tham số cấu hình vận hành hệ thống',
    MODIFY COLUMN id BIGINT UNSIGNED AUTO_INCREMENT COMMENT 'Khóa chính tự tăng, định danh tham số cấu hình',
    MODIFY COLUMN setting_key VARCHAR(100) NOT NULL COMMENT 'Khóa định danh cấu hình duy nhất (vd: GRACE_PERIOD_MINUTES)',
    MODIFY COLUMN setting_value VARCHAR(255) NOT NULL COMMENT 'Giá trị thiết lập hiện tại của tham số',
    MODIFY COLUMN data_type VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT 'Kiểu dữ liệu của giá trị (STRING, INTEGER, BOOLEAN, JSON)',
    MODIFY COLUMN description VARCHAR(255) NULL COMMENT 'Diễn giải ý nghĩa và phạm vi tác động của tham số',
    MODIFY COLUMN updated_by BIGINT UNSIGNED NULL COMMENT 'Tài khoản người dùng cập nhật tham số gần nhất',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm lưu cập nhật tham số gần nhất';
