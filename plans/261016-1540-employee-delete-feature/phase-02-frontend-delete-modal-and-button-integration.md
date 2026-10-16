# Phase 2: Xây Dựng DeleteConfirmModal & Tích Hợp Nút Xóa Trên Frontend

**Mã giai đoạn:** `PHASE-02`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.5 giờ  
**Mục tiêu chính:** Xây dựng modal xác nhận xóa an toàn theo Design System, tích hợp nút icon Xóa trên bảng danh sách nhân viên và trang chi tiết hồ sơ nhân sự, kèm kiểm soát phân quyền hiển thị.

---

## 1. Các File Cần Tạo Mới & Chỉnh Sửa

1. **Tạo mới:** [`frontend/src/features/employees/components/DeleteConfirmModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/DeleteConfirmModal.tsx)
2. **Chỉnh sửa:** [`frontend/src/features/employees/EmployeeListPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeListPage.tsx)
3. **Chỉnh sửa:** [`frontend/src/features/employees/EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Xây dựng Component `DeleteConfirmModal.tsx`
- **Props:**
  - `isOpen: boolean`
  - `employee: Employee | null`
  - `departmentName?: string`
  - `isDeleting: boolean`
  - `onClose: () => void`
  - `onConfirm: () => Promise<void>`
- **Giao diện & Trải nghiệm:**
  - Sử dụng modal backdrop chuẩn CSS variables (`var(--color-bg-surface)`).
  - Header có icon cảnh báo nguy hiểm màu đỏ: `AlertTriangle` hoặc `Trash2` trong vòng tròn đỏ nhạt.
  - Tiêu đề: **Xác nhận xóa hồ sơ nhân viên**.
  - Nội dung:
    - *"Bạn có chắc chắn muốn xóa nhân viên **[Tên]** (Mã NV: **[Mã]**) thuộc phòng ban **[Phòng ban]**?"*
    - Hộp thông báo màu cam nhạt: *"Lưu ý: Thao tác này sẽ ngừng hoạt động của nhân viên và gỡ khỏi danh sách điều phối ca. Lịch sử chấm công và phân ca trước đây vẫn được lưu trữ theo quy định."*
  - Footer: Nút **Hủy bỏ** (`btn btn-default`) và nút **Xác nhận xóa** (`btn btn-error` màu đỏ `#EF4444`, hỗ trợ trạng thái `disabled` và icon xoay khi đang xử lý).

### Bước 2: Tích hợp nút Xóa tại `EmployeeListPage.tsx`
- Nhận diện quyền xóa của tài khoản đăng nhập qua `useAuthStore`:
  ```typescript
  const { user } = useAuthStore();
  const canDelete = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_HR_MANAGER'].includes(r));
  ```
- Tại cột Thao tác của mỗi dòng nhân viên:
  - Nếu `canDelete === true`, render thêm nút icon `Trash2`:
    ```tsx
    <button
      type="button"
      className="btn btn-default btn-danger-hover"
      onClick={() => handleOpenDelete(emp)}
      style={{ padding: '0 8px', height: 32, color: 'var(--color-error)' }}
      title="Xóa hồ sơ nhân viên"
      aria-label={`Xóa nhân viên ${emp.fullName}`}
    >
      <Trash2 size={15} />
    </button>
    ```
- Xử lý xác nhận xóa:
  - Gọi `await employeeService.deleteEmployee(targetEmp.id)`.
  - Cập nhật state cục bộ: `setEmployeesList(prev => prev.filter(e => e.id !== targetEmp.id))`.
  - Hiển thị Toast thông báo thành công / Toast lỗi nếu gặp lỗi 409 (Trưởng phòng) hoặc lỗi mạng.

### Bước 3: Tích hợp nút Xóa tại `EmployeeDetailPage.tsx`
- Trên thanh tiêu đề `Profile Header Banner`, cạnh trạng thái nhân viên:
  - Nếu `canDelete === true`, render nút **Xóa hồ sơ** (icon `Trash2` + chữ).
  - Khi xác nhận xóa thành công: Hiển thị Toast thành công và tự động `navigate('/employees')`.

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Modal xác nhận xóa hiển thị rõ nét thông tin nhân viên cần xóa.
- [ ] Nút Xóa xuất hiện ở cả bảng danh sách và trang chi tiết khi đăng nhập quyền Quản trị/HR.
- [ ] Chuyển vai trò sang `ROLE_EMPLOYEE` thì nút Xóa tự động ẩn.
- [ ] Xóa trên trang chi tiết tự động chuyển hướng về danh sách nhân viên an toàn.
