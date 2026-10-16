# GIAI ĐOẠN 3: CHẤM CÔNG, NGHỈ PHÉP, BÁO CÁO & TÍCH HỢP TOÀN DIỆN FRONTEND

**Mục tiêu giai đoạn:** Xây dựng hoàn chỉnh các phân hệ nghiệp vụ còn lại gồm Chấm công & Giải trình (`attendance`), Nghỉ phép & Quỹ phép (`leave`), Tham số hệ thống (`setting`), Xuất báo cáo Excel/CSV (`report`), và kết nối tích hợp End-to-End giữa Frontend React và Backend Spring Boot.

**Thời lượng dự toán:** 20 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. DANH SÁCH NHIỆM VỤ CHI TIẾT (TASK BREAKDOWN)

### Nhiệm vụ 3.1: Xây dựng Module Chấm Công & Giải Trình Chấm Công (`modules/attendance`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/modules/attendance/domain/AttendanceRecord.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/domain/AttendanceCorrection.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/repository/AttendanceRecordRepository.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/repository/AttendanceCorrectionRepository.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/service/AttendanceService.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/service/AttendanceCalculationService.java`
  - `backend/src/main/java/com/company/hrms/modules/attendance/controller/AttendanceController.java`
- **Mô tả:**
  - `AttendanceCalculationService`: Đối chiếu giờ Check-in / Check-out thực tế với ca phân công trong ngày (`planned_start_time`, `planned_end_time` từ `shift_assignments`):
    - Tính thời gian đi muộn (`late_minutes`) và về sớm (`early_leave_minutes`) có xét thời gian ân hạn (`grace_period_minutes`).
    - Tính số giờ làm thực tế, giờ làm đêm (từ 22:00 đến 06:00 sáng hôm sau), và giờ tăng ca vượt ca quy định.
    - Xác định trạng thái tự động: `PRESENT`, `LATE`, `EARLY_LEAVE`, `MISSING_CHECKOUT`, `ABSENT`.
  - Cung cấp REST APIs:
    - `POST /api/v1/attendance/check-in`: Ghi nhận vào ca.
    - `POST /api/v1/attendance/check-out`: Ghi nhận tan ca, kích hoạt tính toán tổng hợp giờ công.
    - `GET /api/v1/attendance/records`: Danh sách bảng chấm công (lọc theo ngày, phòng ban, nhân viên).
    - `POST /api/v1/attendance/corrections`: Nhân viên gửi yêu cầu giải trình sửa đổi giờ chấm công.
    - `PUT /api/v1/attendance/corrections/{id}/review`: Quản lý phê duyệt hoặc từ chối giải trình.

### Nhiệm vụ 3.2: Xây dựng Module Quản lý Nghỉ Phép & Ngày Lễ (`modules/leave`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/modules/leave/domain/LeaveType.java`
  - `backend/src/main/java/com/company/hrms/modules/leave/domain/LeaveBalance.java`
  - `backend/src/main/java/com/company/hrms/modules/leave/domain/LeaveRequest.java`
  - `backend/src/main/java/com/company/hrms/modules/leave/domain/CompanyHoliday.java`
  - `backend/src/main/java/com/company/hrms/modules/leave/repository/...`
  - `backend/src/main/java/com/company/hrms/modules/leave/service/LeaveService.java`
  - `backend/src/main/java/com/company/hrms/modules/leave/controller/LeaveController.java`
- **Mô tả:**
  - Quản lý quỹ phép năm (`leave_balances`): Hạn mức phép theo thâm niên, số ngày đã dùng, số ngày còn lại.
  - Quy trình phê duyệt đơn nghỉ phép (`leave_requests`):
    - `POST /api/v1/leaves/requests`: Nộp đơn xin nghỉ, tự động kiểm tra quỹ phép còn lại và trùng lặp thời gian (BR-009).
    - `PUT /api/v1/leaves/requests/{id}/approve`: Duyệt đơn (cấp Quản lý phòng ban hoặc HR), tự động trừ ngày phép vào `leave_balances`.
    - `PUT /api/v1/leaves/requests/{id}/reject`: Từ chối đơn, kèm lý do.
  - Quản lý ngày lễ (`company_holidays`): Danh sách ngày lễ trong năm được hưởng nguyên lương.

