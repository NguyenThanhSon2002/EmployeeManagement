# Brainstorm Journal: Fix Schedule Publish Conflicts & Improve Dialog UX

- **Thời gian:** 27/10/2026 11:53 (Local Time)
- **Chủ đề:** Khắc phục lỗi không thể công bố lịch tuần và nâng cấp trải nghiệm xử lý xung đột trong `PublishConfirmDialog`.
- **Trạng thái:** Brainstorm hoàn tất, người dùng đã duyệt triển khai theo Phương án 1.

## 1. Bối cảnh & Vấn đề
- Người dùng gặp lỗi khi bấm nút "Công bố lịch": Hộp thoại hiển thị cảnh báo đỏ *"KHÔNG THỂ CÔNG BỐ LỊCH! Hệ thống phát hiện còn X lỗi phân ca nghiêm trọng..."* và nút "Xác nhận công bố" bị khóa hoàn toàn.
- Phân tích mã nguồn phát hiện:
  1. `PublishConfirmDialog.tsx` lấy toàn bộ xung đột trên toàn hệ thống (`Object.values(conflicts).flat()`) mà không lọc theo tuần đang xem (`startDate` $\rightarrow$ `endDate`).
  2. Modal thiếu danh sách chi tiết (Ai bị? Ngày nào? Ca nào vi phạm?), khiến người dùng không biết cách sửa.
  3. Thiếu nút thao tác nhanh để xóa hoặc điều chỉnh ca vi phạm trực tiếp trên modal.

## 2. Quyết định thiết kế (Phương án 1)
- Lọc xung đột nghiêm trọng chuẩn xác trong phạm vi tuần hiện tại.
- Nâng cấp modal hiển thị danh sách chi tiết các ca vi phạm nghiêm trọng (Tên NV, Ngày, Ca trùng, Lý do).
- Bổ sung nút `[🗑️ Hủy ca này]` trực tiếp trên modal để quản lý xử lý ngay lập tức và tự động mở khóa nút công bố lịch khi sạch lỗi.
- Đã lập kế hoạch chi tiết tại [`plans/261027-1153-fix-schedule-publish-conflicts/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1153-fix-schedule-publish-conflicts/plan.md).

## 3. Quá trình triển khai & Kết quả
- **Thay đổi thực hiện:**
  - [`PublishConfirmDialog.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/PublishConfirmDialog.tsx):
    - Nhận thêm các props: `startDate`, `endDate`, `employees`, `assignments`, `onDeleteAssignment`.
    - Lọc xung đột chính xác trong khoảng `workDate >= startDate && workDate <= endDate`.
    - Phân tách xung đột tuần thành `mandatoryConflicts` và `warningConflicts`.
    - Hiển thị danh sách card cuộn các ca vi phạm nghiêm trọng: Tên & mã nhân viên, ngày phân ca (định dạng tiếng Việt), nội dung chi tiết lỗi.
    - Cung cấp nút `[🗑️ Hủy ca này]` cho từng ca vi phạm để hủy nhanh mà không cần đóng dialog đi tìm ô ca.
    - Tự động hiển thị lại giao diện công bố bình thường và nút xanh "Xác nhận công bố" khi số lỗi nghiêm trọng về 0.
  - [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx):
    - Truyền `currentStartDate`, `endDate` (tính từ `baseMonday` + 6 ngày), `employees`, `assignments`, và `onDeleteAssignment` vào `PublishConfirmDialog`.
- **Kiểm thử & Xác minh:**
  - Chạy `npm run build`: Hoàn thành thành công 0 lỗi TypeScript linting.
  - Sẵn sàng kiểm tra trực tiếp trên giao diện trình duyệt.
