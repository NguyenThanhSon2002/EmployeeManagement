# Journal: Nút Tăng/Giảm Ca (Stepper) Tùy Biến Trong Gán Ca Hàng Loạt

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Thiết kế bộ nút stepper `[+]` và `[-]` tùy biến số ca cho từng nhân sự trong hộp thoại Gán ca làm việc hàng loạt.

## 1. Vấn Đề Ghi Nhận
- Trong hộp thoại "Gán ca làm việc hàng loạt" ([`BulkAssignDialog.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/BulkAssignDialog.tsx)), phần "Mức độ chia đều giờ làm" hiển thị danh sách nhân sự dạng tĩnh:
  `[Tên nhân viên]        +4 ca (+16h)        Tổng 16h`
- Người dùng mong muốn:
  - Thêm bộ nút `[-]` và `[+]` bên cạnh số ca để người quản lý có thể linh hoạt tăng hoặc giảm ca cho từng nhân sự theo ý muốn trước khi áp dụng vào lịch.
  - Bỏ phần hiển thị `(+16h)` bên cạnh số ca vì tổng giờ đã được tổng hợp ở cột bên phải (`Tổng 16h`).
  - Khi bấm `[-]`: Ưu tiên gỡ ca mà **có người khác trong chi nhánh thay thế được trước** để người khác có thể nhận ca đó.
  - Khi bấm `[+]`: Gán từ danh sách ca chưa lấp được; nếu không còn ca trống thì hướng dẫn bấm `[-]` ở người khác để nhả ca trước.

## 2. Giải Pháp & Quyết Định Thiết Kế
- **Phương án lựa chọn:** Điều chỉnh trực tiếp trên bản xem trước (Direct Preview Manipulation - WYSIWYG):
  - Bấm `[-]`: Chọn ca tối ưu (có người thay thế được trước -> có cảnh báo -> ngày muộn nhất), xóa khỏi đề xuất của nhân viên và chuyển vào danh sách `unfilled`.
  - Bấm `[+]`: Tìm trong danh sách `unfilled` ca mà nhân viên này khả dụng và chưa trùng lịch trong ngày để gán thêm.
  - Cập nhật số ca, tổng giờ và danh sách đề xuất tức thời.

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261027-0954-brainstorm-bulk-assign-shift-stepper.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-0954-brainstorm-bulk-assign-shift-stepper.md)
- Kế hoạch triển khai: [`plans/261027-0954-bulk-assign-shift-stepper/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-0954-bulk-assign-shift-stepper/plan.md)
  - [Phase 01: Helper Functions for Incremental Shift Stepper](file:///D:/Project/Employee%20Management/plans/261027-0954-bulk-assign-shift-stepper/phase-01-stepper-logic-helpers.md)
  - [Phase 02: BulkAssignDialog Stepper UI & Real-Time Sync](file:///D:/Project/Employee%20Management/plans/261027-0954-bulk-assign-shift-stepper/phase-02-bulk-assign-dialog-ui.md)
  - [Phase 03: Verification & Build Acceptance](file:///D:/Project/Employee%20Management/plans/261027-0954-bulk-assign-shift-stepper/phase-03-verification-and-testing.md)

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Thuật toán & Helpers:**
  - [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts): Đã bổ sung `pickShiftToRemove` (ưu tiên ca có người thay thế trước -> có cảnh báo -> ngày muộn nhất), `findEligibleUnfilledSlot` (quét ca trống hợp lệ, kiểm tra trùng ca và xung đột), `recalculateAutoSummaries` (tính lại số ca và tổng giờ lũy kế).
- **Giao diện & Đồng bộ:**
  - [`BulkAssignDialog.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/BulkAssignDialog.tsx):
    - Đã bỏ `(+Xh)` bên cạnh số ca, thay bằng bộ nút `[-] {s.addedShifts} ca [+]`.
    - Nút `[-]` bị vô hiệu hóa khi `addedShifts <= 0`.
    - Khi giảm ca: gỡ ca tối ưu chuyển về danh sách `unfilled`, cập nhật đề xuất và tổng giờ tức thì.
    - Khi tăng ca: lấy ca trống từ `unfilled` gán cho nhân viên; nếu không có ca trống thì hiện thông báo hướng dẫn nhả ca trước.
  - [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx): Truyền đầy đủ context props (`employees`, `shiftTemplates`, `existingAssignments`, `approvedLeaves`, `holidays`, `settings`, `isAvailable`, `onToast`) vào dialog.
## 5. Khắc Phục Lỗi Tính Số Giờ Bị Đội Lên Khi Tăng/Giảm Ca
- **Hiện tượng:** Sau khi bấm `[-]` giảm 1 ca (4h), thay vì tổng giờ giảm từ `16h -> 12h` thì lại bị nhảy vọt lên `28h` hoặc cao bất thường.
- **Nguyên nhân:** Hàm `recalculateAutoSummaries` luôn cộng các ca cũ trên lưới tuần vào `baseHours`, trong khi ở chế độ mặc định `REPLACE_ALL`, các ca cũ sẽ bị xóa sạch khi áp dụng (gây lỗi cộng dồn 2 lần).
- **Khắc phục:**
  - Bổ sung tham số `mode` vào `recalculateAutoSummaries`: khi `mode === 'REPLACE_ALL'`, `baseHours = 0`, `totalHours = addedHours`.
  - Khai báo `effectiveExisting` trong `BulkAssignDialog.tsx` để lọc bỏ ca cũ trong tuần khi chạy `REPLACE_ALL`, truyền vào `pickShiftToRemove` và `findEligibleUnfilledSlot`.
- **Kiểm thử:** Đã build `npm run build` thành công 100% (0 lỗi).
