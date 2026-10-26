# Journal: Loại Trừ Chức Danh Giám Đốc Khỏi Phân Chia Ca Làm & Bảng Tổng Hợp Giờ Công

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Nghiệp vụ phân quyền nhân sự ca trực: Tách biệt nhân sự quản trị cấp cao (Giám đốc) khỏi lực lượng trực ca vận hành.

## 1. Vấn Đề Ghi Nhận
- Giám đốc (Nguyễn Thu Phương - EMP-001, `position_id = 1`) đang bị hiển thị trên Bảng tổng hợp giờ công nhân viên trong tuần.
- Thuật toán gán ca tự động và tính năng gán ca thủ công đang xếp Giám đốc vào các ca trực cửa hàng/chi nhánh (như Ca Sáng).
- Tổng số lượng nhân sự hiển thị 8/8 thay vì 7/7 nhân sự trực tiếp làm ca.

## 2. Quyết Định Thống Nhất
- **Loại trừ Giám đốc (`position_id = 1`)**:
  - Không hiển thị trên Bảng tổng hợp giờ công nhân viên trong tuần.
  - Không đưa vào thuật toán xếp ca tự động (`autoAssignShifts`).
  - Không xuất hiện trong modal chọn nhân viên gán ca thủ công (`AssignStaffDrawer`).
  - Thu hồi / dọn dẹp các ca cũ đã lỡ gán cho Giám đốc trong CSDL để định biên ca được chuẩn hóa.
- **Bảo lưu Quản lý cơ sở (`position_id = 2`) và Nhân viên (`position_id = 3`)**: Vẫn tham gia phân ca và tính giờ bình thường.

## 3. Kết Quả Triển Khai & Kiểm Thử
- **Backend ([`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java))**:
  - `getWeeklySchedule`: Đã lọc bỏ `position_id == 1` khỏi danh sách nhân sự trả về và tự động thu hồi/xóa các bản ghi phân ca cũ của Giám đốc trong CSDL.
  - `assignSingleShift`: Đã chặn gán ca đơn lẻ cho Giám đốc với mã lỗi `DIRECTOR_CANNOT_BE_SCHEDULED`.
  - `batchAssignShifts`: Tự động bỏ qua các phân ca nhắm tới Giám đốc.
- **Frontend**:
  - [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx): Lọc bỏ `positionId === 1` khỏi lưới ca và tổng số nhân sự hiển thị (7 / 7 nhân sự).
  - [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts): Cập nhật `isSchedulable` loại trừ `positionId === 1`.
  - [`EmployeeWeeklyHoursTable.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/EmployeeWeeklyHoursTable.tsx): Thêm bộ lọc loại bỏ Giám đốc khỏi Bảng tổng hợp giờ công.
  - [`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx): Loại trừ Giám đốc khỏi danh sách ứng viên gán ca thủ công.
- **Biên dịch & Kiểm chứng**: Backend chạy ổn định, Frontend `npm run build` thành công 0 lỗi. Đã test trực tiếp API backend từ chối phân ca cho Giám đốc đúng chuẩn nghiệp vụ.

