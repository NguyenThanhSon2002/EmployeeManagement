# Nhật Ký Triển Khai: Hoàn Tất Khắc Phục Lỗi Cập Nhật Chi Nhánh Mẫu Ca (Unique Constraint Soft-Delete & Store Sync)

- **Ngày:** 02/11/2026
- **Nhánh:** `dev`
- **Tác giả:** Antigravity (AI Assistant) & User
- **Trạng thái:** Hoàn tất 100%

---

## 1. Tóm Tắt Vấn Đề
- Người dùng cập nhật mẫu ca "Ca Đêm" sang Chi nhánh Đống Đa: Frontend hiển thị toast thành công nhưng thẻ ca vẫn hiển thị "Chi nhánh Cầu Giấy".
- **Nguyên nhân gốc:**
  - Bảng `work_shifts` có Unique Constraint `(shift_code, branch_id)` không xét `deleted_at`.
  - Tại Chi nhánh Đống Đa (`branch_id = 2`) có bản ghi `id = 8` mang mã `CA_DEM` bị xóa mềm từ trước.
  - Khi cập nhật ca `id = 3` sang Đống Đa, MySQL ném lỗi vi phạm Unique key (`Duplicate entry 'CA_DEM-2'`).
  - Frontend `useScheduleStore` bắt lỗi nhưng nuốt lỗi (chỉ `console.error`), đồng thời state optimistic thiếu trường `branchName`.

---

## 2. Các Thay Đổi Đã Thực Hiện

### A. Cơ Sở Dữ Liệu & Backend
1. **[`V22__fix_work_shifts_unique_soft_delete.sql`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration/V22__fix_work_shifts_unique_soft_delete.sql):**
   - Đổi mã các bản ghi xóa mềm cũ thành `${shift_code}_DEL_${id}` để giải phóng cặp `(shift_code, branch_id)`.
   - Bổ sung cột ảo `active_flag TINYINT GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) VIRTUAL`.
   - Đổi index sang: `UNIQUE KEY uq_work_shifts_code_branch_active (shift_code, branch_id, active_flag)`.
   - Áp dụng thành công vào MySQL qua Flyway (`installed_rank = 22`).
2. **[`WorkShiftService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/service/WorkShiftService.java):**
   - Trong `deleteWorkShift`: Đổi mã ca thêm hậu tố `_DEL_<id>` khi xóa mềm để đảm bảo an toàn tuyệt đối.
   - Chạy test `WorkShiftServiceTest`: 3/3 passed (BUILD SUCCESS).

### B. Frontend
1. **[`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts):**
   - Tự động lookup `branchName` từ `useDirectoryStore.branches` theo `data.branchId` để thẻ ca hiển thị ngay lập tức tên chi nhánh mới.
   - Nhận `updated` từ `workShiftService.updateWorkShift` và cập nhật chuẩn xác vào store.
   - Không nuốt lỗi ngoại lệ: Re-throw error và rollback state nếu Backend thất bại.
2. **[`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx):**
   - Bổ sung `branchName` khi gọi `onSave`.

---

## 3. Kết Quả Kiểm Tra
1. Cập nhật `work_shifts` Ca Đêm (`id = 3`) sang `branch_id = 2` (Đống Đa) thành công trực tiếp trong DB.
2. Cả 4 ca hoạt động hiện tại (Ca Sáng, Ca Chiều, Ca Tối, Ca Đêm) đều thuộc về Chi nhánh Đống Đa.
3. Docker containers `hrms-backend` và `hrms-frontend` đã được rebuild và hoạt động ổn định (Healthy).
