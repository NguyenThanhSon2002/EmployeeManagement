# GIAI ĐOẠN 3: ĐẤU NỐI TƯƠNG TÁC CHẤM CÔNG, NGHỈ PHÉP & NGHIỆM THU TOÀN DIỆN

**Mục tiêu:** Hoàn thiện kết nối tương tác trực tiếp của các phân hệ Chấm công, Giải trình công, Quản lý nghỉ phép và Cập nhật hồ sơ nhân sự với CSDL MySQL; thực hiện kiểm thử tự động toàn diện và kiểm tra thực tế trên trình duyệt.

**Thời lượng dự toán:** 2.5 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 3.1: Đấu nối Tương Tác Chấm Công (Check-in / Check-out)
- **Tập tin:**
  - `frontend/src/features/dashboard/components/QuickAttendanceCard.tsx`
  - `frontend/src/features/attendance/AttendanceOverviewPage.tsx`
  - `frontend/src/features/attendance/components/AttendanceCorrectionModal.tsx`
  - `frontend/src/store/useAttendanceStore.ts`
- **Mô tả:**
  - Nút "Check-in":
    - Gửi `POST /api/v1/attendance/check-in`.
    - Backend tự động tính toán thời gian đến, so khớp ca và ghi nhận vào bảng `attendance_records`.
    - Hiển thị Toast: *"Check-in thành công lúc [Giờ] - Trạng thái: [Đúng giờ / Đi muộn]"*.
  - Nút "Check-out":
    - Gửi `POST /api/v1/attendance/check-out`.
    - Backend tính số giờ công thực tế, giờ OT, giờ đêm và cập nhật vào MySQL.
    - Hiển thị Toast: *"Check-out thành công. Tổng giờ công ghi nhận: [Số giờ]h"*.
  - Giải trình giờ công (Correction Request):
    - Gửi `POST /api/v1/attendance/corrections`.
    - Quản lý duyệt giải trình: Gửi `PUT /api/v1/attendance/corrections/{id}/review` -> Cập nhật trạng thái bản ghi trong DB.

---

### Nhiệm vụ 3.2: Đấu nối Tương Tác Quản Lý Nghỉ Phép (Leave Management)
- **Tập tin:**
  - `frontend/src/features/leaves/LeaveRequestsPage.tsx`
  - `frontend/src/features/leaves/components/LeaveRequestModal.tsx`
  - `frontend/src/features/leaves/components/LeaveApprovalModal.tsx`
  - `frontend/src/store/useLeaveStore.ts`
- **Mô tả:**
  - Nộp đơn xin nghỉ mới:
    - Gửi `POST /api/v1/leaves/requests` kèm loại phép, ngày bắt đầu, ngày kết thúc và lý do.
    - Backend kiểm tra trùng lặp (BR-009) và kiểm tra quỹ phép năm còn lại.
    - Ghi nhận bản ghi vào bảng `leave_requests` với trạng thái `SUBMITTED`.
    - Hiển thị Toast: *"Nộp đơn nghỉ phép thành công. Đơn đang chờ quản lý phê duyệt."*
  - Phê duyệt / Từ chối đơn:
    - Sếp bấm "Duyệt đơn": Gửi `PUT /api/v1/leaves/requests/{id}/review` với `action: "APPROVE"`.
    - Backend tự động trừ số ngày phép vào bảng `leave_balances`.
    - Hiển thị Toast: *"Đã phê duyệt đơn nghỉ phép của nhân viên. Dữ liệu đã đồng bộ sang MySQL."*

---

### Nhiệm vụ 3.3: Đấu nối Cập Nhật Hồ Sơ Nhân Viên
- **Tập tin:**
  - `frontend/src/features/employees/EmployeeDetailPage.tsx`
  - `frontend/src/services/employeeService.ts`
- **Mô tả:**
  - Khi quản trị viên chỉnh sửa thông tin nhân viên (Số điện thoại, địa chỉ, trạng thái làm việc) và bấm "Lưu thay đổi":
    - Gửi `PUT /api/v1/employees/{id}` kèm mã phiên bản `version` (Optimistic Locking).
    - Cập nhật thông tin trong bảng `employees` của MySQL.
    - Hiển thị Toast: *"Đã cập nhật thông tin nhân viên vào CSDL MySQL"*.

---

### Nhiệm vụ 3.4: Kiểm Thử Toàn Diện & Nghiệm Thu
- **Thực thi:**
  1. Chạy `npm run build` trong `frontend/` (xác minh 0 lỗi TypeScript, build production thành công).
  2. Chạy `npm test` trong `frontend/` (xác minh 35/35 bài test pass).
  3. Chạy `mvn test` trong `backend/` (xác minh 36/36 bài test pass).
  4. Xác minh trực tiếp trên CSDL MySQL: Dữ liệu phân ca, chấm công, nghỉ phép mới tạo được lưu vĩnh viễn.

---

## 2. Tiêu Chí Nghiệm Thu Giai Đoạn 3
1. Toàn bộ 71/71 bài test kiểm thử tự động của cả 2 phân hệ đều đạt 100% Pass.
2. Thao tác Check-in/Check-out lưu thành công vào MySQL và hiển thị đúng lịch sử công.
3. Đơn nghỉ phép nộp mới lưu vào `leave_requests`, sau khi duyệt thì số ngày phép còn lại trong `leave_balances` giảm tương ứng.
4. Thông tin nhân sự sửa trên giao diện lưu thành công vào bảng `employees`.
