# Báo Cáo Brainstorm: Lưu Trữ Dữ Liệu Mẫu Ca Làm Việc Vào Cơ Sở Dữ Liệu MySQL

**Ngày tạo:** 2026-10-16  
**Chủ đề:** Tích hợp API Backend `/api/v1/work-shifts` để lưu trữ bền vững (Persistence) danh mục mẫu ca vào cơ sở dữ liệu MySQL  
**Trạng thái:** Đã thống nhất với người dùng (Phương án 1)

---

## 1. Trả Lời Câu Hỏi Của Người Dùng & Phân Tích Thực Trạng

### Câu hỏi: *"dữ liệu này có lưu trong database không, nếu chưa thì hãy giúp tôi lưu những thay đổi đó"*

### Câu trả lời: **Hiện tại CHƯA lưu vào Database!**
1. **Thực trạng Frontend:**
   - Trên trang [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx), các thao tác Thêm mới (`addShiftTemplate`), Sửa (`updateShiftTemplate`) và Xóa (`deleteShiftTemplate`) mới chỉ cập nhật vào bộ nhớ RAM của Zustand store (`useScheduleStore`).
   - Khi người dùng tải lại trang (F5) hoặc mở trình duyệt mới, các thay đổi sẽ biến mất hoàn toàn.
2. **Thực trạng Backend:**
   - Cơ sở dữ liệu MySQL **đã có sẵn** bảng `work_shifts` (được khởi tạo và seed trong `V1__init_schema.sql` và `V2__seed_master_data.sql`).
   - Backend Spring Boot **đã có sẵn đầy đủ** các endpoint RESTful trong [`WorkShiftController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift/controller/WorkShiftController.java) tại `/api/v1/work-shifts`:
     - `GET /api/v1/work-shifts`: Lấy toàn bộ danh sách mẫu ca đang hoạt động từ MySQL.
     - `POST /api/v1/work-shifts`: Thêm mới mẫu ca vào MySQL (yêu cầu quyền ADMIN / HR_MANAGER).
     - `PUT /api/v1/work-shifts/{id}`: Cập nhật mẫu ca trong MySQL.
     - `DELETE /api/v1/work-shifts/{id}`: Xóa mềm (soft-delete) mẫu ca trong MySQL.
3. **Khoảng trống cần xử lý (Gap):** Frontend chưa xây dựng API client service để kết nối các thao tác CRUD của mẫu ca tới Backend `/api/v1/work-shifts`.

---

## 2. Các Phương Án Đã Đánh Giá

| Tiêu chí | Phương án 1 (Được chọn) <br> **Tích hợp Backend MySQL API** | Phương án 2 <br> **Hybrid Optimistic UI + MySQL** | Phương án 3 <br> **LocalStorage Trình duyệt** |
| :--- | :--- | :--- | :--- |
| **Lưu vào MySQL thật** | ⭐⭐⭐ 100% lưu vĩnh viễn trên server DB | ⭐⭐⭐ 100% lưu vĩnh viễn trên server DB | ❌ Chỉ lưu trên máy cá nhân hiện tại |
| **Chia sẻ nhiều người dùng** | ⭐⭐⭐ Toàn bộ công ty nhìn thấy ca mới | ⭐⭐⭐ Toàn bộ công ty nhìn thấy ca mới | ❌ Máy khác không thấy được |
| **Độ tin cậy dữ liệu** | ⭐⭐⭐ Rất cao, có snapshotting & audit log | ⭐⭐⭐ Cao, cần xử lý rollback phức tạp | ⚠️ Dễ mất khi dọn cache browser |
| **Độ trễ phản hồi** | ~50ms (gọi API nội bộ cực nhanh) | 0ms (giao diện cập nhật trước) | 0ms |
| **Phù hợp câu hỏi** | Chuẩn xác yêu cầu "lưu vào database" | Phù hợp nhưng phức tạp hơn cần thiết | Không giải quyết câu hỏi gốc |

---

## 3. Thiết Kế Chi Tiết Giải Pháp (Phương Án 1)

### A. Xây dựng Service `workShiftService.ts`
Tạo file [`frontend/src/features/shifts/api/workShiftService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/api/workShiftService.ts) giao tiếp với API `/work-shifts`:
- `getAllWorkShifts(): Promise<ShiftTemplate[]>`
- `createWorkShift(data: Omit<ShiftTemplate, 'id'>): Promise<ShiftTemplate>`
- `updateWorkShift(id: number, data: Partial<ShiftTemplate>): Promise<ShiftTemplate>`
- `deleteWorkShift(id: number): Promise<void>`
- Xử lý chuyển đổi linh hoạt giữa format snake_case của Backend (`shift_code`, `start_time`, `is_cross_midnight`) và camelCase của Frontend.

### B. Cập Nhật Store [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts)
1. Thêm action `fetchShiftTemplates: () => Promise<void>`:
   - Gọi `workShiftService.getAllWorkShifts()` để nạp danh sách mẫu ca chuẩn từ MySQL khi trang mẫu ca mở hoặc khi khởi chạy ứng dụng.
2. Nâng cấp các action CRUD sang bất đồng bộ (Async Actions):
   - `addShiftTemplate`: Gọi backend `createWorkShift`, nhận `id` thật sinh từ MySQL, thêm vào store và thông báo Toast.
   - `updateShiftTemplate`: Gọi backend `updateWorkShift(id, data)`, cập nhật store.
   - `deleteShiftTemplate`: Kiểm tra ràng buộc phân công ca trong lịch tuần, sau đó gọi backend `deleteWorkShift(id)`.
3. Giữ fallback an toàn cho môi trường Unit Test (`isMockEnabled()`) để bảo toàn 100% kết quả test suites.

### C. Cập Nhật Trang [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx)
- Bổ sung `useEffect` tự động gọi `fetchShiftTemplates()` khi mount component để luôn hiển thị dữ liệu mới nhất từ MySQL.
- Thêm loading state nhẹ nhàng khi đang thực hiện lưu/xóa ca.

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Mở trang Danh mục mẫu ca (`/shifts`): Dữ liệu được nạp trực tiếp từ bảng `work_shifts` trong MySQL Database.
- [ ] Bấm "Thêm Mẫu Ca Mới" và lưu: Dữ liệu được ghi thành công vào MySQL, nhận `id` tự tăng từ database.
- [ ] Bấm "Lưu thay đổi" khi chỉnh sửa ca: Dữ liệu trong database được cập nhật ngay lập tức.
- [ ] Tải lại trang (F5): Dữ liệu ca mới/sửa vẫn hiển thị nguyên vẹn 100%, không bị mất.
- [ ] Khi chuyển sang Bảng Lịch Tuần (`/schedule`): Mẫu ca vừa tạo/sửa xuất hiện đầy đủ trong danh sách kéo/thả phân ca.
- [ ] Bộ unit tests Vitest (63/63 tests) và build Vite thành công 100% (Zero regression).
