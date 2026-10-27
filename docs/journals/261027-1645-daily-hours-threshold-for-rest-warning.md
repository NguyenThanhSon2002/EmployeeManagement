# Journal: Ngưỡng Giờ Làm Hàng Ngày (>=8h) Cho Cảnh Báo Nghỉ Giữa 2 Ca

- **Thời gian:** 27/10/2026 - 16:48
- **Kế hoạch thực thi:** [`plans/261027-1645-daily-hours-threshold-for-rest-warning/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1645-daily-hours-threshold-for-rest-warning/plan.md)
- **Nhánh git:** `dev`

## 1. Mục Tiêu & Vấn Đề
- Người dùng yêu cầu tinh chỉnh quy tắc cảnh báo thời gian nghỉ ngơi tối thiểu giữa 2 ca (`BR-006` / `WARN_INSUFFICIENT_REST_TIME`):
  - **Chỉ áp dụng cảnh báo nghỉ < 12h giữa ngày N và ngày N+1 khi tổng số giờ làm việc thực tế trong ngày N đạt từ 8 giờ trở lên ($\ge 8.0\text{h}$)**.
  - Nếu trong ngày N nhân sự chỉ làm việc bán thời gian hoặc ca ngắn ($< 8.0\text{h}$): **Không áp dụng quy tắc nghỉ 12h và không hiện cảnh báo**.
  - Các ca làm việc trong cùng 1 ngày: **Không áp dụng quy tắc nghỉ 12h**.

## 2. Các Thay Đổi Đã Thực Hiện

### Backend
- [`MinRestPeriodRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/MinRestPeriodRule.java):
  - Thêm hằng số `DAILY_HOURS_THRESHOLD_FOR_REST = 8.0`.
  - Bổ sung hàm `calculateDailyNetHours(context, targetDate, includeCandidate)` tính tổng net hours thực làm trong ngày của nhân viên (sau khi trừ break minutes).
  - Chiều Ca Trước (N-1 $\rightarrow$ N): Tính tổng giờ làm việc ngày N-1; chỉ kiểm tra nghỉ $< 12.0\text{h}$ khi `prevDayTotalHours >= 8.0`.
  - Chiều Ca Sau (N $\rightarrow$ N+1): Tính tổng giờ làm việc ngày N (bao gồm ca ứng viên); chỉ kiểm tra nghỉ $< 12.0\text{h}$ khi `currDayTotalHours >= 8.0`.

### Frontend
- [`conflict-detector.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/conflict-detector.utils.ts):
  - Xuất hằng số `DAILY_HOURS_THRESHOLD_FOR_REST_RULE = 8.0`.
  - Bổ sung hàm `calculateEmployeeDailyHours(targetDate, employeeShifts, candidateShift?, candidateNetHours?)`.
  - Cập nhật `checkRestTimeBetweenShifts` và `checkRestTimeWithDailyThreshold` để kiểm tra ngưỡng $\ge 8.0\text{h}$ trước khi kích hoạt cảnh báo $< 12.0\text{h}$.
  - Cập nhật hàm `validateAllShiftConflicts` với fallback `settings?.minRestBetweenShiftsHours || 12.0`.
- [`useSettingsStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/store/useSettingsStore.ts):
  - Cập nhật mặc định `minRestBetweenShiftsHours: 12.0` (phù hợp với Điều 110 BLLĐ 2019).
- [`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx):
  - Tự động đồng bộ và hiển thị chính xác trạng thái cảnh báo theo quy tắc ngưỡng 8h mới.

## 3. Cập Nhật Bổ Sung (Follow-up Fix)
- **Vấn đề 1: Ca trong ngày N bị gán cảnh báo nghỉ ngơi hướng tới ngày mai (`direction: 'NEXT'`)**:
  - Khi một nhân viên làm ca chiều và ca tối trong ngày Thứ Bảy (tổng giờ làm >= 8h), ca tối của Thứ Bảy bị engine gán cảnh báo hướng tới ca sáng Chủ Nhật (`direction: 'NEXT'`). Người dùng nhìn vào ca tối Thứ Bảy thấy icon cảnh báo ⚠️ và thắc mắc tại sao ca trong ngày lại bị báo lỗi.
  - **Khắc phục:** Loại bỏ hoàn toàn kiểm tra chiều `NEXT` ở cả Backend ([`MinRestPeriodRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/MinRestPeriodRule.java)) và Frontend ([`conflict-detector.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/conflict-detector.utils.ts)). Ca làm việc của ngày N không bao giờ bị báo lỗi vì ngày mai; chỉ có ca của ngày N+1 (ca sáng bắt đầu sớm chưa đủ 12h nghỉ) mới hiển thị cảnh báo.
- **Vấn đề 2: Thêm nhân sự vào ca nhưng tải lại trang (F5) thì nhân sự biến mất**:
  - Tại [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java) phương thức `assignSingleShift`, khi có cảnh báo (ví dụ vượt định biên `WARN_STAFFING_CAPACITY` hoặc `WARN_INSUFFICIENT_REST_TIME`), backend đã ném `BusinessException` (HTTP 422) đòi hỏi lý do giải trình. Do đó cơ sở dữ liệu MySQL không lưu phân công này.
  - Frontend cập nhật lạc quan (optimistic UI) hiển thị tạm thời, nhưng khi tải lại trang thì backend không có dữ liệu khiến phân công biến mất.
  - **Khắc phục:** 
    - Sửa `ScheduleService.java` không ném ngoại lệ chặn lưu đối với CẢNH BÁO (`validation.getHasWarnings()`), tự động lưu kèm mã cảnh báo `overrideRule` vào cơ sở dữ liệu MySQL.
    - Cải tiến `fetchWeeklySchedule` trong [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts) để giữ lại các phân công cục bộ chưa đồng bộ khi nạp lại dữ liệu tuần.

## 4. Kết Quả Kiểm Thử
- Frontend: `npm run build` thành công 100% không có lỗi type/lint.
- Backend: `mvn test-compile` thành công (8.7s), Spring Boot tái khởi động thành công trên port 8080 (process running).
