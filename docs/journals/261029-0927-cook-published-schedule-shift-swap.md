# Ký Sự Kỹ Thuật: Hoàn Tất Triển Khai Cơ Chế Đổi / Nhường Ca Khi Lịch Đã Công Bố (PUBLISHED) & Cảnh Báo Sát Giờ

- **Thời gian:** 2026-10-29 09:27
- **Hoạt động:** Cook / Feature Implementation (`/xd:cook`)
- **Kế hoạch triển khai:** [`plans/261029-0915-published-schedule-shift-swap/plan.md`](file:///D:/Project/Employee%20Management/plans/261029-0915-published-schedule-shift-swap/plan.md)
- **Tác giả:** Antigravity AI Pair Programmer & Quản trị viên hệ thống

## 1. Kết Quả Triển Khai Chi Tiết

### 1.1 Backend
1. **[`ShiftSwapService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/swap/service/ShiftSwapService.java)**:
   - Trong `createSwapRequest`:
     - Chặn nhân viên (`ROLE_EMPLOYEE`) tạo đơn khi lịch tuần đang ở trạng thái `DRAFT` (`SCHEDULE_NOT_PUBLISHED`). Chỉ cho phép nhân viên gửi đơn khi lịch tuần đã chính thức công bố (`PUBLISHED`).
     - Chặn tạo đơn cho các ca làm việc đã bắt đầu hoặc đã qua trong quá khứ (`PAST_SHIFT_SWAP`).
   - Trong `simulateSwap`:
     - Tự động phát hiện ca làm việc diễn ra trong vòng chưa đầy 24 giờ tới (`Duration.between(now, shiftStart).toHours() < 24`) và phát sinh cảnh báo `WARN_SHORT_NOTICE_SWAP` với mức độ `WARNING` (không chặn cứng, vẫn cho phép gửi đơn để Quản lý thẩm định lý do khẩn cấp).
     - Phát sinh lỗi `PAST_SHIFT` nếu ca đã diễn ra trong quá khứ.
2. **[`ShiftSwapServiceTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/swap/ShiftSwapServiceTest.java)**:
   - Bổ sung test case `testCreateSwapRequestDraftScheduleBlockedByEmployee` xác minh từ chối tạo đơn khi lịch chưa công bố. Toàn bộ tests chạy thành công.

### 1.2 Frontend
1. **[`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts)**:
   - Mở rộng type `ConflictRuleCode` bổ sung `'WARN_SHORT_NOTICE_SWAP' | 'PAST_SHIFT'`.
2. **[`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx)**:
   - Tích hợp kiểm tra phân quyền và trạng thái lịch:
     - Với `ROLE_EMPLOYEE`: Nút đổi ca `<ArrowLeftRight />` **chỉ hiển thị** khi:
       1. Lịch tuần đã công bố (`scheduleStatus === 'PUBLISHED'`).
       2. Ca làm việc là của chính nhân viên đang đăng nhập (`isOwner`).
       3. Ca chưa qua trong quá khứ (`!isPastShift`).
     - Với Quản lý / Giám đốc: Luôn hiển thị khi ca chưa qua trong quá khứ.
3. **[`ShiftSwapModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/ShiftSwapModal.tsx)**:
   - Hiển thị khối cảnh báo màu hổ phách khi phát hiện đổi ca sát giờ (`WARN_SHORT_NOTICE_SWAP`).
   - Ràng buộc bắt buộc phải nhập lý do giải trình khi gửi đơn đổi ca sát giờ (< 24h).
4. **[`ShiftSwapManagementModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/ShiftSwapManagementModal.tsx)**:
   - Hiển thị huy hiệu `⚠️ Sát giờ (<24h)` nổi bật trên header của đơn để Quản lý dễ dàng nhận diện và thẩm định khi phê duyệt.

## 2. Kiểm Thử & Nghiệm Thu
- **Frontend**: `npm run build` thành công 100%, không phát sinh bất kỳ lỗi TypeScript hay Vite bundle nào.
- **Backend**: `mvn test "-Dtest=ShiftSwapServiceTest,WorkShiftServiceTest"` chạy thành công 5/5 tests.
