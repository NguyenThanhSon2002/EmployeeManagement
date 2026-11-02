# Nhật ký kỹ thuật: Lập kế hoạch tự động hợp nhất ca gối đầu & khử trùng lặp giờ công

**Thời gian:** 2026-11-02 14:06 (GMT+7)  
**File kế hoạch:** [plan.md](file:///D:/Project/Employee%20Management/plans/261102-1406-smart-shift-handover-merge/plan.md)  
**Tác giả:** Antigravity / Solution Brainstormer

## 1. Tóm tắt mục tiêu kế hoạch
Giải quyết nhu cầu thực tế của người quản lý trong việc phân công nhân viên làm liên ca nối tiếp:
- **Ca Tối**: 18:00 - 23:00 (5.0h)
- **Ca Đêm**: 22:00 - 02:00 sáng hôm sau (4.0h)
- Khoảng giao ca 60 phút (22:00 - 23:00) hiện đang kích hoạt lỗi `BR-001` (`ERR_SHIFT_OVERLAP` mức `MANDATORY`), ngăn cản việc xếp ca.
- Kế hoạch đưa ra giải pháp toàn diện:
  1. Nhận diện ca gối đầu hợp lệ (cùng chi nhánh, thứ tự nối tiếp $Start_1 < Start_2 < End_1 < End_2$, khoảng trùng $\le 60$p) để không chặn `MANDATORY`.
  2. Sử dụng thuật toán **Merge Intervals** để tự động gộp khoảng thời gian $[18:00, 23:00] \cup [22:00, 02:00] \rightarrow [18:00, 02:00]$ tính đúng **8.0 giờ** làm việc thực tế.
  3. Cập nhật UI/UX hiển thị biểu tượng liên kết `🔗` và cho phép gán mượt mà trong Drawer phân ca.

## 2. Các giai đoạn thực hiện
- **Giai đoạn 1**: Backend Refinement (`ShiftOverlapRule.java`, `DailyHoursLimitRule.java`, `WeeklyHoursLimitRule.java`).
- **Giai đoạn 2**: Frontend Conflict Detector & Merge Intervals Engine (`conflict-detector.utils.ts`, `schedule-calc.utils.ts`).
- **Giai đoạn 3**: UI/UX Bảng Lịch & Drawer Phân Ca (`ShiftGridCell.tsx`, `AssignStaffDrawer.tsx`, `EmployeeWeeklyHoursTable.tsx`).
- **Giai đoạn 4**: Kiểm thử E2E & Rebuild Docker.

## 3. Trạng thái kế hoạch
- `status: pending`
- Sẵn sàng kích hoạt lệnh triển khai khi người dùng phê duyệt.
