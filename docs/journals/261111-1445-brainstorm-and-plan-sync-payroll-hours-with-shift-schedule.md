# Journal: Brainstorm & Lập Kế Hoạch Đồng Bộ Giờ Công Theo Lịch Phân Ca & Bỏ Hiển Thị Lương Giám Đốc

- **Thời gian**: 2026-11-11 14:45
- **Nhiệm vụ**: Sửa lỗi giờ công tự động gán 208h và thưởng chuyên cần 500k dù tháng chưa phân ca; đồng bộ giờ công theo đúng lịch phân ca thực tế; giữ nguyên lương cơ bản Full-time; và loại bỏ Giám đốc khỏi bảng lương vận hành chi nhánh.
- **Báo cáo phân tích**: [`plans/reports/261111-1445-sync-payroll-hours-with-shift-schedule-report.md`](file:///D:/Project/Employee%20Management/plans/reports/261111-1445-sync-payroll-hours-with-shift-schedule-report.md)
- **Kế hoạch triển khai**: [`plans/261111-1445-sync-payroll-hours-with-shift-schedule/plan.md`](file:///D:/Project/Employee%20Management/plans/261111-1445-sync-payroll-hours-with-shift-schedule/plan.md)

## Tóm tắt nội dung đã thống nhất:
1. **Giờ công Full-time**:
   - Khi chưa phân ca (hoặc 0 ca làm việc): Giờ công hiển thị đúng `0h` (hoặc `0h FT`), không còn bị ép thành 208h như trước.
   - Khi đã phân ca: Giờ công lấy chính xác theo tổng giờ phân ca thực tế trong tháng.
2. **Lương cơ bản Full-time**:
   - Vẫn giữ nguyên lương cơ bản hợp đồng (`contract.getBaseSalary()`) theo đúng cơ chế lương khoán Full-time.
3. **Thưởng chuyên cần Full-time**:
   - Chỉ xét thưởng khi nhân viên có giờ công thực tế (`actualHours > 0`). Nếu 0h công thì thưởng chuyên cần = `0 đ`.
4. **Bỏ hiển thị lương Giám đốc**:
   - Loại trừ Giám đốc (`positionId == 1L`) khỏi danh sách tính bảng lương trong `PayrollService`.
   - Giúp bảng lương chỉ hiển thị nhân sự vận hành, số lượng nhân sự hiển thị 5 nhân viên và tổng quỹ lương không bị đội thêm lương Giám đốc.
