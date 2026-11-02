# Nhật ký kỹ thuật: Sửa lỗi hiển thị cảnh báo xung đột (Hiển thị nhầm ca không có xung đột)

**Thời gian:** 2026-11-02 10:56 (GMT+7)  
**File ảnh hưởng:** [ShiftGridCell.tsx](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx)

## 1. Vấn đề phát hiện
- Khi lọc theo chế độ **"Chỉ hiện có xung đột"** (hoặc click vào thẻ tóm tắt **"CẢNH BÁO XUNG ĐỘT: 1 trường hợp"**), nhân viên **Nguyễn Tử Duy Anh** (EMP-153) chỉ có duy nhất 1 cảnh báo xung đột vào **Ca Sáng (08:00 - 13:00)** ngày Thứ Năm (05/11/2026) do vi phạm quy tắc `BR-006` (nghỉ qua đêm 9 tiếng sau khi làm 10 tiếng ngày hôm trước).
- Tuy nhiên trên giao diện lịch phân ca, cả **Ca Tối (18:00 - 23:00)** của cùng ngày hôm đó cũng bị đóng khung viền cam đậm (`border: 2px solid #F59E0B`), nền sáng lên và không bị làm mờ, khiến người dùng nhìn thấy như có 2 ca bị cảnh báo xung đột.

## 2. Nguyên nhân gốc rễ (Root Cause)
- Trong component [ShiftGridCell.tsx](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx), biến `hasCellConflict` được tính như sau:
  ```ts
  const hasCellConflict = assignments.some((a) => {
      const key = `${a.employeeId}_${workDate}`;
      return (conflictsMap[key]?.length || 0) > 0;
  });
  ```
- Logic này chỉ kiểm tra xem nhân viên có xung đột nào trong ngày `workDate` không, mà **không lọc theo `template.id`** của ô ca hiện tại.
- Do đó, khi nhân viên làm 2 ca trong cùng một ngày (Ca Sáng và Ca Tối), nếu chỉ có Ca Sáng bị xung đột thì Ca Tối vẫn bị tính là `hasCellConflict = true`, dẫn đến:
  - `isFocusedConflict = true` -> Viền cam, nền vàng sáng, gán id DOM focus.
  - `isDimmed = false` -> Không bị làm mờ khi lọc "Chỉ hiện có xung đột".

## 3. Giải pháp đã thực hiện
1. Trích xuất hàm `getEffectiveConflicts(assignment, index)` trong [ShiftGridCell.tsx](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/ShiftGridCell.tsx) để lọc chính xác cảnh báo chỉ thuộc về ca làm việc hiện tại (`c.workShiftId === template.id` và `c.assignmentId === assignment.id`).
2. Cập nhật `hasCellConflict`:
   ```ts
   const hasCellConflict = assignments.some((a, idx) => getEffectiveConflicts(a, idx).length > 0);
   ```
3. Đồng bộ hóa việc render chip nhân viên bằng cách tái sử dụng trực tiếp kết quả từ `getEffectiveConflicts(assignment, index)`.
4. Rebuild và deploy lại container `hrms-frontend`.

## 4. Kết quả kiểm tra
- Build TypeScript / Vite thành công 100%.
- Container `hrms-frontend` đã được khởi động lại thành công.
- Giờ đây, chỉ duy nhất ô ca có xung đột thực tế (Ca Sáng 05/11) mới được highlight và viền cam; Ca Tối được làm mờ đúng chuẩn khi bật bộ lọc xung đột.
