# Phase 02: Tích Hợp Vào ShiftTemplateFormModal & Kiểm Thử Toàn Diện

**Mục tiêu:** Tích hợp `SmartTimePicker` vào modal thêm/sửa ca, viết unit test kiểm thử và đảm bảo 100% test suites passed (Zero regression).

---

## 1. Tích Hợp Vào [`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx)
- Thay thế import `IOSTimePicker` bằng `SmartTimePicker`.
- Áp dụng cho:
  - Trường "Bắt đầu": `<SmartTimePicker label="Bắt đầu" value={startTime} onChange={setStartTime} />`
  - Trường "Kết thúc": `<SmartTimePicker label="Kết thúc" value={endTime} onChange={setEndTime} />`
- Đảm bảo tính toán thời lượng công thực tế (`⏱️ X.Xh công thực tế`) và cờ ca đêm (`🌙 Ca qua đêm (+1)`) hoạt động chính xác khi người dùng gõ phím hoặc click chọn dropdown.

---

## 2. Kiểm Thử Unit Test & Verification
- Tạo file kiểm thử [`frontend/src/features/shifts/__tests__/smart-time-picker.test.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/__tests__/smart-time-picker.test.tsx):
  - Test 1: Render ô input hiển thị đúng giá trị thời gian ban đầu (VD: `08:00`).
  - Test 2: Cho phép người dùng gõ trực tiếp giờ từ bàn phím (VD: nhập `09:30`).
  - Test 3: Mở dropdown khi bấm vào ô input hoặc icon đồng hồ.
  - Test 4: Bấm chọn một mốc giờ trong danh sách gợi ý và tự động đóng dropdown.
  - Test 5: Bấm chọn mốc giờ preset nhanh (VD: `14:00`).
  - Test 6: Đóng dropdown khi nhấn phím `Escape` hoặc click ra ngoài.
- Dọn dẹp component cũ `IOSTimePicker.tsx` và test cũ `ios-time-picker.test.tsx`.
- Chạy `npm test -- --run` đảm bảo toàn bộ 16/16 test files và 61+ tests đạt 100% Xanh.
- Chạy `npm run build` để xác thực TypeScript compilation và Vite production bundle sạch sẽ.
