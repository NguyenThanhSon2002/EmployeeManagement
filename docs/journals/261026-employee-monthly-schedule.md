# Journal: Thống Kê & Bộ Lọc Lịch Ca Theo Tháng Cho Nhân Sự

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Tái thiết kế Tab Lịch Ca trong Hồ sơ nhân sự: Thống kê giờ làm & số ca theo tháng hiện tại và bộ lọc tháng có giới hạn (hireDate & branch.createdAt).

## 1. Vấn Đề Ghi Nhận
- Tab "Lịch Ca" trong `EmployeeDetailPage.tsx` hiện tại đang hiển thị toàn bộ các ca phân công của nhân viên trên tất cả các tháng dạng dàn trải không có chọn lọc.
- Người dùng thấy việc hiển thị tất cả các tháng là không cần thiết, muốn tập trung vào tháng hiện tại kèm tổng số giờ làm và tổng số ca.
- Cần có bộ lọc tháng để tra cứu các tháng trước đó, với giới hạn nghiệp vụ: chỉ xem từ tháng nhân sự vào làm (`employee.hireDate`) và không sớm hơn ngày cơ sở bắt đầu hoạt động (`branch.createdAt`).

## 2. Quyết Định Thống Nhất (Sau Khi Brainstorm)
- **Nguồn dữ liệu:** Tạo endpoint chuyên biệt `GET /api/v1/employees/{id}/shifts?month=YYYY-MM` để nạp dữ liệu chính xác và tính tổng số giờ, số ca trực tiếp từ database.
- **Giới hạn bộ lọc tháng:**
  - Cận dưới: `minMonth = max(hireDate, branch.createdAt)`.
  - Cận trên: Cho phép xem tháng hiện tại và tháng tiếp theo (`currentMonth + 1`) nếu đã có lịch xếp trước.
- **Giao diện người dùng:**
  - Thanh chọn tháng (Navigator `< >` và Select dropdown).
  - Khối 3 thẻ thống kê KPI: Tổng số ca làm việc, Tổng số giờ làm việc, Số giờ trung bình / ca.
  - Lưới danh sách ca trong tháng được chọn sắp xếp theo ngày tăng dần.

## 3. Kế Hoạch & Tài Liệu Liên Quan
- Báo cáo brainstorm: [`plans/reports/261026-1558-brainstorm-employee-monthly-schedule.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1558-brainstorm-employee-monthly-schedule.md).
- Kế hoạch triển khai tổng thể: [`plans/261026-1558-employee-monthly-schedule/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1558-employee-monthly-schedule/plan.md).
- Thực thi thông qua: `/aikit-core:xd:cook plans/261026-1558-employee-monthly-schedule`.

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Backend:**
  - Đã tạo [`EmployeeMonthlyScheduleDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/dto/EmployeeMonthlyScheduleDto.java).
  - Đã bổ sung phương thức `getEmployeeMonthlySchedule(Long employeeId, String monthStr)` trong [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java), tự động xác định `earliestAvailableMonth = max(hireDate, branch.createdAt)`, lọc ca trong tháng và tính tổng số giờ (khấu trừ thời gian nghỉ giữa ca).
  - Đã tích hợp API endpoint `GET /api/v1/employees/{id}/shifts?month=YYYY-MM` trong [`EmployeeController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/controller/EmployeeController.java).
  - Đã biên dịch backend thành công (`mvn test-compile`) và khởi động lại Spring Boot dev server.
- **Frontend:**
  - Đã thêm kiểu dữ liệu `EmployeeMonthlySchedule` trong [`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts).
  - Đã thêm API client `getEmployeeMonthlySchedule(id, month)` trong [`employeeService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/api/employeeService.ts).
  - Đã tái cấu trúc hoàn chỉnh Tab "Lịch Ca" trong [`EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx):
    - Thanh điều khiển chuyển đổi tháng: nút `<` `>` điều hướng, dropdown chọn tháng có giới hạn từ ngày sớm nhất tới tháng sau, nút "Tháng này" để quay về nhanh.
    - Bộ 3 thẻ KPI: **Tổng số giờ làm** (giờ), **Tổng số ca làm** (ca), **Thời lượng trung bình / ca** (giờ/ca).
    - Lưới danh sách ca trong tháng phân theo ngày tăng dần, hiển thị màu sắc ca, thời gian, cơ sở phân công và số giờ của ca.
  - Đã kiểm tra build frontend thành công (`npm run build` - 0 lỗi TypeScript).
