# Journal Entry: Brainstorm & Lập Kế Hoạch Sửa Lỗi Reset Tuần Không Xóa Phân Ca

- **Thời gian:** 09/11/2026 09:16:00
- **Kế hoạch liên quan:** [plans/261109-0915-fix-schedule-reset-bug/plan.md](../../plans/261109-0915-fix-schedule-reset-bug/plan.md)
- **Báo cáo phân tích:** [plans/reports/261109-0914-schedule-reset-bug-fix-report.md](../../plans/reports/261109-0914-schedule-reset-bug-fix-report.md)
- **Tác giả:** Antigravity AI Assistant

---

## 1. Vấn Đề Gặp Phải
Người dùng phản ánh lỗi: Thao tác "Reset tuần" trên giao diện xếp ca thông báo thành công nhưng thực tế các phân ca không hề bị xóa (khi F5 hoặc chuyển tuần thì ca cũ lập tức xuất hiện trở lại).

---

## 2. Kết Quả Điều Tra & Phân Tích
1. **Thiếu Endpoint Backend:** Backend Spring Boot chưa có API xóa toàn bộ phân ca của lịch tuần theo `scheduleId`.
2. **Gọi Sai Endpoint:** Frontend `useScheduleStore.ts` gọi `scheduleService.deleteAssignment(scheduleId)` (vốn là endpoint xóa 1 ca đơn lẻ nhận `assignmentId`) $\rightarrow$ Backend trả về lỗi 404 `ResourceNotFoundException`.
3. **Nuốt Lỗi:** Khối `catch` nuốt chửng lỗi và vẫn hiển thị toast thành công.
4. **Không Đồng Bộ CSDL:** MySQL không xóa bất kỳ dòng nào trong `shift_assignments`, dẫn đến khi re-fetch thì dữ liệu cũ lại đổ về.
5. **Ghi Đè Cache Sai:** `saveBranchScheduleToStorage` lưu mảng ca của tuần khác vào key tuần hiện tại.

---

## 3. Quyết Định Kiến Trúc (Được Người Dùng Phê Duyệt)
- Thống nhất thực hiện **Phương án 1 (Full-stack Reset API)**:
  - Backend: Thêm endpoint `DELETE /api/v1/schedules/{id}/assignments`, kiểm tra quyền hạn, kiểm tra lịch chưa công bố, gọi `assignmentRepository.deleteAllByScheduleId(scheduleId)` và tăng `version`.
  - Frontend: Thêm `scheduleService.resetWeeklySchedule`, cập nhật `useScheduleStore` gọi endpoint mới và xóa sạch cache `localStorage`.
- Kế hoạch thực hiện gồm 3 phases đã được thiết lập tại `plans/261109-0915-fix-schedule-reset-bug/plan.md`.
