# Nhật Ký Phát Triển: Hoàn Tất Hợp Nhất Ca Gối Đầu & Khử Trùng Lặp Giờ Công (Smart Shift Handover Merge)

- **Ngày:** 02/11/2026
- **Nhánh:** `dev`
- **Tác giả:** Antigravity (AI Assistant) & User
- **Trạng thái:** Hoàn thành (100%)

---

## 1. Mục Tiêu & Yêu Cầu Người Dùng
- **Bối cảnh:** Khi nhân viên làm ca tối (18:00 - 23:00) và ca đêm (22:00 - 02:00 hôm sau), hai ca có khoảng thời gian gối đầu bàn giao ca 60 phút (22:00 - 23:00).
- **Vấn đề trước đây:**
  1. Quy tắc `BR-001` (`ERR_SHIFT_OVERLAP`) ở mức `MANDATORY` chặn phân ca do nhận diện là xung đột trùng ca.
  2. Thời gian làm việc bị tính cơ học $5.0\text{h} + 4.0\text{h} = 9.0\text{h}$, làm thừa 1 giờ công thực tế ($18:00 \to 02:00 = 8.0\text{h}$).
- **Giải pháp triển khai:**
  - Nhận diện thông minh cặp ca nối tiếp gối đầu: Cùng chi nhánh, thứ tự nối tiếp ($S_1 < S_2 < E_1 < E_2$) và độ trùng $\le 60$ phút.
  - Áp dụng thuật toán Merge Intervals để tự động gộp khoảng thời gian và khử trùng lặp giờ công.
  - Hiển thị huy hiệu `🔗 {overlap}p` trên chip ca, tooltip hướng dẫn minh bạch, và hỗ trợ Drawer chọn mượt mà.

---

## 2. Các Thay Đổi Cụ Thể

### A. Backend (Spring Boot 3 / Java 21)
1. **[`IntervalMergeUtils.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/IntervalMergeUtils.java):**
   - Thuật toán gộp các khoảng thời gian làm việc trong ngày (Merge Intervals).
   - Hàm `calculateDeduplicatedMinutes(List<ShiftTimeRange>)` sắp xếp theo thời gian bắt đầu và khử trùng lặp khoảng gối đầu.
2. **[`ShiftOverlapRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/ShiftOverlapRule.java):**
   - Bỏ chặn `ERR_SHIFT_OVERLAP` mức `MANDATORY` khi phát hiện cặp ca gối đầu bàn giao hợp lệ ($\le 60$ phút, cùng chi nhánh).
   - Các ca trùng lặp hoàn toàn hoặc chồng lấn $> 60$ phút vẫn bị chặn nghiêm ngặt.
3. **[`DailyMaxHoursRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/DailyMaxHoursRule.java) & [`WeeklyMaxHoursRule.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/engine/rule/WeeklyMaxHoursRule.java):**
   - Áp dụng `IntervalMergeUtils` để tính toán chính xác số giờ làm việc thực tế, không bị phạt oan giờ làm vượt trần.
4. **[`ShiftHandoverRuleTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/schedule/engine/rule/ShiftHandoverRuleTest.java):**
   - Unit test kiểm thử 3 kịch bản: Gối đầu hợp lệ $\le 60$p, chồng lấn quá mức $> 60$p, và trùng ca hoàn toàn. Đạt 100% pass (3/3).

### B. Frontend (React 19 / TypeScript / Vite)
1. **[`conflict-detector.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/conflict-detector.utils.ts):**
   - Hàm `checkShiftOverlap` trả về `isHandover`, `handoverShift`, `overlapMinutes`.
   - Bỏ cờ `hasOverlap = true` khi là ca gối đầu hợp lệ.
   - Hàm `calculateEmployeeDailyHours` sử dụng interval merge để tính đúng giờ làm trong ngày.
2. **[`schedule-calc.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/schedule-calc.utils.ts):**
   - Bổ sung `calculateDeduplicatedNetHours(assignments)` và cập nhật `sumWeeklyScheduledHours(assignments)`.
3. **[`AssignStaffDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignStaffDrawer.tsx):**
   - Cho phép chọn nhân viên vào ca đêm dù đã làm ca tối cùng ngày.
   - Hiển thị nhãn `🔗 Ca nối tiếp ({handoverMinutes}p)` nổi bật.
4. **[`ShiftRow.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftRow.tsx) & [`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx):**
   - Truyền `allAssignments` vào `ShiftGridCell`.
   - Hiển thị huy hiệu `🔗 60p` màu teal trên chip ca làm việc.
   - Viền chip chuyển màu xanh ngọc `#5EEAD4` nhẹ nhàng, tinh tế.
   - Tooltip giải thích: *"Ca nối tiếp gối đầu (60p bàn giao) với Ca Tối - Đã tự động khử trùng lặp giờ"*.
5. **[`EmployeeWeeklyHoursTable.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/EmployeeWeeklyHoursTable.tsx) & [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx):**
   - Bảng tổng kết giờ tuần và thẻ số liệu tổng quan `totalHours` hiển thị chính xác giờ sau khi khử trùng (8.0h).

---

## 3. Kết Quả Kiểm Thử & Triển Khai
- **Backend Test:** `mvn test -Dtest=ShiftHandoverRuleTest` $\to$ `BUILD SUCCESS` (0 failures).
- **Frontend Build:** `npm run build` $\to$ `built in 483ms`, 0 TypeScript errors.
- **Docker Rebuild:** Đã build và cập nhật lại cả hai container `hrms-backend` và `hrms-frontend` trên Docker.
