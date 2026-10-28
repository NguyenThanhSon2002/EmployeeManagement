# Nhật Ký Kỹ Thuật: Hoàn Thành Kế Hoạch Sửa Lỗi Ca Phân Bổ Không Hiển Thị Trên Bảng Tuần

**Thời gian:** 2026-10-28 15:20  
**Kế hoạch:** `plans/261028-1520-fix-orphan-shift-assignments-display/plan.md`  
**Trạng thái:** Pending (Sẵn sàng thực thi)  

### 1. Tóm Tắt Kế Hoạch
- **Vấn đề phân tích:** Các phân ca cũ của Chi nhánh Đống Đa (`branch_id = 2`) đang trỏ nhầm `work_shift_id` sang ca của Chi nhánh Cầu Giấy (1) do kết quả chuyển đổi dữ liệu toàn chuỗi trước đó. Ma trận `WeeklyGrid` chỉ render các ca thuộc Đống Đa nên các phân ca này bị mất hàng hiển thị.
- **Phân rã 3 Phases:**
  - **Phase 01:** Migration V16 remap dữ liệu các phân ca lệch chi nhánh về đúng ca Đống Đa.
  - **Phase 02:** Backend `ScheduleService` bổ sung validation ngăn ngừa gán sai chi nhánh.
  - **Phase 03:** Frontend `WeeklyGrid` bổ sung hàng ca phòng ngự (Defensive fallback rows) và kiểm thử thực tế.

### 2. Hành Động Tiếp Theo
- Người dùng có thể tiến hành thực thi kế hoạch bằng lệnh:
  `/aikit-core:xd:cook plans/261028-1520-fix-orphan-shift-assignments-display`
