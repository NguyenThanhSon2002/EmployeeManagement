# Journal: Brainstorm Khắc Phục Lỗi Gán Hàng Loạt Sai Giới Hạn Định Biên (2/1 NV)

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Khảo sát và thiết kế giải pháp cho lỗi vượt trần định biên khi gán hàng loạt

## 1. Vấn Đề
- Người dùng thực hiện "Gán hàng loạt" nhưng trên lưới xuất hiện các ca có 2 nhân viên (`2/1 NV`) vi phạm trần định biên `1 - 1 NV` đã định sẵn.
- Tổng số ca tuần bị nhảy lên 30 ca (thay vì 28 ca).

## 2. Phát Hiện & Quyết Định
- **Nguyên nhân:** CSDL đã có sẵn 2 ca cũ của Gia Linh từ trước. Khi gán hàng loạt 28 ca mới (trong đó có Duy Anh), backend đối chiếu theo `employee_id + shift_id + date`. Do khác nhân viên, backend chèn thêm Duy Anh vào cùng ô thay vì thay thế ca cũ của Gia Linh.
- **Quyết định:** Bổ sung lựa chọn chế độ phân ca trong modal:
  1. `REPLACE_ALL` (Mặc định - Khuyến nghị): Xóa toàn bộ ca cũ trong khoảng ngày và nạp đúng 28 ca mới chuẩn định biên.
  2. `FILL_MISSING`: Giữ ca cũ, chỉ xếp bù vào các ô còn thiếu và không bao giờ vượt quá `maxStaffing`.

## 3. Kế Hoạch Tiếp Theo
- Kế hoạch thực hiện chi tiết đã được tạo tại [`plans/261026-1146-fix-bulk-assign-quota-limit/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1146-fix-bulk-assign-quota-limit/plan.md).

## 4. Kết Quả Triển Khai
- **Backend:**
  - Cập nhật [`BatchAssignItemsRequest.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/dto/BatchAssignItemsRequest.java) hỗ trợ `mode`, `fromDate`, `toDate`.
  - Cập nhật [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java) thực hiện transactional range cleanup khi `mode == REPLACE_ALL`.
  - Backend compile thành công và test API endpoint `batchAssignShifts` hoạt động chính xác.
- **Frontend:**
  - Cập nhật [`scheduleService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/api/scheduleService.ts) hỗ trợ `mode`, `from_date`, `to_date`.
  - Cập nhật [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts) dọn dẹp ca cũ trong khoảng ngày khi `mode == 'REPLACE_ALL'`.
  - Cập nhật [`BulkAssignDialog.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/BulkAssignDialog.tsx) bổ sung Radio lựa chọn giữa `Xếp lại toàn bộ (Khuyên dùng)` và `Giữ ca hiện có, chỉ điền vào ca còn thiếu`.
  - Cập nhật [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx) truyền đúng mode vào thuật toán xếp lịch và store.
  - Frontend build thành công với 0 lỗi TypeScript / Vite.

