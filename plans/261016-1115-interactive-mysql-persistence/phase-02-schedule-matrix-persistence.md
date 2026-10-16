# GIAI ĐOẠN 2: ĐẤU NỐI TƯƠNG TÁC & LƯU TRỮ BẢNG PHÂN CA TUẦN VÀO MYSQL

**Mục tiêu:** Đảm bảo toàn bộ thao tác thêm ca, đổi ca, xóa ca, công bố lịch trên Ma trận xếp ca tuần (SCR-11 & SCR-12) được lưu vĩnh viễn vào các bảng `schedules`, `shift_assignments`, và `schedule_change_history` trong CSDL MySQL `hrms_db`.

**Thời lượng dự toán:** 3.0 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 2.1: Đồng bộ Schedule ID và Nhân Sự Thật từ MySQL
- **Tập tin:**
  - `frontend/src/store/useScheduleStore.ts`
  - `frontend/src/services/scheduleService.ts`
  - `frontend/src/features/schedule/SchedulePage.tsx`
- **Mô tả:**
  - Khi `fetchWeeklySchedule(departmentId, startDate)` được gọi:
    - Gửi request `GET /api/v1/schedules/weekly` kèm JWT Token.
    - Lưu đúng `schedule_id` thực tế từ MySQL vào store (ví dụ: `scheduleId = 2`), không dùng ID giả `102`.
    - Nạp danh sách nhân viên thực của phòng ban từ `data.employees` và danh mục ca làm việc từ `data.shift_templates`.
    - Nạp các phân công ca đã có trong DB vào `assignmentsMap`.

---

### Nhiệm vụ 2.2: Tương tác Gán ca & Cập nhật ca lưu vào MySQL
- **Tập tin:**
  - `frontend/src/store/useScheduleStore.ts`
  - `frontend/src/features/schedule/dialogs/AssignShiftDrawer.tsx`
- **Mô tả:**
  - Thao tác gán ca mới hoặc sửa ca trong `AssignShiftDrawer.tsx`:
    - Gửi `POST /api/v1/schedules/assignments` với payload:
      ```json
      {
        "schedule_id": state.scheduleId,
        "employee_id": payload.employeeId,
        "work_shift_id": payload.workShiftId,
        "work_date": payload.workDate,
        "override_rule": payload.overrideRule,
        "override_reason": payload.overrideReason,
        "change_reason": payload.changeReason
      }
      ```
    - Nhận phản hồi bản ghi từ Backend, cập nhật `id` và `version` của MySQL vào store.
    - Hiển thị Toast thông báo:
      - 🟢 Thành công: *"Đã lưu phân ca [Tên Ca] cho [Tên Nhân Viên] vào CSDL MySQL"*.
      - 🔴 Thất bại do xung đột (BR-001 -> BR-008): Hiển thị mã lỗi và hướng dẫn xử lý (cho phép quản lý ghi chú lý do ghi đè nếu hợp lệ).

---

### Nhiệm vụ 2.3: Tương tác Xóa ca & Công bố lịch lưu vào MySQL
- **Tập tin:**
  - `frontend/src/store/useScheduleStore.ts`
  - `frontend/src/features/schedule/dialogs/PublishConfirmDialog.tsx`
- **Mô tả:**
  - Thao tác Xóa ca:
    - Khi người dùng click nút "Xóa ca" trong Drawer:
      - Nếu ca đã có ID trong MySQL, gọi `DELETE /api/v1/schedules/assignments/{id}`.
      - Xóa khỏi `assignmentsMap` của store.
      - Hiển thị Toast: *"Đã xóa ca làm việc khỏi CSDL MySQL"*.
  - Thao tác Công bố lịch (Publish Schedule):
    - Khi bấm "Công bố lịch tuần":
      - Gọi `PUT /api/v1/schedules/{id}/publish`.
      - Chuyển `scheduleStatus = 'PUBLISHED'` trong MySQL.
      - Hiển thị Toast: *"Lịch tuần đã được công bố chính thức và lưu vào CSDL"*.

---

## 2. Tiêu Chí Nghiệm Thu Giai Đoạn 2
1. Click vào ô trống trên bảng phân ca -> Chọn ca Sáng/Chiều/Đêm -> Bấm Lưu -> Bản ghi xuất hiện trong bảng `shift_assignments` của MySQL (`SELECT * FROM shift_assignments;`).
2. F5 tải lại trang web -> Ca làm việc vừa gán vẫn xuất hiện đầy đủ trên giao diện.
3. Bấm Xóa ca -> Bản ghi biến mất khỏi MySQL và giao diện.
4. Bấm Công bố lịch -> Trạng thái trong bảng `schedules` chuyển thành `PUBLISHED`.