### Nhiệm vụ 3.3: Xây dựng Module Báo Cáo & Xuất Dữ Liệu (`modules/report`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/modules/report/service/ReportService.java`
  - `backend/src/main/java/com/company/hrms/modules/report/service/ExcelExportService.java`
  - `backend/src/main/java/com/company/hrms/modules/report/controller/ReportController.java`
- **Mô tả:**
  - `GET /api/v1/reports/attendance-summary`: Báo cáo tổng hợp số ngày công, tổng giờ làm, giờ đêm, số lần đi muộn theo phòng ban trong tháng.
  - `GET /api/v1/reports/schedule-compliance`: Báo cáo tỷ lệ tuân thủ kế hoạch phân ca.
  - `GET /api/v1/reports/export/excel`: Xuất file Excel định dạng chuẩn `.xlsx` (Apache POI) có kẻ viền bảng, tiêu đề in đậm, định dạng số giờ rõ ràng.
  - `GET /api/v1/reports/export/csv`: Xuất file CSV có gắn UTF-8 BOM (`\uFEFF`) để chống lỗi hiển thị dấu tiếng Việt trên Microsoft Excel.

### Nhiệm vụ 3.4: Xây dựng Module Tham Số Hệ Thống (`modules/setting`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/modules/setting/domain/SystemSetting.java`
  - `backend/src/main/java/com/company/hrms/modules/setting/service/SystemSettingService.java`
  - `backend/src/main/java/com/company/hrms/modules/setting/controller/SettingController.java`
- **Mô tả:**
  - Quản lý các tham số cấu hình: `min_rest_between_shifts_hours` (mặc định 11h, cho phép chỉnh sang 12h), `max_weekly_hours` (48h), `max_daily_hours` (12h), `grace_period_minutes` (5 phút).
  - Cho phép quản trị viên cập nhật cấu hình tức thời và áp dụng ngay lập tức cho `ConflictDetectionEngine` và `AttendanceCalculationService`.

### Nhiệm vụ 3.5: Tích hợp Toàn diện Frontend & Backend (End-to-End Integration)
- **Tập tin:**
  - `frontend/vite.config.ts` (Thêm cấu hình proxy forward `/api` sang `http://localhost:8080`)
  - `frontend/src/data/services/apiClient.ts` (Axios / Fetch client có gắn JWT token từ AuthStore)
  - `frontend/src/data/services/scheduleService.ts` (Kết nối API thực)
  - `frontend/src/data/services/employeeService.ts` (Kết nối API thực)
  - `frontend/src/data/services/attendanceService.ts` (Kết nối API thực)
- **Mô tả:**
  - Kiểm thử liên thông trọn vẹn:
    1. Đăng nhập từ giao diện React -> Lưu JWT Token -> Tự động chuyển hướng vào Dashboard.
    2. Nạp dữ liệu phòng ban, nhân sự từ MySQL thông qua REST API.
    3. Mở màn hình Phân ca tuần (SCR-11) -> Kéo thả ca -> Gọi API Validate -> Hiển thị cảnh báo trực quan -> Lưu ca và Publish lịch.
    4. Thử nghiệm chấm công và kiểm tra bản ghi cập nhật chính xác trong CSDL.
    5. Xuất báo cáo tải về máy tính và kiểm tra mở bằng Excel.

### Nhiệm vụ 3.6: Kiểm thử Hồi quy, Tối ưu & Đóng gói Sản phẩm
- **Mô tả:**
  - Chạy toàn bộ bộ kiểm thử tự động của Backend (`mvn clean test`).
  - Chạy toàn bộ bộ kiểm thử tự động của Frontend (`npm test`).
  - Đóng gói file `backend/target/hrms-backend-1.0.0.jar` sẵn sàng chạy độc lập bằng lệnh `java -jar`.

---

## 2. TIÊU CHÍ HOÀN THÀNH GIAI ĐOẠN 3 (ACCEPTANCE CRITERIA)
1. Toàn bộ các module Chấm công, Nghỉ phép, Tham số và Báo cáo hoạt động hoàn hảo, đáp ứng 100% hợp đồng API tại `docs/04-api-specification.md`.
2. Frontend React kết nối thông suốt với Backend Spring Boot qua mạng nội bộ mà không gặp lỗi CORS hay Authentication.
3. Xuất file Excel/CSV tiếng Việt hiển thị chuẩn xác, không bị lỗi font.
4. Đóng gói ứng dụng thành công, sẵn sàng triển khai môi trường sản xuất (Production-ready).
