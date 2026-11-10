# Journal: Brainstorm & Lập Kế Hoạch Quản Lý Hình Thức Nhân Sự (Full-time / Part-time) & Định Tuyến Giờ Lương Tự Động

- **Thời gian**: 2026-11-10 15:15
- **Nhiệm vụ**: Thêm trường quản lý nhân sự Full-time / Part-time trong hồ sơ nhân viên, tách cột hiển thị trên bảng nhân sự, và tự động định tuyến giờ làm từ bảng phân ca vào đúng ô lương tương ứng.
- **Báo cáo phân tích**: [`plans/reports/261110-1510-employee-employment-type-and-payroll-routing-report.md`](file:///D:/Project/Employee%20Management/plans/reports/261110-1510-employee-employment-type-and-payroll-routing-report.md)
- **Kế hoạch triển khai**: [`plans/261110-1512-employee-employment-type-and-payroll-routing/plan.md`](file:///D:/Project/Employee%20Management/plans/261110-1512-employee-employment-type-and-payroll-routing/plan.md)

## Tóm tắt nội dung đã thống nhất:
1. **Phân quyền**: Chỉ Giám đốc và Admin (`ROLE_DIRECTOR`, `ROLE_ADMIN`) có quyền thay đổi hình thức làm việc giữa Full-time và Part-time. Quản lý cơ sở chỉ được xem dạng khóa 🔒.
2. **Hiển thị bảng nhân sự**: Tách riêng một cột "Hình Thức" trong bảng nhân sự hiển thị badge Full-time / Part-time.
3. **Form hợp đồng nhân sự**: Khi chọn Part-time, hiển thị thêm ô nhập mức lương giờ (mặc định 35.000 đ/h) và tự động đồng bộ sang bảng `salary_contracts`.
4. **Định tuyến tính lương**:
   - Nhân viên Part-time: Giờ làm từ lịch tự động đổ vào `part_time_hours` và tính `part_time_pay`; `actual_hours` và `base_pay` = 0.
   - Nhân viên Full-time: Giờ làm từ lịch đổ vào `actual_hours` và nhận lương cứng `base_pay`; `part_time_hours` và `part_time_pay` = 0.
