# Nhật Ký Kỹ Thuật: Brainstorm Chuyển Đổi 100% Dữ Liệu Thực Tế Toàn Dự Án

- **Ngày:** 02/11/2026
- **Nhánh:** `dev`
- **Tác giả:** Antigravity (AI Assistant) & User
- **Trạng thái:** Brainstorm hoàn tất, đã thống nhất Phương án 1 (Toàn diện 100%), chuẩn bị lập kế hoạch `/xd:plan`.

---

## 1. Phát Hiện Vấn Đề Gốc
- **Yêu cầu từ người dùng:** Rà soát toàn bộ dự án xem còn đoạn nào dữ liệu chưa được kết nối và lưu trữ thực tế vào cơ sở dữ liệu không, loại bỏ dữ liệu mock/in-memory.
- **Kết quả rà soát toàn diện:**
  1. **Đơn giải trình chấm công (`Attendance Corrections`):** Backend chỉ có API `POST` nộp đơn và `PUT` duyệt đơn, thiếu hoàn toàn API `GET /corrections`. `useAttendanceStore.ts` lưu `corrections: []` trên RAM, F5 là mất.
  2. **Quỹ phép năm & Hủy đơn phép (`Leaves & Balances`):** Backend có API `GET /leaves/balances` nhưng frontend chưa gọi (mặc định gán 12 ngày phép); thiếu API backend `PUT /leaves/requests/{id}/cancel` khiến đơn hủy chỉ cập nhật trên UI còn trong DB vẫn là `SUBMITTED` và số ngày bị khóa trong `pending_days`.
  3. **Báo cáo tổng hợp công tháng (`Monthly Attendance Report`):** Backend có sẵn API `GET /reports/attendance-summary` tính toán tổng hợp từ CSDL, nhưng giao diện frontend lại tự tính toán nhẩm bằng mảng RAM của 1 tuần phân ca + 1 ngày điểm danh.
  4. **Cấu hình hệ thống (`Settings Bootstrap`):** `fetchSettings()` chỉ chạy khi truy cập `/settings`, chưa được bootstrap khi mở ứng dụng tại `App.tsx`.

---

## 2. Quyết Định Kiến Trúc & Thiết Kế
- **Phương án lựa chọn:** Phương án 1 (Toàn diện 100% — Bổ sung API Backend còn thiếu & Đấu nối Quỹ phép, Giải trình công, Báo cáo tháng, Cấu hình hệ thống vào Database thực).
- **Tài liệu Brainstorm:** [docs/brainstorms/261102-1505-real-data-persistence-migration.md](file:///D:/Project/Employee%20Management/docs/brainstorms/261102-1505-real-data-persistence-migration.md).
- **Kế hoạch triển khai:** [plans/261102-1506-real-data-persistence-migration/plan.md](file:///D:/Project/Employee%20Management/plans/261102-1506-real-data-persistence-migration/plan.md).

---

## 3. Kết Quả Triển Khai Thực Tế

### Backend
1. **Attendance Corrections API:**
   - Bổ sung `createdAt` vào `AttendanceCorrectionDto` và `AttendanceService`.
   - Bổ sung `findCorrectionsWithFilter` và `findCorrectionsByEmployeeIds` trong `AttendanceCorrectionRepository`.
   - Bổ sung `GET /api/v1/attendance/corrections` trong `AttendanceController` hỗ trợ phân trang và lọc theo chi nhánh/nhân viên/trạng thái.
2. **Leave Balances & Cancellation API:**
   - Bổ sung `findLeavesWithFilter` và `findLeavesByEmployeeIds` trong `LeaveRequestRepository`.
   - Bổ sung `cancelLeaveRequest(...)` trong `LeaveService`: hoàn trả số ngày nghỉ từ `pending_days` về `remaining_days` trong bảng `leave_balances`, chuyển trạng thái đơn sang `CANCELLED`.
   - Bổ sung `PUT /api/v1/leaves/requests/{id}/cancel` trong `LeaveController`.
3. **Integration Test Fixture:**
   - Bổ sung `@BeforeEach` tự lập trong `ReportRbacTest.java` đảm bảo kiểm thử RBAC độc lập, bất biến trước các thay đổi dữ liệu động từ người dùng.
   - Toàn bộ 13/13 backend tests vượt qua 100% (`mvn test` BUILD SUCCESS).

### Frontend
1. **Attendance Corrections:**
   - Bổ sung `getCorrections(...)` trong `attendanceService.ts`.
   - Bổ sung `fetchCorrections` trong `useAttendanceStore.ts`, đồng bộ lại danh sách đơn và bản ghi điểm danh từ DB sau khi nộp/phê duyệt/từ chối.
   - Đấu nối `AttendanceCorrectionModal.tsx` và `AttendanceOverviewPage.tsx` tải dữ liệu thực từ backend.
2. **Leave Balances & Cancel:**
   - Cập nhật interface `LeaveBalance` và hàm `cancelLeaveRequest(id)` trong `leaveService.ts`.
   - Bổ sung `fetchBalances` trong `useLeaveStore.ts`, đồng bộ trạng thái quỹ phép từ CSDL và hoàn trả ngày phép khi hủy đơn.
   - Đấu nối `LeaveRequestsPage.tsx`, `LeaveRequestModal.tsx`, `LeaveApprovalModal.tsx`.
3. **Monthly Reports & System Settings:**
   - Cập nhật `MonthlyAttendanceReport.tsx`: Thay thế hoàn toàn thuật toán nhẩm RAM bằng gọi `reportService.getAttendanceSummary(effectiveBranchId, selectedYear, selectedMonth)`, bổ sung bộ chọn Tháng & Năm và truyền tham số động vào xuất Excel/CSV.
   - Cập nhật `App.tsx`: Nạp tự động cấu hình hệ thống từ DB vào `useSettingsStore` ngay khi khởi động ứng dụng.
   - Frontend build thành công sạch sẽ (`npm run build` hoàn tất 0 lỗi).

### Xác Minh E2E Thực Tế
- `docker compose up -d --build backend frontend`: Cả hai containers `hrms-backend` và `hrms-frontend` đều khởi chạy thành công và hoạt động ổn định.
- Kịch bản kiểm thử E2E tự động qua API thực tế:
  1. Đăng nhập quản trị viên & cấp phát JWT: Thành công.
  2. Nạp cấu hình hệ thống: 5 cấu hình nạp từ MySQL.
  3. Báo cáo tổng hợp chấm công tháng: 7 nhân sự tổng hợp chuẩn từ MySQL.
  4. Quỹ phép: Nạp thành công từ bảng `leave_balances`.
  5. Vòng đời đơn xin phép (Nộp đơn -> Hủy đơn): ID=6 nộp thành công, sau đó hủy đơn chuyển trạng thái `CANCELLED` và hoàn trả quỹ phép thành công.
  6. Vòng đời giải trình chấm công (Nộp đơn -> Truy vấn -> Phê duyệt): Nộp đơn id=2 thành công, truy vấn danh sách thành công, phê duyệt chuyển trạng thái `APPROVED` thành công.

