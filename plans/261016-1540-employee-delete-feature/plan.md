---
title: "Kế Hoạch Triển Khai Tính Năng Xóa Nhân Viên & Đồng Bộ CSDL MySQL"
description: "Kế hoạch chi tiết bổ sung tính năng xóa mềm hồ sơ nhân viên tuân thủ Luật Lao Động 2019: Mở rộng phân quyền backend (ADMIN/HR_MANAGER), kiểm tra ràng buộc Trưởng phòng, tích hợp hộp thoại DeleteConfirmModal và nút Xóa trên EmployeeListPage & EmployeeDetailPage, đồng bộ tức thì với useDirectoryStore."
status: completed
priority: P1
effort: 4h
branch: main
tags: [feature, employee, soft-delete, rbac, confirmation-modal, mysql, directory-store]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Triển Khai Tính Năng Xóa Nhân Viên & Đồng Bộ CSDL MySQL

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Người dùng yêu cầu: *"hiện tại trang nhân sự vẫn chưa có nút xóa nhân viên, hãy thêm cho tôi một nút xóa nhân viên đi và nhớ liên kết dữ liệu để nó lưu cả xuống database nữa"*.

### Thực trạng hệ thống:
1. **Backend:**
   - Đã có sẵn endpoint `DELETE /api/v1/employees/{id}` trong `EmployeeController.java` và phương thức `softDelete()` trong `EmployeeService.java`.
   - Tuy nhiên, quyền hạn hiện tại đang giới hạn cứng `@PreAuthorize("hasRole('ADMIN')")`, chưa cho phép `ROLE_HR_MANAGER`.
   - Chưa có kiểm tra an toàn nếu nhân viên đang là **Trưởng phòng** (`manager_id` trong bảng `departments`), dễ dẫn tới tình trạng phòng ban bị mất thông tin quản lý mà không có cảnh báo.
2. **Frontend:**
   - Service `employeeService.deleteEmployee(id)` đã được viết sẵn trong `frontend/src/features/employees/api/employeeService.ts`.
   - Giao diện [`EmployeeListPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeListPage.tsx) chỉ có nút Xem (`Eye`) và Sửa (`Edit2`), thiếu nút Xóa (`Trash2`).
   - Giao diện [`EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx) thiếu nút Xóa trên thanh tiêu đề hồ sơ.
   - Chưa có **Hộp thoại xác nhận xóa (DeleteConfirmModal)** cảnh báo hành động nguy hiểm (destructive action) để chống thao tác bấm nhầm.
   - Chưa liên kết đồng bộ xóa với `useDirectoryStore` khiến các màn hình Xếp ca và Chấm công có thể vẫn giữ thông tin nhân viên cũ trước khi tải lại trang.

---

## 2. Mục Tiêu Kế Hoạch

- **Tuân thủ Chuẩn Xóa mềm (Soft Delete) & Luật Lao Động 2019:** Đánh dấu `deleted_at = NOW()`, `is_active = false` trong MySQL, không xóa cứng làm mất vết lịch sử phân ca và chấm công.
- **Ràng buộc nghiệp vụ an toàn:** Chặn xóa và cảnh báo rõ ràng nếu nhân viên đang giữ vị trí Trưởng phòng của một phòng ban còn hoạt động.
- **Phân quyền RBAC:** Cho phép cả `ROLE_ADMIN` và `ROLE_HR_MANAGER` được phép thực hiện thao tác xóa; ẩn nút xóa khi đang ở vai trò `ROLE_EMPLOYEE`.
- **Trải nghiệm UI/UX chuẩn mực:** Nút Xóa màu đỏ (`Trash2`), Modal xác nhận trực quan, hiển thị tên và mã nhân viên cần xóa, có spinner loading và Toast thông báo kết quả.
- **Đồng bộ dữ liệu tức thì (Reactive Directory Sync):** Tự động cập nhật `useDirectoryStore` và bảng danh sách ngay khi xóa thành công mà không cần F5 trình duyệt.
- **Zero Regression:** Đảm bảo `npm run build` 0 lỗi TypeScript, 35/35 bài kiểm thử Vitest và toàn bộ JUnit tests backend đều Pass 100%.

---

## 3. Lộ Trình Triển Khai (3 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Mở Rộng Phân Quyền Backend & Kiểm Tra Ràng Buộc Trưởng Phòng](./phase-01-backend-permission-and-safety-validation.md) | Completed ✅ | 1.0h | Cập nhật `@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")`, chặn xóa Trưởng phòng trong `EmployeeService`, bổ sung JUnit test. |
| **Phase 2** | [Xây Dựng DeleteConfirmModal & Tích Hợp Nút Xóa Trên Frontend](./phase-02-frontend-delete-modal-and-button-integration.md) | Completed ✅ | 1.5h | Tạo `DeleteConfirmModal.tsx`, thêm nút icon `Trash2` tại `EmployeeListPage` và nút Xóa tại `EmployeeDetailPage`. |
| **Phase 3** | [Đồng Bộ Toàn Cục useDirectoryStore & Kiểm Thử Toàn Diện](./phase-03-directory-sync-and-testing.md) | Completed ✅ | 1.5h | Đồng bộ state Directory, kiểm tra phản ứng trên Xếp ca / Chấm công, chạy kiểm thử Vitest & JUnit 100% Pass. |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Soft Delete Preservation:** Giữ nguyên toàn bộ bản ghi `shift_assignments`, `attendance_records`, `leave_requests` liên quan đến nhân viên đã xóa để phục vụ báo cáo và kiểm toán.
2. **Double Confirmation:** Bắt buộc người dùng xác nhận qua Modal trước khi kích hoạt gọi API `DELETE`.
3. **Role-Aware UI:** Nút Xóa chỉ hiển thị đối với tài khoản có quyền quản trị/nhân sự (`ADMIN` hoặc `HR_MANAGER`).
4. **Optimistic & Synchronized UI:** Cập nhật ngay lập tức `employeesList` của trang và `useDirectoryStore.employees` toàn cục để mọi tab khác nhận diện được thay đổi.
