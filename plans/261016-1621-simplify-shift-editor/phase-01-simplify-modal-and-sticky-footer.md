# Phase 1: Thiết Kế Lại ShiftTemplateFormModal Tinh Gọn & Ghim Cố Định Nút Lưu Thay Đổi

**Mã giai đoạn:** `PHASE-01`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 45 phút  
**Mục tiêu chính:** Loại bỏ 5 khối card lồng nhau phức tạp trong `ShiftTemplateFormModal.tsx`, thay thế bằng bố cục phẳng 3 hàng gọn gàng, và tạo Sticky Footer luôn ghim nút "Lưu thay đổi" ở đáy modal.

---

## 1. File Cần Chỉnh Sửa

- [`frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Điều Chỉnh Container Modal & Cuộn An Toàn
- Loại bỏ `overflow: hidden` trên modal content container.
- Thiết lập:
  ```css
  max-width: 580px;
  max-height: min(90vh, 580px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ```
- Thân form (`modal-body`) có `flex: 1; overflow-y: auto; padding: 20px 24px;` để nếu trên màn hình siêu nhỏ vẫn có thể cuộn phần thân một cách mượt mà.

### Bước 2: Bố Cục Form Phẳng 3 Hàng Tinh Gọn (KISS)
- **Hàng 1 (Nhận diện ca):**
  - Cột 1 (1fr): Mã ca (VD: `CA_SANG`)
  - Cột 2 (2fr): Tên ca hiển thị (VD: `Ca Sáng (06:00 - 14:00)`)
- **Hàng 2 (Thời gian & Giờ công):**
  - Giờ bắt đầu (type="time")
  - Giờ kết thúc (type="time")
  - Nghỉ giữa ca (phút) kèm dòng tính giờ thực tế tự động: `⏱️ 7.5h công thực tế`
  - Nếu qua đêm (`endTime < startTime`), hiển thị một badge vàng nhỏ: `🌙 Ca qua đêm (+1 ngày)`.
- **Hàng 3 (Định biên & Màu sắc):**
  - Định biên: 2 ô Tối thiểu - Tối đa với đơn vị `người/ca`.
  - Màu sắc: Dải 6 chấm swatch màu tròn/bo góc có checkmark khi chọn + thẻ Live Preview mini đặt kế bên.

### Bước 3: Ghim Cố Định Nút "Lưu Thay Đổi" (Sticky Footer)
- Tạo chân modal cố định:
  ```tsx
  <div
    style={{
      padding: '14px 24px',
      backgroundColor: '#F8FAFC',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
    }}
  >
    <button type="button" className="btn btn-secondary" onClick={onClose}>
      Hủy bỏ
    </button>
    <button type="submit" className="btn btn-primary" style={{ fontWeight: 700, minWidth: 140 }}>
      <Check size={16} /> Lưu thay đổi
    </button>
  </div>
  ```
- Nút bấm luôn luôn nhìn thấy ngay khi mở modal, không bao giờ bị che khuất.

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [x] Modal mở lên có chiều cao gọn gàng (~480px), không còn 5 khối card lồng nhau viền xám.
- [x] Chân modal luôn luôn hiển thị nút "Lưu thay đổi" màu xanh to rõ và nút "Hủy bỏ".
- [x] Nhập thông tin và bấm "Lưu thay đổi" kích hoạt callback `onSave` chuẩn xác.

