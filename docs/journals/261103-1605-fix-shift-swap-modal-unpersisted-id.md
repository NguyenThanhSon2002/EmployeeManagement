# Nhật ký Kỹ thuật: Khắc phục Lỗi Không Tìm Thấy Phân Ca Khi Đề Xuất Nhường Ca

- **Thời gian:** 03/11/2026 16:05 (ICT)
- **Tác vụ:** Sửa lỗi `ResourceNotFoundException: Không tìm thấy Phân ca của người yêu cầu với định danh: 1793695272315002` và hiện tượng "Bạn chưa có ca làm việc nào trong tuần này" trong [`ShiftSwapModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/ShiftSwapModal.tsx).

---

## 1. Bản chất & Nguyên nhân gốc rễ (Root Cause Analysis)

### Nguyên nhân 1: Xung đột giữa ID tạm thời phía Client (`Date.now() * 1000`) và Database
- Trong thuật toán xếp ca tự động [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts) (dòng 299), các phân ca đề xuất được gán ID tạm: `Date.now() * 1000 + seq++` (ví dụ `1793695272315002`).
- Khi người dùng áp dụng lịch tự động, hàm `applyAutoAssignments` cũ chỉ cập nhật lạc quan vào Store & `localStorage`. Nếu backend gặp lỗi hoặc người dùng click đổi ca ngay, ID `1793695272315002` vẫn tồn tại ở client.
- Khi mở modal đổi ca, `ShiftSwapModal` tự động kích hoạt `simulateSwap({ requesterAssignmentId: 1793695272315002 })` gửi lên backend. Backend tìm kiếm trong bảng `shift_assignments` không có ID này nên văng lỗi 404: `Không tìm thấy Phân ca của người yêu cầu với định danh: 1793695272315002`.

### Nguyên nhân 2: Lỗi phân quyền ngữ cảnh khi Quản lý/Giám đốc tạo đề xuất thay mặt nhân viên
- Tại ô lịch làm việc ([`ShiftGridCell.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx)), nút icon `<ArrowLeftRight />` cho phép Quản lý/Giám đốc bấm vào chip của bất kỳ nhân viên nào để tạo đơn nhường/đổi ca thay cho nhân viên đó.
- Tuy nhiên, [`ShiftSwapModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/ShiftSwapModal.tsx) lại cố định lấy `myShifts` theo `currentUserId` (người đang đăng nhập, ví dụ Quản lý/Giám đốc).
- Vì Quản lý/Giám đốc không có ca trực nào trong tuần tại chi nhánh này, `myShifts` bị rỗng dẫn đến:
  - Thông báo đỏ: *"Bạn chưa có ca làm việc nào trong tuần này để đề xuất."*
  - Ô `<select>` chọn ca nguồn bị ẩn hoàn toàn, dù `selectedSourceId` ngầm nhận ID của nhân viên được click.
  - Danh sách chọn đồng nghiệp đối tác lại loại trừ `currentUserId` thay vì loại trừ nhân viên giữ ca, dẫn đến có thể chọn chính nhân viên đó để nhường ca cho bản thân.

---

## 2. Giải pháp kỹ thuật đã triển khai

1. **Chuẩn hóa Ngữ cảnh Người Yêu Cầu trong [`ShiftSwapModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/ShiftSwapModal.tsx):**
   - Xác định `effectiveRequesterId = sourceAssignment ? sourceAssignment.employeeId : currentUserId`.
   - Bổ sung cờ `isManagerOnBehalf` và thông tin `requesterEmployee`.
   - `myShifts` lọc theo `effectiveRequesterId`, đồng thời luôn đảm bảo `sourceAssignment` có mặt trong danh sách lựa chọn.
   - `candidateEmployees` loại trừ `effectiveRequesterId` (chính chủ ca trực), tránh nhường ca cho chính mình.
   - Thêm banner thông báo trực quan: *"Đang tạo đề xuất thay cho: [Họ tên] ([Mã])"*.

2. **Chặn gửi ID Tạm Thời lên Backend (Defense-in-depth):**
   - Định nghĩa `isClientTemporaryId = (id) => !id || id > 1_000_000_000_000`.
   - Trong `useEffect` mô phỏng kiểm tra xung đột thời gian thực và `handleSubmit`, nếu ca nguồn/đích mang ID tạm, modal hiển thị thông báo hướng dẫn người dùng làm mới trang để nạp dữ liệu chính thức thay vì bắn request lỗi 404 lên backend.

3. **Lọc sạch Cache LocalStorage bị ô nhiễm ID tạm thời ([`scheduleStorage.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/utils/scheduleStorage.ts)):**
   - Trong `normalizeAssignmentsMap`, loại bỏ mọi phân ca có `id >= 1_000_000_000_000` khi đọc từ `localStorage`, tự động thanh lọc dữ liệu rác cũ của trình duyệt.

4. **Nâng cấp `applyAutoAssignments` thành Bất đồng bộ ([`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts)):**
   - Chờ `batchAssignShifts` hoàn tất trên máy chủ.
   - Ngay sau khi máy chủ lưu thành công, tự động gọi `fetchWeeklySchedule` để tải lại toàn bộ ID phân ca chuẩn từ MySQL và lưu vào Store & Storage.
   - Nếu có lỗi, tự động rollback trạng thái từ máy chủ và trả về thông điệp lỗi cho UI hiển thị Toast.

---

## 3. Kết quả kiểm thử & Nghiệm thu
- **Frontend Build (`npm run build`):** Biên dịch thành công 0 lỗi TypeScript / Vite.
- **Backend Test (`mvn test`):** 21/21 test cases passed.
- **Xác thực API Backend:** Thử nghiệm API `POST /api/v1/shift-swaps/simulate` và `POST /api/v1/shift-swaps` trực tiếp với các phân ca thực tế (ID 665, 674) hoạt động trơn tru, trạng thái `PENDING_PEER` được tạo thành công.
