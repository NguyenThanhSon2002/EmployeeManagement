# Technical Journal: Hiển Thị Giờ Công & Lương Theo Hình Thức Làm Việc

- **Thời gian:** 10/11/2026 - 17:02
- **Tác giả:** Antigravity AI
- **Phạm vi thay đổi:**
  - [`frontend/src/features/payroll/PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx)
  - [`frontend/src/features/payroll/MyPayslipPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/MyPayslipPage.tsx)
- **Kế hoạch liên quan:** [`plans/261110-1657-display-hours-by-employment-type/plan.md`](file:///D:/Project/Employee%20Management/plans/261110-1657-display-hours-by-employment-type/plan.md)

---

## 1. Vấn Đề Giải Quyết
Trước đây:
- Bảng lương quản trị gom chung giờ công thành `((item.actual_hours || 0) + (item.part_time_hours || 0))h`, làm cho nhân viên Part-time (31h) không phân biệt được với nhân viên Full-time (208h).
- Phiếu lương cá nhân in cứng `Giờ công Full-time: 0h` và `Lương công Full-time: 0 ₫` đối với nhân sự Part-time.

---

## 2. Giải Pháp Triển Khai
1. **Tại Bảng lương quản trị ([`PayrollManagementPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/PayrollManagementPage.tsx)):**
   - **Full-time:** Cột Giờ Công hiển thị `{actual_hours}h` kèm badge xanh `FT`. Cột Lương hiển thị `{base_pay}` (Lương hợp đồng). Nếu có ca Part-time làm thêm, hiển thị thêm dòng phụ `+{part_time_hours}h PT`.
   - **Part-time:** Cột Giờ Công hiển thị `{part_time_hours}h` kèm badge cam `PT`. Cột Lương hiển thị `{part_time_pay}` kèm chi tiết `({part_time_hours}h × {đơn giá}/h)`.
2. **Tại Phiếu lương cá nhân ([`MyPayslipPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/payroll/MyPayslipPage.tsx)):**
   - **Thanh tổng hợp công:** Nhân sự Part-time chỉ hiển thị `Giờ công Part-time: {part_time_hours}h` (ẩn hẳn dòng `Full-time: 0h`).
   - **Cột Thu nhập (Earnings):** Nhân sự Part-time chỉ hiển thị dòng `Lương Part-time theo giờ: {part_time_pay}` (ẩn hẳn dòng `Lương công Full-time: 0 ₫`).

---

## 3. Kiểm Thử & Triển Khai
- `npm run build`: Hoàn thành với 0 lỗi TypeScript.
- Docker: Rebuild image và recreate container `hrms-frontend` thành công, phục vụ tại `http://localhost:8082`.
