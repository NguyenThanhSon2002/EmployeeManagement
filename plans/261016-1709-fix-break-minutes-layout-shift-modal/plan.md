---
title: "Kế Hoạch Khắc Phục Lỗi Co Rúm Ô 'Nghỉ Giữa Ca' & Cân Đối Bố Cục Modal Mẫu Ca"
description: "Cân đối lại CSS Grid với minmax(0, 1fr), đồng bộ chiều cao 40px và bổ sung hậu tố đơn vị 'phút' cho ô Nghỉ giữa ca trong ShiftTemplateFormModal."
status: completed
priority: P1
effort: 20m
branch: refactor/structure-cleanup
tags: [ui-ux, css-grid, modal, shift-template, vitest]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Khắc Phục Lỗi Co Rúm Ô "Nghỉ Giữa Ca" & Cân Đối Bố Cục Modal Mẫu Ca

## 1. Bối Cảnh & Vấn Đề Kỹ Thuật

Người dùng phản ánh: *"giao diện bị lỗi rồi, hãy sửa lại giao diện đi"* kèm ảnh chụp màn hình ([`pasted-image-6.png`](file:///C:/Users/sonnt119/AppData/Local/Temp/pasted-image-6.png)).

### Nguyên nhân kỹ thuật:
- Hàng 2 của modal sử dụng `grid-template-columns: 1fr 1fr 1fr;` mà không chỉ định `minmax(0, ...)`.
- Mặc định, mỗi cột `1fr` có kích thước cơ sở `minmax(auto, 1fr)`. Hai component [`SmartTimePicker`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/SmartTimePicker.tsx) ở cột "Bắt đầu" và "Kết thúc" có `min-content` lớn (~230px), dẫn đến việc chiếm dụng hơn 85% chiều rộng hàng và ép cột "Nghỉ (phút)" co rúm lại thành một ô vuông nhỏ ~40px, che lấp số phút và khiến tiêu đề bị gãy làm 2 dòng.
- Chiều cao ô nhập của `input-base` (38px) cũng lệch so với 2 ô chọn giờ (40px) và thiếu hậu tố đơn vị trực quan.

---

## 2. Mục Tiêu Triển Khai

- **Sửa CSS Grid Hàng 2:** Áp dụng `grid-template-columns: repeat(3, minmax(0, 1fr));` (hoặc `minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr)`), đảm bảo 3 cột chia đều tỷ lệ không bị chèn ép.
- **Nâng cấp ô "Nghỉ giữa ca":**
  - Đổi label sang `Nghỉ giữa ca` trên 1 hàng duy nhất (11.5px, màu `#64748B`).
  - Đặt `height: 40px` đồng bộ chuẩn khít với 2 ô `SmartTimePicker`.
  - Bổ sung hậu tố chữ `phút` cố định bên phải với `paddingRight: 45px` tương tự các ô định biên ở Hàng 3.
- **Kiểm thử tự động & Zero Regression:**
  - Chạy toàn bộ 17/17 test suites (69+ tests) và build Vite đảm bảo không có bất kỳ lỗi nào.

---

## 3. Lộ Trình Triển Khai (2 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Cập Nhật Bố Cục Grid & Thiết Kế Ô Nghỉ Giữa Ca](./phase-01-fix-grid-layout-and-break-input.md) | Completed ✅ | 15m | Sửa CSS Grid Hàng 2 trong `ShiftTemplateFormModal.tsx`, thêm hậu tố `phút`, đồng bộ chiều cao 40px. |
| **Phase 2** | [Kiểm Thử Giao Diện & Build Verification](./phase-02-test-and-verification.md) | Completed ✅ | 5m | Xác minh unit tests trong `shift-modal.test.tsx`, kiểm tra 69/69 test xanh và build Vite thành công. |
