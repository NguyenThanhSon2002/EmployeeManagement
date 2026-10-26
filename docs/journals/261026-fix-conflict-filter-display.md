# Journal: Khắc Phục Lỗi Hiển Thị Bộ Lọc Cảnh Báo Xung Đột Trên Ma Trận Lịch

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Tối ưu hóa bộ lọc và trải nghiệm cảnh báo xung đột (Conflict Filter & Focus Mode) trên ma trận lịch làm việc.

## 1. Vấn Đề Ghi Nhận
- Khi bật chế độ "Chỉ hiện có xung đột" (`onlyShowConflicts = true`):
  - Thanh bộ lọc hiển thị sai `Hiển thị 5 / 6 nhân sự` dù cả tuần 19/10/2026 chỉ có 1 nhân sự (Nguyễn Tử Duy Anh) có 2 ca vi phạm.
  - Trên ma trận, các ca của Nguyễn Xuân Tài (Ca Đêm) bị biến mất thành `Chưa phân ca (0/1 NV)`, trong khi các nhân viên không có xung đột khác vẫn hiển thị bình thường.
  - Các ca không có xung đột của Nguyễn Tử Duy Anh (Thứ Hai, Thứ Ba, Thứ Tư, Thứ Bảy) vẫn hiển thị bình thường, gây khó phân biệt đâu là ca lỗi.
- **Nguyên nhân kỹ thuật:**
  1. `filteredEmployees` trong `SchedulePage.tsx` kiểm tra xung đột `key.startsWith(`${emp.id}_`)` trên toàn bộ lịch sử trong store mà không giới hạn trong tuần đang hiển thị (`currentStartDate` đến `sundayStr`).
  2. Việc lọc mảng nhân viên truyền vào ma trận mẫu ca (`WeeklyGrid`) khiến các ô ca của nhân sự bị loại chuyển thành ô rỗng `Chưa phân ca`, làm người dùng tưởng mất lịch.

## 2. Quyết Định Thống Nhất
- **Chọn Phương án 1 (Chế độ Focus trực quan - Highlight & Dimming):**
  - Giữ nguyên toàn bộ phân ca của ma trận tuần, không làm rỗng ca của bất kỳ ai.
  - Khi bật "Chỉ hiện có xung đột":
    - Các ô không có xung đột được làm mờ nhẹ (`opacity: 0.25`).
    - Các ô có nhân sự xung đột được làm nổi bật rực rỡ với viền vàng hổ phách (`box-shadow: 0 0 12px rgba(245, 158, 11, 0.35)`), badge cảnh báo và chip nhân viên nổi bật.
    - Tự động cuộn màn hình đến ô ca xung đột đầu tiên.
  - Sửa hàm lọc trong `filteredEmployees` để giới hạn đúng phạm vi tuần hiện tại, hiển thị đúng `Hiển thị 1 / 6 nhân sự (2 xung đột)`.

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261026-1438-brainstorm-fix-conflict-filter-display.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1438-brainstorm-fix-conflict-filter-display.md).
- Kế hoạch triển khai tổng thể: [`plans/261026-1439-fix-conflict-filter-display/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1439-fix-conflict-filter-display/plan.md).

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Sửa phạm vi ngày trong `filteredEmployees`**:
  - Giới hạn kiểm tra xung đột đúng phạm vi tuần đang xem (`currentStartDate` đến `sundayStr`).
  - Thanh bộ lọc [`ScheduleFiltersBar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ScheduleFiltersBar.tsx) hiển thị chính xác: `Hiển thị 1 / 6 nhân sự có xung đột`.
- **Bảo toàn dữ liệu ma trận ca**:
  - Tách `gridEmployees` truyền vào [`WeeklyGrid.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/WeeklyGrid.tsx), đảm bảo không một ca nào bị xóa hay biến thành `Chưa phân ca (0/1 NV)`.
  - Toàn bộ ca của Nguyễn Xuân Tài (Ca Đêm) vẫn hiển thị đầy đủ.
- **Chế độ Focus trực quan (Highlight & Dimming)**:
  - Cập nhật [`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx): các ô không có xung đột được làm mờ nhẹ (`opacity: 0.25`), 2 ô ca vi phạm Thứ Năm của Nguyễn Tử Duy Anh nổi bật với viền vàng hổ phách và hiệu ứng phát sáng.
  - Tự động cuộn mượt (auto-scroll) đến ô xung đột đầu tiên khi bật bộ lọc.
- **Biên dịch Frontend**: `npm run build` thành công 100% (0 lỗi).
