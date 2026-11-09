# Nhật ký Lập Kế Hoạch: Khắc phục lỗi khớp chi nhánh bảng lương & Tối ưu giao diện rỗng

**Thời gian:** 09/11/2026 - 11:08 (GMT+7)  
**Tác vụ:** Lập kế hoạch `plans/261109-1108-fix-payroll-branch-matching-and-empty-state`  
**Nhánh Git:** `dev`  

---

## 1. Tóm tắt kế hoạch
Kế hoạch gồm 3 giai đoạn:
1. **Phase 1:** Sửa logic tìm kiếm `activePayroll` trong `usePayrollStore.ts` để so khớp chính xác `period_month`, `period_year` và `branch_id`, có cơ chế fallback thông minh khi chọn Toàn hệ thống.
2. **Phase 2:** Cải tiến giao diện Empty State trong `PayrollManagementPage.tsx`: hiển thị rõ ràng lý do chi nhánh chưa có dữ liệu, bổ sung nút chuyển nhanh sang chi nhánh có 7 nhân viên (Đống Đa) và badge trạng thái bảng lương (`BẢN NHÁP` vs `ĐÃ DUYỆT CHỐT`).
3. **Phase 3:** Build frontend, rebuild Docker frontend `--no-cache`, kiểm thử thực tế cả 3 chi nhánh trên trình duyệt `http://localhost:8082/payroll`.

---

## 2. Đường dẫn kế hoạch
- Master Plan: [`plans/261109-1108-fix-payroll-branch-matching-and-empty-state/plan.md`](file:///D:/Project/Employee%20Management/plans/261109-1108-fix-payroll-branch-matching-and-empty-state/plan.md)
