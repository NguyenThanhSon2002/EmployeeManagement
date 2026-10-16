---
title: "Kế Hoạch Tinh Gọn Giao Diện Chỉnh Sửa Mẫu Ca & Ghim Cố Định Nút Lưu Thay Đổi"
description: "Đơn giản hóa form chỉnh sửa mẫu ca theo nguyên lý KISS, loại bỏ 5 khối card lồng nhau, thu gọn chiều cao về 480px và ghim cố định nút 'Lưu thay đổi' ở chân modal (Sticky Footer) đảm bảo không bao giờ bị cuộn che khuất."
status: completed
priority: P1
effort: 1h
branch: refactor/structure-cleanup
tags: [ui-ux, shift-template, kiss, modal, sticky-footer, vitest]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Tinh Gọn Giao Diện Chỉnh Sửa Mẫu Ca & Ghim Cố Định Nút Lưu Thay Đổi

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Người dùng phản ánh: *"hiện tại phần chỉnh sửa ca nhưng lại chưa có nút lưu thay đổi, hãy thêm nút lưu thay đổi và tôi muốn chỉnh sửa ca đơn gian thôi"* kèm ảnh chụp màn hình ([`pasted-image-10.png`](file:///C:/Users/sonnt119/AppData/Local/Temp/pasted-image-10.png)).

### Nguyên nhân kỹ thuật:
1. **Form quá dài bị cuộn mất nút Lưu:** Modal cũ chia thành 5 khối Card lồng nhau (Nhận diện, Khung giờ, Định biên, Bảng màu, Live preview), chiều cao vượt quá 900px. Khi container có `overflow: hidden`, phần footer chứa nút "Cập nhật mẫu ca" và "Hủy" bị đẩy ra ngoài mép dưới màn hình và bị cắt cụt hoàn toàn.
2. **Cấu trúc rườm rà không cần thiết:** Người dùng mong muốn giao diện chỉnh sửa ca **đơn giản**, không cần 5 khối viền xám lồng tầng lớp gây ngợp thông tin.

---

## 2. Mục Tiêu Triển Khai

- **Form phẳng, tinh gọn (Single-Surface KISS):** Gom tất cả trường nhập liệu (Mã, Tên, Giờ bắt đầu, Giờ kết thúc, Nghỉ, Định biên, Bảng màu) vào một bố cục 3 hàng sạch sẽ, thoáng mắt, không lồng hộp.
- **Nút "Lưu thay đổi" ghim cố định (Sticky Footer):** Nút màu xanh primary to rõ có icon Checkmark, luôn luôn ghim chặt ở chân modal, hiển thị ngay lập tức trong tầm mắt mà không cần cuộn trang.
- **Kích thước tối ưu vừa vặn:** Chiều cao modal khoảng ~480px, tương thích 100% với màn hình laptop và tablet mà không bị tràn màn hình.
- **Zero Regression:** Đảm bảo toàn bộ 55+ unit tests Vitest đạt 100% Xanh và Vite build thành công dưới 500ms.

---

## 3. Lộ Trình Triển Khai (2 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Thiết Kế Lại ShiftTemplateFormModal Tinh Gọn & Ghim Cố Định Nút Lưu Thay Đổi](./phase-01-simplify-modal-and-sticky-footer.md) | Completed ✅ | 45m | Bỏ 5 card lồng nhau, gom 3 hàng gọn gàng, tạo sticky footer với nút "Lưu thay đổi" & "Hủy bỏ". |
| **Phase 2** | [Cập Nhật Unit Tests & Build Verification Toàn Diện](./phase-02-test-and-verification.md) | Completed ✅ | 15m | Cập nhật matcher trong `shift-modal.test.tsx`, chạy full vitest suite (55/55 passed) và `npm run build`. |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Sticky Footer Pattern:** `position: sticky; bottom: 0; background: #FFFFFF; border-top: 1px solid #E2E8F0; z-index: 10;`
2. **Responsive Max-Height:** `max-height: min(90vh, 580px); overflow-y: auto;`
3. **WCAG AA Compliance:** Duy trì độ tương phản màu sắc > 4.5:1 và hỗ trợ phím `Escape` để đóng modal.
