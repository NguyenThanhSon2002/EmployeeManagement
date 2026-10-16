---
title: "Kế Hoạch Chuẩn Hóa Bộ Chọn Giờ Trên Desktop (Smart Time Input & Quick Dropdown)"
description: "Thay thế bộ chọn giờ bánh xe con lăn iPhone bằng SmartTimePicker chuẩn Web Desktop: hỗ trợ gõ trực tiếp bàn phím, dropdown mốc giờ 30 phút mượt mà, không gây vỡ/cắt xén layout form modal."
status: completed
priority: P1
effort: 45m
branch: refactor/structure-cleanup
tags: [ui-ux, time-picker, desktop, shift-template, vitest]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Chuẩn Hóa Bộ Chọn Giờ Trên Desktop (Smart Time Input & Quick Dropdown)

## 1. Bối Cảnh & Vấn Đề Kỹ Thuật

Người dùng phản ánh: *"hiện tại phần chọn giờ bị lỗi form rồi và chọn cũng chưa được mượt mà"* kèm ảnh chụp màn hình ([`pasted-image-11963.png`](file:///C:/Users/sonnt119/AppData/Local/Temp/pasted-image-11963.png)).

### Nguyên nhân gốc rễ:
1. **Lỗi vỡ/cắt xén form (Clipping/Overflow):** Popover con lăn thời gian iPhone có chiều cao lớn (~280px) nằm trong container modal có `overflow-y: auto`. Khi mở ra, popover đè lên các trường bên dưới và bị cắt ngang nửa con số `08 : 00` ngay mép trên của footer modal.
2. **Khựng giật khi cuộn chuột trên Desktop:** Sự kiện `onScroll` liên tục cập nhật state cha, làm re-render toàn bộ form; trong khi đó `useEffect` lại can thiệp gán ngược `scrollTop`, gây xung đột khóa đơ con lăn chuột. Ngoài ra, con lăn bánh xe vốn phù hợp cho ngón tay vuốt trên điện thoại chứ không tối ưu cho chuột và bàn phím máy tính.

---

## 2. Mục Tiêu Triển Khai

- **Component `SmartTimePicker.tsx` chuyên biệt cho Desktop:**
  - Ô input thời gian hiển thị gọn gàng (cao 40px), icon `Clock` tinh tế, cho phép **gõ phím trực tiếp** (ví dụ: gõ `08:00`, `14:30`) có auto-format và validation `HH:mm`.
  - Dropdown mốc giờ cách nhau 30 phút (`06:00`, `06:30`, `07:00`... đến `23:30`) cùng dải mốc ca phổ biến (`06:00`, `08:00`, `12:00`, `14:00`, `17:00`, `22:00`).
  - Click chọn 1 chạm là tự đóng ngay lập tức, không che chắn form lâu dài, đóng mở mượt mà bằng click outside hoặc phím `Escape`.
- **Tích hợp vào `ShiftTemplateFormModal.tsx`:**
  - Áp dụng cho cả ô "Bắt đầu" và "Kết thúc".
  - Giữ nguyên cơ chế tính giờ công thực tế tức thì (`⏱️ X.Xh công thực tế`) và cờ ca qua đêm (`🌙 Ca qua đêm (+1)`).
- **Kiểm thử tự động & Zero Regression:**
  - Cập nhật bộ unit test `smart-time-picker.test.tsx` kiểm thử đầy đủ các hành vi (gõ phím, chọn dropdown, preset).
  - Đảm bảo 100% tests Vitest (63/63 tests) và Vite build hoàn toàn thành công.

---

## 3. Lộ Trình Triển Khai (2 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Xây Dựng Component SmartTimePicker Chuẩn Desktop](./phase-01-smart-time-picker-component.md) | Completed ✅ | 25m | Tạo `SmartTimePicker.tsx` hỗ trợ gõ phím trực tiếp, dropdown mốc giờ 30m, presets ca, chống tràn layout. |
| **Phase 2** | [Tích Hợp Vào Modal & Kiểm Thử Toàn Diện](./phase-02-integrate-and-verify.md) | Completed ✅ | 20m | Thay thế vào `ShiftTemplateFormModal`, cập nhật unit test `smart-time-picker.test.tsx`, xác minh 63/63 test xanh. |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Validation định dạng giờ 24h:** Biểu thức chính quy `^([01]\d|2[0-3]):([0-5]\d)$` bảo đảm không bao giờ lưu giờ sai định dạng.
2. **Kích thước dropdown gọn gàng:** Chiều cao `max-height: 200px`, `width: 100%` đồng bộ với ô input, không bao giờ bị cắt xén hay đè che form quá mức.
3. **WCAG Accessibility:** Hỗ trợ đầy đủ phím mũi tên `Up/Down`, `Enter` để chọn, `Escape` để đóng dropdown.
