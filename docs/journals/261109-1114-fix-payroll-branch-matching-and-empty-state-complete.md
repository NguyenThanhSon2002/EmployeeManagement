# Nhật ký hoàn thành: Khắc phục lỗi nạp chi nhánh bảng lương & Tối ưu hiển thị Empty State

**Thời gian:** 09/11/2026 - 11:15 (GMT+7)  
**Tác vụ:** Hoàn thành thực thi toàn bộ kế hoạch `plans/261109-1108-fix-payroll-branch-matching-and-empty-state`  
**Nhánh Git:** `dev`  

---

## 1. Tóm tắt kết quả đạt được

Đã khắc phục triệt để vấn đề người dùng vào trang Quản lý bảng lương (`/payroll`) nhưng không thấy nhân sự nào để chỉnh sửa:

1. **Khắc phục lỗi logic tìm kiếm bảng lương trong `usePayrollStore.ts`:**
   - Trước đây hàm `fetchPayrolls` sử dụng `list.find((p) => p.period_month === currentMonth && p.period_year === currentYear)` bỏ qua `branch_id`, dẫn đến việc luôn nạp bảng lương đầu tiên của chi nhánh Cầu Giấy (`branch_id = 1`) có 0 nhân sự.
   - Nâng cấp thuật toán so khớp ưu tiên 3 cấp:
     - So khớp chính xác: `period_month`, `period_year` và `branch_id` (`p.branch_id === currentBranchId` hoặc `null` khi chọn "Toàn hệ thống").
     - Fallback thông minh: khi chọn "Toàn hệ thống" mà bảng hệ thống chưa có, tự động nạp bảng lương có `total_employees > 0` trong kỳ để người dùng thấy ngay dữ liệu.
   - Khi chọn đổi chi nhánh qua `setFilter`, store lập tức gọi `fetchPayrolls(year, branchId)` để nạp đúng bảng lương tương ứng.

2. **Nâng cấp Empty State và điều hướng nhanh (`PayrollManagementPage.tsx`):**
   - Thay thế câu thông báo gây nhầm lẫn *"Không tìm thấy nhân viên nào phù hợp với bộ lọc tìm kiếm"* bằng thông báo trực quan:
     - Tiêu đề: *"Chi nhánh [Tên chi nhánh] chưa có dữ liệu chấm công cho kỳ Tháng MM/YYYY."*
     - Hướng dẫn rõ ràng lý do: *"Chưa có ca làm việc nào được ghi nhận chấm công tại chi nhánh này trong tháng."*
     - Hai nút chuyển nhanh 1-click:
       - **"Xem Chi nhánh Đống Đa (7 nhân viên)"**
       - **"Xem Toàn hệ thống"**

3. **Bổ sung Badge trạng thái bảng lương:**
   - `[ĐÃ DUYỆT CHỐT]` (Xanh lá, có icon khóa): Bảng lương đã chốt, hiển thị tooltip hướng dẫn chuyển sang bảng lương chi nhánh (Bản nháp) để chỉnh sửa.
   - `[BẢN NHÁP]` (Cam, có icon bút chì): Bảng nháp đang mở, Giám đốc/Admin có quyền chỉnh sửa số liệu từng nhân viên.

4. **Phân quyền chỉnh sửa chặt chẽ theo yêu cầu:**
   - Chỉ duy nhất Giám đốc (`ROLE_DIRECTOR`) và Quản trị viên (`ROLE_ADMIN`) có quyền chỉnh sửa phiếu lương (`updatePayrollItem`) và duyệt chốt (`approvePayroll`).
   - Cột "Thao tác" và nút "Sửa" trên giao diện chỉ hiển thị với Giám đốc và Admin.
   - Quản lý cơ sở (`ROLE_MANAGER`) chỉ được xem, nếu cố tình gọi API chỉnh sửa sẽ nhận HTTP 403 Forbidden.

5. **Loại bỏ triệt để hiện tượng trình duyệt cache phiên bản frontend cũ:**
   - Cấu hình Nginx `add_header Cache-Control "no-store, no-cache, must-revalidate";` cho `location /`.
   - Rebuild Docker frontend với `--no-cache` và khởi động lại container `hrms-frontend`.

---

## 2. Danh sách tệp đã chỉnh sửa

### Frontend
- [`frontend/src/features/payroll/store/usePayrollStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/store/usePayrollStore.ts): So khớp chính xác chi nhánh & tự động tải dữ liệu khi đổi bộ lọc.
- [`frontend/src/features/payroll/PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx): Nâng cấp Empty State, Badge trạng thái `DRAFT`/`APPROVED`, ẩn nút sửa với Manager.
- [`frontend/src/types/domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts): Bổ sung `ROLE_ADMIN` vào union `RoleType`.
- [`frontend/src/routes/AppRoutes.tsx`](file:///D:/Project/Employee%20Management/frontend/src/routes/AppRoutes.tsx) & [`frontend/src/components/layout/Sidebar.tsx`](file:///D:/Project/Employee%20Management/frontend/src/components/layout/Sidebar.tsx): Cấp quyền truy cập `/payroll` cho `ROLE_ADMIN`.
- [`frontend/nginx.conf`](file:///D:/Project/Employee%20Management/frontend/nginx.conf): Tắt cache `index.html`.

### Backend
- [`backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/controller/PayrollController.java): Giới hạn `@PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")` cho chỉnh sửa và duyệt bảng lương.
- [`backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/payroll/service/PayrollService.java): Chặn cập nhật phiếu lương nếu actor không phải Giám đốc hoặc Admin.

---

## 3. Kết quả xác thực & kiểm thử

1. **Frontend Build:** `npm run build` thành công, 0 lỗi TypeScript, tạo bundle `index-DXjnW7To.js`.
2. **Docker Rebuild:** `docker compose build --no-cache frontend` thành công, container `hrms-frontend` đã tái tạo và khởi chạy.
3. **HTTP Header & Assets:** Endpoint `http://localhost:8082` phản hồi HTTP 200 kèm `Cache-Control: no-store, no-cache, must-revalidate`. Bundle JS `index-DXjnW7To.js` phản hồi HTTP 200.
4. **RBAC API Test:** 
   - Quản lý `EMP-004` gửi PUT cập nhật phiếu lương $\rightarrow$ HTTP 403 Forbidden.
   - Admin `admin` gửi PUT cập nhật phiếu lương $\rightarrow$ HTTP 200 OK.
5. **Tính năng Mở Lại Bảng Lương (Reopen / Hủy Chốt):**
   - Bổ sung API `POST /api/v1/payrolls/{id}/reopen` cho phép Giám đốc / Admin mở lại bảng lương từ `APPROVED` về `DRAFT`.
   - Bổ sung nút **"Mở Lại Bảng Lương (Chỉnh Sửa)"** trên giao diện khi bảng lương đang ở trạng thái `APPROVED`.
   - Khi bảng lương ở trạng thái `DRAFT`, hiển thị rõ ràng nút xanh lá **"Duyệt Chốt Bảng Lương"** và kích hoạt toàn bộ nút **"Sửa"** trên bảng.
   - Đã reset bảng lương Toàn hệ thống về `DRAFT` để người dùng trải nghiệm ngay lập tức.
