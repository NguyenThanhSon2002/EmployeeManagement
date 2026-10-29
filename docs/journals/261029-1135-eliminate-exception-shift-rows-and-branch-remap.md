# Journal: Loại bỏ hàng ca ngoại lệ trên Ma trận Lịch tuần & Tự động gán lại ca khi đổi chi nhánh

- **Thời gian:** 2026-10-29 11:35 (UTC+7)
- **Tác vụ:** Loại bỏ hiện tượng tự động sinh hàng mẫu ca "(Ngoại lệ)", dọn dẹp phân ca lệch tuần và tự động chuyển đổi ca khi điều chuyển nhân sự giữa các chi nhánh.

### 1. Thay đổi đã thực hiện
- **Frontend ([`WeeklyGrid.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/WeeklyGrid.tsx)):**
  - Xóa bỏ hoàn toàn logic `fallbackTemplates` tự động sinh các hàng ca có đuôi `(Ngoại lệ)`.
  - Ma trận ca tuần hiện chỉ hiển thị đúng các mẫu ca chuẩn của chi nhánh đang xem (`activeTemplates`).
- **Frontend ([`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx)):**
  - Đặt `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'` cho nhãn tên nhân viên, triệt tiêu lỗi ép chữ dọc từng ký tự.
- **Backend ([`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java)):**
  - Khóa chặt truy vấn phân ca tuần của chi nhánh: Thêm điều kiện `work_date BETWEEN monday AND sunday` khi lấy ca theo schedule, loại bỏ hoàn toàn việc nạp nhầm ca của các tuần khác.
- **Backend ([`EmployeeService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java)):**
  - Thêm phương thức `migrateEmployeeShiftsToNewBranch(Long employeeId, Long oldBranchId, Long newBranchId)`.
  - Tự động kích hoạt khi cập nhật nhân viên nếu `oldBranchId != newBranchId`: chuyển Lịch tuần (`Schedule`) và khớp Mẫu ca (`WorkShift`) của các ca từ tuần hiện tại trở đi sang chi nhánh mới.
- **Database (Flyway Migration V19):**
  - Dọn dẹp 28 bản ghi ca rác có `work_date` thuộc tuần 19/10/2026 - 25/10/2026 đang trỏ nhầm `schedule_id = 5` về đúng `schedule_id = 1`.
  - Remap toàn bộ 84 phân công ca của các nhân viên đã chuyển sang Đống Đa về đúng Lịch tuần (Schedule #18) và các Mẫu ca chuẩn của Đống Đa.
- **Kiểm thử ([`EmployeeBranchTransferTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/employee/EmployeeBranchTransferTest.java)):**
  - Thêm unit test kiểm tra tự động remap ca khi chuyển chi nhánh, pass 100%.

### 2. Kết quả kiểm tra
- Frontend: `npm run build` chạy thành công (`built in 7.71s`).
- Backend: `mvn test -Dtest=EmployeeBranchTransferTest` chạy thành công (`BUILD SUCCESS`).
- Dữ liệu trực tiếp: Ma trận Chi nhánh Cầu Giấy và Chi nhánh Đống Đa đều sạch 100%, không còn bất kỳ hàng ngoại lệ nào.
