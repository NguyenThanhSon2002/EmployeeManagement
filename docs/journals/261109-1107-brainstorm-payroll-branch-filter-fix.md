# Nhật ký Brainstorm: Khắc phục lỗi lọc chi nhánh và hiển thị bảng lương

**Thời gian:** 09/11/2026 - 11:07 (GMT+7)  
**Tác giả:** Solution Brainstormer (Antigravity)  
**Ngữ cảnh:** Người dùng phản ánh mở trang Quản lý bảng lương `/payroll` nhưng không thấy nhân viên nào, bảng trống (0 nhân viên).  

---

## 1. Phát hiện nguyên nhân gốc rễ
1. Người dùng đang ở màn hình `/payroll` chọn `"Toàn hệ thống (Tất cả chi nhánh)"` Tháng 11/2026.
2. Trong CSDL có 3 bảng lương kỳ Tháng 11/2026:
   - `Payroll 1`: Chi nhánh Cầu Giấy (`branch_id = 1`) -> `total_employees = 0`.
   - `Payroll 2`: Chi nhánh Đống Đa (`branch_id = 2`) -> `total_employees = 7` (trạng thái DRAFT).
   - `Payroll 3`: Toàn hệ thống (`branch_id = null`) -> `total_employees = 7` (trạng thái APPROVED).
3. Trong [`usePayrollStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/store/usePayrollStore.ts), hàm tự động nạp bảng lương `list.find(...)` chỉ so khớp tháng/năm mà không so khớp `branch_id`. Nó luôn lấy bảng lương đầu tiên trong mảng là `Payroll 1` (Cầu Giấy, 0 nhân viên), khiến bảng đối soát bị rỗng hoàn toàn.

---

## 2. Giải pháp thống nhất
- Khớp chính xác cả `period_month`, `period_year` và `branch_id`.
- Khi chọn "Toàn hệ thống", ưu tiên nạp bảng lương toàn hệ thống (`branch_id = null`) hoặc bảng lương có nhân viên lớn hơn 0 để người dùng luôn thấy ngay dữ liệu đối soát.
- Cải thiện UX thông báo khi một chi nhánh chưa có nhân sự có dữ liệu chấm công.
- Tiếp tục chuyển sang bước lập kế hoạch `/xd:plan`.
