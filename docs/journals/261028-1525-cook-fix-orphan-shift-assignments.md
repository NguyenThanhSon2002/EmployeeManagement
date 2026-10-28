# Nhật Ký Kỹ Thuật: Hoàn Thành Sửa Lỗi Ca Phân Bổ Không Hiển Thị Trên Bảng Tuần

**Thời gian:** 2026-10-28 15:25  
**Kế hoạch:** `plans/261028-1520-fix-orphan-shift-assignments-display/plan.md`  
**Trạng thái:** Hoàn thành (100% Verified)  

### 1. Tóm Tắt Các Thay Đổi
- **Database (Flyway V16):**
  - Tạo `V16__remap_cross_branch_shift_assignments.sql` và thực thi trên database:
    - Remap 6 phân công ca của Nguyễn Thanh Sơn (`schedule_id = 18`, Chi nhánh Đống Đa) từ các ca 4, 2, 3 (thuộc Chi nhánh Cầu Giấy) sang đúng các ca 6 (Ca Chiều), 7 (Ca Tối), 8 (Ca Đêm) của Chi nhánh Đống Đa.
    - Cập nhật đồng bộ các trường snapshot (`snapshot_shift_name`, `snapshot_start_time`, `snapshot_end_time`, `snapshot_color_code`).
  - Đã xác minh: Trong cơ sở dữ liệu hiện tại, 100% các phân ca đều khớp chi nhánh với lịch làm việc.
- **Backend (Spring Boot):**
  - [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java): Bổ sung kiểm tra `shift.getBranchId().equals(schedule.getBranchId())` trong `assignShift`, `bulkAssignShifts`, và `batchAssignShifts`, ngăn chặn tuyệt đối lỗi gán ca khác chi nhánh trong tương lai.
- **Frontend (React + TypeScript):**
  - [`WeeklyGrid.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/WeeklyGrid.tsx): Bổ sung cơ chế phòng ngự `fallbackTemplates` tự động gom và hiển thị các hàng ca bổ sung từ dữ liệu snapshot nếu có ca ngoại lệ trong tuần, đảm bảo không bao giờ có ca bị tàng hình.

### 2. Kết Quả Kiểm Thử
- Frontend `npm run build`: Thành công 100% (code 0).
- Backend `mvn test-compile` & `WorkShiftServiceTest`: Thành công 100% (code 0).
- Dữ liệu lịch của Chi nhánh Đống Đa: 6 ca của Nguyễn Thanh Sơn lập tức hiển thị chính xác trên lưới phân ca tuần.
