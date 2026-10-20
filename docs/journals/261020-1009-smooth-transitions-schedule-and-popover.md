# Nhật Ký Kỹ Thuật: Hoàn Thành Bộ Hiệu Ứng Chuyển Cảnh Smooth Cho Lịch Phân Ca & Popover

- **Thời gian:** 20/10/2026 - 10:18 (GMT+7)
- **Tác giả:** Antigravity Team
- **Báo cáo thiết kế:** [plans/reports/261020-1008-smooth-transitions-schedule-and-popover.md](../../plans/reports/261020-1008-smooth-transitions-schedule-and-popover.md)
- **Kế hoạch liên quan:** [plans/261020-1009-smooth-transitions-schedule-and-popover/plan.md](../../plans/261020-1009-smooth-transitions-schedule-and-popover/plan.md)

---

## 1. Yêu Cầu Người Dùng
Bổ sung bộ hiệu ứng chuyển cảnh mềm mại (smooth transitions & micro-interactions) cho hệ thống phân ca:
1. Popover lịch mini (`DatePickerPopover`): Mở ra bung nở tự nhiên, các ô ngày hover phóng to nhẹ nhàng.
2. Điều hướng lịch tuần và tháng: Lướt nhẹ nhàng (soft fade-in & slide), xóa bỏ cảm giác giật khựng (hard snap).
3. Chuyển đổi giữa chế độ Tuần (`WEEK`) và Tháng (`MONTH`): Chuyển cảnh êm ái, liền mạch.

---

## 2. Giải Pháp Kỹ Thuật & Kiến Trúc (Motion Design 60 FPS)

### A. Tối ưu GPU Compositor Thread
- Toàn bộ animation keyframes chỉ tác động vào 2 thuộc tính phần cứng: `transform` và `opacity`.
- Hoàn toàn không gây Reflow (Layout thrashing) hay Repaint trên CPU.
- Ở trạng thái kết thúc (`to`), keyframes giải phóng về `transform: none;` để tránh duy trì GPU stacking context vĩnh viễn, bảo toàn chế độ dựng font chữ nét chuẩn (ClearType/subpixel antialiasing) trên Windows.

### B. Bộ Keyframes & Class Chuyển Động (`schedule.css`)
- `@keyframes popover-spring-in`: `opacity: 0 -> 1`, `transform: translateY(-8px) scale(0.96) -> none` với gia tốc `cubic-bezier(0.16, 1, 0.3, 1)` trong `0.18s`.
- `@keyframes schedule-view-enter`: `opacity: 0.65 -> 1`, `transform: translateY(4px) -> none` trong `0.22s`.
- `.popover-day-btn`: `transition: transform 0.12s ease, background-color 0.12s ease, color 0.12s ease;` kèm hover `transform: scale(1.1)`.
- `.popover-day-cell`: Hover highlight theo tuần mượt mà với `transition: background-color 0.12s ease`.
- Tuân thủ Accessibility (WCAG 2.1 Criteria 2.3.3): `@media (prefers-reduced-motion: reduce)` vô hiệu hóa toàn bộ animation và transition khi người dùng bật giảm chuyển động trên hệ điều hành.

### C. Tích hợp Dynamic Key & Container Transition (`SchedulePage.tsx`)
- Bọc toàn bộ khối ma trận `WeeklyGrid` và `MonthViewGrid` bằng container:
  ```tsx
  <div
    key={`${viewMode}-${viewMode === 'WEEK' ? currentStartDate : format(monthDate, 'yyyy-MM')}`}
    className="schedule-view-animated"
  >
  ```
- Tự động kích hoạt hiệu ứng lướt nhẹ khi người dùng:
  - Bấm `<` hoặc `>` để chuyển tuần/tháng.
  - Bấm chọn bất kỳ ngày nào trong `DatePickerPopover`.
  - Chuyển tab giữa chế độ `WEEK` và `MONTH`.

### D. Tối ưu State Cleanup & Logic (`DatePickerPopover.tsx`)
- Xóa bỏ ternary thừa `isSelectedDay`.
- Dọn dẹp sạch `activeMonth` và `hoveredDate` khi đóng popover (bao gồm nút "Đóng", nút "Hôm nay", phím ESC, và click ngoài popover), đảm bảo popover luôn đồng bộ chuẩn xác khi mở lại.

---

## 3. Kết Quả Kiểm Thử Chất Lượng (Quality Verification)
1. **Kiểm thử tự động (Vitest Suite):** 15/15 tests PASS (100%).
2. **Kiểm tra biên dịch & đóng gói (Build):** `tsc -b && vite build` hoàn tất không lỗi trong 322ms.
3. **Kiểm tra mã tĩnh (Linter):** 0 lint error, 0 warning.
4. **Code Review:** Đánh giá đạt 8.5/10 từ Senior Code Reviewer, 0 lỗi nghiêm trọng, đã hoàn tất toàn bộ chỉnh sửa tối ưu.
5. **Tuân thủ quy tắc người dùng:** Toàn bộ thay đổi được giữ nguyên trong working directory (tab Changes của VS Code) để người dùng kiểm tra trực quan trước khi commit.
