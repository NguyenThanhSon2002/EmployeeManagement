# Journal: Brainstorm Khắc Phục Lỗi Sao Chép Tuần & Lưu Trữ Dữ Liệu Phân Ca

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Khảo sát và thiết kế giải pháp cho chức năng sao chép lịch tuần (Copy Week)

## 1. Vấn Đề Ghi Nhận
- Khi người dùng ấn nút "Sao chép tuần trước", dữ liệu tuần mới không đúng với tuần trước (thiếu ca hoặc 0 ca).
- Khi người dùng tải lại trang (F5), toàn bộ dữ liệu vừa sao chép bị mất sạch.

## 2. Nguyên Nhân Kỹ Thuật
- **Thiếu dữ liệu nguồn trên Client:** Frontend `copyWeek` chỉ duyệt danh sách ca trong `state.assignments` của tuần trước. Tuy nhiên, khi người dùng đang ở tuần hiện tại, client chỉ tải dữ liệu tuần hiện tại từ backend, tuần trước chưa được nạp vào bộ nhớ -> `sourceAssignments = []`.
- **Chưa lưu vào CSDL:** `copyWeek` trước đây chỉ cập nhật `state.assignments` và lưu vào `localStorage`, không hề gửi request lưu CSDL. Khi tải lại trang, `fetchWeeklySchedule` đọc từ CSDL rỗng và ghi đè làm mất toàn bộ phân ca.

## 3. Quyết Định Thiết Kế
- Thống nhất phương án **Backend Copy API chuyên dụng (`POST /api/v1/schedules/copy-week`)**:
  - Thực hiện toàn bộ việc sao chép và chuyển đổi ngày trong một Transaction CSDL tại MySQL.
  - Đảm bảo dữ liệu được lưu vĩnh viễn, không bao giờ mất khi F5.
- Nâng cấp **`CopyWeekDialog`**:
  - Tự động nạp trước thông tin số ca tuần nguồn và tuần đích khi mở modal.
  - Cảnh báo rõ nếu tuần nguồn chưa có ca nào để tránh người dùng sao chép nhầm.

## 4. Kế Hoạch Đã Triển Khai
- Kế hoạch chi tiết: [`plans/261026-1340-fix-copy-week-persistence/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1340-fix-copy-week-persistence/plan.md).

## 5. Kết Quả Triển Khai Thực Tế
- **Backend:**
  - Tạo `CopyWeekRequest.java` và `CopyWeekResponse.java`.
  - Bổ sung method `copyScheduleWeek` trong [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java) chạy trong 1 Transaction CSDL an toàn.
  - Expose API `POST /api/v1/schedules/copy-week` trong [`ScheduleController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/controller/ScheduleController.java).
  - Biên dịch và restart backend thành công. Test API sao chép từ tuần 26/10 sang 02/11 và 09/11 đạt 100% chính xác trong CSDL.
- **Frontend:**
  - Bổ sung `copyScheduleWeek` trong [`scheduleService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/api/scheduleService.ts).
  - Nâng cấp [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts): chuyển `copyWeek` sang hàm `async`, tự động gọi API backend và re-fetch lịch tuần từ server.
  - Nâng cấp [`CopyWeekDialog.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/CopyWeekDialog.tsx): Tự động nạp trước số ca của tuần trước và tuần này, cảnh báo trực quan nếu tuần trước chưa có ca nào và vô hiệu hóa nút sao chép để tránh thao tác lỗi.
  - Cập nhật [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx) xử lý async và Toast thông báo chi tiết.
  - Frontend build thành công với 0 lỗi (`tsc -b && vite build`).

