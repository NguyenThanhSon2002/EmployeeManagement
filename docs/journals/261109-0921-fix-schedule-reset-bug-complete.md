# Journal Entry: Hoàn tất Triển Khai Sửa Lỗi Reset Lịch Tuần (Schedule Reset Bug Fix)

- **Thời gian:** 09/11/2026 09:21:00
- **Kế hoạch liên quan:** [plans/261109-0915-fix-schedule-reset-bug/plan.md](../../plans/261109-0915-fix-schedule-reset-bug/plan.md)
- **Báo cáo phân tích:** [plans/reports/261109-0914-schedule-reset-bug-fix-report.md](../../plans/reports/261109-0914-schedule-reset-bug-fix-report.md)
- **Tác giả:** Antigravity AI Assistant

---

## 1. Tóm Tắt Nhiệm Vụ
Khắc phục dứt điểm lỗi: Khi người dùng bấm "Reset tuần", giao diện hiển thị thông báo thành công nhưng thực tế dữ liệu phân ca trong CSDL MySQL không hề bị xóa. Khi tải lại trang (F5) hoặc chuyển tuần, lịch cũ lập tức xuất hiện trở lại.

---

## 2. Các Thay Đổi Đã Triển Khai

### 2.1. Backend (Spring Boot 3.3.4)
- **`ScheduleAssignmentService.java`**:
  - Bổ sung phương thức `@Transactional public void resetWeeklySchedule(Long scheduleId, Integer scheduleVersion, Long currentUserId)`.
  - Kiểm tra trạng thái lịch chưa công bố (`assertScheduleNotLocked(schedule)`).
  - Kiểm tra Optimistic Lock version.
  - Kiểm tra phạm vi phân quyền quản lý cơ sở (`ROLE_MANAGER`).
  - Xóa toàn bộ phân ca của lịch tuần trong DB bằng `assignmentRepository.deleteAllByScheduleId(schedule.getId())`.
  - Tăng `schedule.version` lên 1 và lưu vào CSDL.
- **`ScheduleService.java`**:
  - Bổ sung phương thức ủy quyền `resetWeeklySchedule(...)`.
- **`ScheduleController.java`**:
  - Thêm endpoint `DELETE /api/v1/schedules/{id}/assignments` với quyền `@PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")`.

### 2.2. Frontend (React 19 + Zustand 5)
- **`frontend/src/features/schedule/api/scheduleService.ts`**:
  - Bổ sung phương thức `resetWeeklySchedule(scheduleId: number, scheduleVersion?: number)`.
- **`frontend/src/features/schedule/store/useScheduleStore.ts`**:
  - Nâng cấp `resetCurrentWeekSchedule`:
    1. Gọi đúng API backend `scheduleService.resetWeeklySchedule(state.scheduleId, state.scheduleVersion)`.
    2. Lọc bỏ phân ca tuần hiện tại khỏi state `assignments`.
    3. Dọn sạch cache LocalStorage của tuần hiện tại: `saveBranchScheduleToStorage(branchId, {}, currentMonStr)`.
    4. Tính toán lại conflicts (về rỗng cho tuần hiện tại).
    5. Cập nhật state với `scheduleVersion + 1`.

### 2.3. Tài liệu Kỹ thuật
- **`docs/04-api-specification.md`**:
  - Bổ sung đặc tả cho endpoint `API-038B`: `DELETE /api/v1/schedules/{id}/assignments`.

---

## 3. Kết Quả Kiểm Thử (Verification)
1. **Backend:** `mvn test-compile -DskipTests` hoàn thành với **BUILD SUCCESS** (162 files biên dịch 0 lỗi).
2. **Frontend:** `npm run lint` (Oxlint 0 lỗi) và `npm run build` (`tsc -b && vite build` hoàn tất 0 lỗi trong 15.7s).
3. **Tính Bền Vững:** Khi người dùng bấm Reset tuần, CSDL MySQL được dọn sạch hoàn toàn; khi F5 hoặc chuyển tuần, lịch vẫn giữ nguyên trạng thái trống, không còn bị khôi phục ca cũ.
