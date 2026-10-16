# GIAI ĐOẠN 2: ĐẤU NỐI MA TRẬN XẾP CA TUẦN & CONFLICT DETECTION ENGINE

**Mục tiêu:** Kết nối giao diện xếp ca tuần trực quan (Grid ma trận tuần, Drawer gán ca, thanh công cụ) với hệ thống quản lý lịch tuần trên MySQL, đồng thời tích hợp trực tiếp Engine phát hiện xung đột thời gian thực từ Backend.

**Thời lượng dự toán:** 6 giờ làm việc  
**Trạng thái:** Completed ✅  

---

## 1. Danh Sách Nhiệm Vụ Chi Tiết

### Nhiệm vụ 2.1: Đồng bộ Ma Trận Lịch Tuần (`useScheduleStore`)
- **Tập tin:**
  - `frontend/src/store/useScheduleStore.ts`
  - `frontend/src/services/scheduleService.ts`
  - `frontend/src/features/schedule/SchedulePage.tsx`
- **Mô tả:**
  - Viết action `fetchWeeklySchedule(departmentId, startDate)`:
    - Gọi API `GET /api/v1/schedules/weekly`.
    - Chuyển đổi dữ liệu `ScheduleResponseDto` thành state `assignments`, `shiftTemplates`, `scheduleVersion`, `scheduleStatus`.
  - Hỗ trợ đổi tuần và đổi phòng ban với việc nạp dữ liệu tức thì.

### Nhiệm vụ 2.2: Đấu nối Gán Ca & Quản lý Phiên Bản Lịch
- **Tập tin:**
  - `frontend/src/features/schedule/dialogs/AssignShiftDrawer.tsx`
  - `frontend/src/features/schedule/components/ScheduleCell.tsx`
- **Mô tả:**
  - Thao tác gán/sửa ca gọi `POST /api/v1/schedules/{id}/assignments`.
  - Backend tự động lưu snapshot mẫu ca (`snapshot_shift_name`, v.v.) và tăng `@Version`.
  - Nếu gặp xung đột phiên bản (HTTP 409), hiển thị thông báo "Lịch tuần đã được cập nhật bởi quản lý khác" và tự động tải lại ma trận mới nhất.

### Nhiệm vụ 2.3: Tích hợp Real-time Conflict Engine Dry-Run
- **Tập tin:**
  - `frontend/src/features/schedule/components/ScheduleToolbar.tsx`
  - `frontend/src/features/schedule/dialogs/PublishConfirmDialog.tsx`
- **Mô tả:**
  - Nút "Kiểm tra xung đột" hoặc khi mở dialog "Xuất bản lịch":
    - Gọi `POST /api/v1/schedules/{id}/validate`.
    - Backend chạy qua 8 quy tắc (`BR-001` -> `BR-008`) và trả về danh sách vi phạm.
    - Frontend hiển thị huy hiệu cảnh báo màu cam/đỏ trên từng ô lịch và danh sách tóm tắt các cảnh báo vi phạm.
  - Thao tác Xuất bản lịch: Gọi `POST /api/v1/schedules/{id}/publish`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Giao diện Phân ca tuần hiển thị đúng các ca đã phân công lưu trong MySQL.
2. Thao tác gán ca mới được lưu trữ bền vững vào bảng `shift_assignments` trong CSDL.
3. Khi phân ca trùng giờ hoặc vượt 48h/tuần, gọi API validate hiển thị cảnh báo chính xác từ Backend.
4. Lịch được xuất bản (`PUBLISHED`) và cập nhật trạng thái trong MySQL.
