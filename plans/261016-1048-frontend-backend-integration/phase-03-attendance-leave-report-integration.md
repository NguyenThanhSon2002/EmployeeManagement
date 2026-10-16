# GIAI ĐOẠN 3: ĐẤU NỐI CHẤM CÔNG, NGHỈ PHÉP & XUẤT BÁO CÁO EXCEL/CSV

**Mục tiêu:** Hoàn thiện đấu nối các phân hệ nghiệp vụ còn lại: Chấm công, Nghỉ phép, Tham số cấu hình, và Tải file báo cáo Excel/CSV từ Backend.

**Thời lượng dự toán:** 5 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 3.1: Đấu nối Chấm Công & Giải Trình Giờ Công
- **Tập tin:**
  - `frontend/src/features/attendance/AttendanceOverviewPage.tsx`
  - `frontend/src/features/dashboard/components/QuickAttendanceCard.tsx`
  - `frontend/src/features/attendance/components/AttendanceCorrectionModal.tsx`
  - `frontend/src/services/attendanceService.ts`
- **Mô tả:**
  - Nút "Check-in" trên Dashboard gọi `POST /api/v1/attendance/check-in` với vị trí/ghi chú thực tế.
  - Nút "Check-out" gọi `POST /api/v1/attendance/check-out`, nhận kết quả số giờ làm việc, giờ OT, giờ đêm tức thì.
  - Bảng chấm công nạp danh sách từ `GET /api/v1/attendance/records`.
  - Nộp đơn giải trình giờ công gửi đến `POST /api/v1/attendance/corrections`.

### Nhiệm vụ 3.2: Đấu nối Quản Lý Nghỉ Phép & Quỹ Phép Năm
- **Tập tin:**
  - `frontend/src/features/leaves/LeaveRequestsPage.tsx`
  - `frontend/src/features/leaves/components/LeaveRequestModal.tsx`
  - `frontend/src/features/leaves/components/LeaveApprovalModal.tsx`
  - `frontend/src/services/leaveService.ts`
- **Mô tả:**
  - Hiển thị quỹ phép khả dụng từ `GET /api/v1/leaves/balances`.
  - Tạo đơn xin nghỉ phép qua `POST /api/v1/leaves/requests`, tự động xử lý lỗi nếu trùng khoảng thời gian (BR-009).
  - Quản lý duyệt/từ chối đơn qua `PUT /api/v1/leaves/requests/{id}/review`.

### Nhiệm vụ 3.3: Đấu nối Báo Cáo & Tải File Báo Cáo Thực Tế
- **Tập tin:**
  - `frontend/src/features/reports/ReportsPage.tsx`
  - `frontend/src/features/reports/components/MonthlyAttendanceReport.tsx`
  - `frontend/src/services/reportService.ts`
- **Mô tả:**
  - Nạp số liệu tổng hợp công tháng từ `GET /api/v1/reports/attendance-summary`.
  - Nút "Xuất Excel" gọi `GET /api/v1/reports/export/excel`, tải trực tiếp file `.xlsx` định dạng kẻ bảng đẹp về máy tính.
  - Nút "Xuất CSV" gọi `GET /api/v1/reports/export/csv`, tải file `.csv` chuẩn UTF-8 BOM hiển thị chuẩn tiếng Việt trên Excel.

### Nhiệm vụ 3.4: Kiểm Thử Toàn Diện & Nghiệm Thu
- **Mô tả:**
  - Chạy `npm test` trong `frontend/` (đảm bảo 35/35 bài test pass 100%).
  - Chạy `mvn test` trong `backend/` (đảm bảo 36/36 bài test pass 100%).
  - Kiểm thử liên thông End-to-End từ trình duyệt.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Thao tác Check-in/Check-out trên giao diện ghi nhận bản ghi thực tế trong bảng `attendance_records`.
2. Tạo đơn nghỉ phép hiển thị chính xác trong bảng `leave_requests` và trừ quỹ phép tương ứng.
3. Tải file Excel và CSV từ giao diện về máy tính mở được bằng Microsoft Excel với đầy đủ font tiếng Việt.
4. Toàn bộ 71 test cases của cả 2 phân hệ đều Pass 100%.
