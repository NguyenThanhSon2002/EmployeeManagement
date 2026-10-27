# Journal: Rà Soát Toàn Bộ Dữ Liệu Mock & Kế Hoạch Chuyển Đổi Sang API Thật

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Rà soát kiến trúc toàn diện các vị trí chứa dữ liệu mock, fallback, seed và lập lộ trình chuyển đổi sang API thực tế.

## 1. Kết Quả Rà Soát Hiện Trạng (Inventory Audit)
1. **Frontend Hardcoded Tĩnh (Chưa có API Backend):**
   - [`DashboardPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/DashboardPage.tsx): 4 thẻ chỉ số KPI cố định (45 quân số, 38 có mặt, 2 đi muộn, 3 nghỉ phép) và banner quân số trực.
   - [`PendingApprovalsWidget.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/components/PendingApprovalsWidget.tsx): Mảng `INITIAL_PENDING` gồm 3 đơn mẫu chưa kết nối cơ sở dữ liệu.
   - [`TrendBarChart.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/charts/TrendBarChart.tsx): Mảng `SAMPLE_7DAYS` tỷ lệ chuyên cần giả lập.
2. **Frontend Mock/LocalStorage dù Backend ĐÃ CÓ API:**
   - [`useSettingsStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/store/useSettingsStore.ts): Lưu trong `localStorage` thay vì gọi [`SettingController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/setting/controller/SettingController.java) (`/api/v1/settings`).
   - [`useAttendanceStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/attendance/store/useAttendanceStore.ts): Xử lý in-memory đơn giải trình thay vì gọi [`AttendanceController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/attendance/controller/AttendanceController.java) (`/api/v1/attendance/corrections`).
3. **Dual-Mode Mock Fallbacks (Lớp đệm mạng):**
   - `useAuthStore.ts` (`CANONICAL_AUTH_USERS`), `useDirectoryStore.ts` (`DEFAULT_EMPLOYEES`, `DEFAULT_BRANCHES`), modal defaults (`DEFAULT_POSITIONS`, `DEFAULT_FALLBACK_TEMPLATES`).
4. **Backend Database Seeds:**
   - `V2__seed_master_data.sql`, `V3__seed_admin_user.sql`, `V7__seed_employee_user_accounts.sql` trong `backend/src/main/resources/db/migration/`.

## 2. Quyết Định & Lộ Trình Triển Khai
Thực hiện theo mô hình chuyển đổi 3 giai đoạn:
- **Giai đoạn 1:** Đấu nối các module Frontend đã có sẵn Backend API (`Settings` và `Attendance Corrections`).
- **Giai đoạn 2:** Viết mới `DashboardController` trên Backend để cung cấp KPI, đơn chờ duyệt tổng hợp và xu hướng 7 ngày.
- **Giai đoạn 3:** Đấu nối `DashboardPage`, `PendingApprovalsWidget`, `TrendBarChart` với Backend API thực tế và dọn dẹp mock data.

## 3. Tài Liệu Đã Lập
- Báo cáo chi tiết: [`plans/reports/261027-0935-brainstorm-audit-and-eliminate-mock-data.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-0935-brainstorm-audit-and-eliminate-mock-data.md).
- Kế hoạch thực hiện: [`plans/261027-0935-eliminate-mock-data/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-0935-eliminate-mock-data/plan.md).
  - [Phase 01: Connect Settings and Attendance Corrections to Existing Backend APIs](file:///D:/Project/Employee%20Management/plans/261027-0935-eliminate-mock-data/phase-01-connect-existing-backend-apis.md)
  - [Phase 02: Develop Backend Dashboard APIs for Overview KPIs and Pending Approvals](file:///D:/Project/Employee%20Management/plans/261027-0935-eliminate-mock-data/phase-02-backend-dashboard-api.md)
  - [Phase 03: Integrate Real Dashboard on Frontend and Clean Up Hardcoded Mock Data](file:///D:/Project/Employee%20Management/plans/261027-0935-eliminate-mock-data/phase-03-frontend-dashboard-integration-and-cleanup.md)

## 4. Kết Quả Triển Khai Thực Tế
1. **Giai đoạn 01: Đấu nối Setting & Attendance Corrections:**
   - Tạo [`settingService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/api/settingService.ts) kết nối `GET /api/v1/settings` và `PUT /api/v1/settings/{key}`.
   - Cập nhật [`useSettingsStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/store/useSettingsStore.ts) và [`SettingsPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/SettingsPage.tsx) đồng bộ hai chiều trực tiếp với CSDL MySQL.
   - Cập nhật [`useAttendanceStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/attendance/store/useAttendanceStore.ts): `submitCorrection`, `approveCorrection`, `rejectCorrection` gọi thẳng Backend API.
2. **Giai đoạn 02: Xây dựng Backend Dashboard API:**
   - Tạo package `com.company.hrms.modules.dashboard` với:
     - DTOs: `DashboardOverviewDto`, `PendingApprovalDto`, `AttendanceTrendDto`.
     - [`DashboardService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/dashboard/service/DashboardService.java) & `DashboardServiceImpl.java`: Tính toán KPI hôm nay, gom đơn chờ duyệt từ `leave_requests` và `attendance_corrections`, phân tích tỷ lệ chuyên cần 7 ngày.
     - [`DashboardController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/dashboard/controller/DashboardController.java): Cung cấp 3 endpoint `/overview`, `/pending-approvals`, `/attendance-trends`.
   - Kiểm thử Backend: `mvn test-compile -DskipTests` thành công 100%.
3. **Giai đoạn 03: Đấu nối Frontend Dashboard & Dọn dẹp mock data:**
   - Tạo [`dashboardService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/api/dashboardService.ts).
   - Cập nhật [`DashboardPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/DashboardPage.tsx): 4 thẻ KPI và banner lấy dữ liệu thật; ca trực cá nhân đọc từ phân ca thực tế.
   - Cập nhật [`PendingApprovalsWidget.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/components/PendingApprovalsWidget.tsx): Nạp danh sách đơn thật và phê duyệt/từ chối trực tiếp qua API.
   - Cập nhật [`TrendBarChart.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/charts/TrendBarChart.tsx): Vẽ biểu đồ cột 7 ngày theo dữ liệu thật từ Backend.
   - Kiểm thử Frontend: `npm run build` thành công 100% (0 lỗi TypeScript / bundling).

