# Journal: Cho Phép Gán Ca Vượt Định Biên & Hiển Thị Thẻ Cảnh Báo Viền Cam

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Khắc phục lỗi "Lỗi phân ca" trong store và hiển thị thẻ nhân viên cảnh báo viền cam.

## 1. Vấn Đề Ghi Nhận
- Sau khi mở khóa Drawer, người dùng phân thêm nhân sự vào ca đã đủ người thì gặp Toast: *"Lỗi phân ca: Ca Ca Sáng ngày 26/10/2026 đã đủ định biên tối đa (1 người)"*.
- Nguyên nhân: Trong hàm `assignShift` của `useScheduleStore.ts` còn sót lại đoạn kiểm tra `staffCount >= template.maxStaffing` trả về lỗi.
- Khách hàng mong muốn: Không báo lỗi, cho phép thêm nhân viên và hiển thị thẻ nhân viên có icon cảnh báo `⚠` kèm viền cam đúng mẫu `pasted-image-4406.png`.

## 2. Giải Pháp Thống Nhất
- **Gỡ bỏ kiểm tra chặn trong `useScheduleStore.ts`**: Cho phép `assignShift` luôn gán ca thành công.
- **Tích hợp cảnh báo `WARN_STAFFING_CAPACITY` vào `computeAllConflicts`**: Để mọi nhân viên được bổ sung vượt định biên đều nhận cảnh báo xung đột mức `WARNING`.
- **Hiển thị giao diện**: Thẻ nhân sự trên lưới tuần có icon `⚠` và viền cam `#F59E0B` đúng chuẩn giao diện cảnh báo.

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261027-0847-brainstorm-allow-manual-assign-with-warning.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-0847-brainstorm-allow-manual-assign-with-warning.md).
- Kế hoạch thực hiện: [`plans/261027-0847-allow-manual-assign-with-warning/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-0847-allow-manual-assign-with-warning/plan.md).
  - [Phase 01: Frontend Store Unblock Assign Shift & Allow Capacity Exceed](file:///D:/Project/Employee%20Management/plans/261027-0847-allow-manual-assign-with-warning/phase-01-frontend-store-unblock-assign-shift.md)
  - [Phase 02: Frontend Capacity Warning Conflict Integration & Chip Styling](file:///D:/Project/Employee%20Management/plans/261027-0847-allow-manual-assign-with-warning/phase-02-frontend-conflict-warning-and-chip-display.md)

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Store & Core Logic:**
  - [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts): Đã xóa bỏ đoạn mã chặn trần `maxStaffing` trong `assignShift`. Đã xóa hàm thừa `buildShiftStaffCount`.
  - Tích hợp kiểm tra trần định biên theo ô ca vào `computeAllConflicts` với mã luật `WARN_STAFFING_CAPACITY`.
  - Cập nhật [`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts) bổ sung `'WARN_STAFFING_CAPACITY'` vào union `ConflictRuleCode`.
- **Giao Diện:**
  - Thẻ nhân viên khi có cảnh báo (do vượt định biên hoặc do luật nghỉ giữa ca, khoảng đệm di chuyển) tự động nhận viền cam `#F59E0B` và biểu tượng `⚠` (`AlertTriangle`) đúng chuẩn như mẫu `pasted-image-4406.png`.
- **Đóng gói:**
  - `npm run build` thành công 100% (0 lỗi TypeScript / Vite).
