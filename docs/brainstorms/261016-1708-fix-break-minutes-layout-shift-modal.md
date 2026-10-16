# Báo Cáo Brainstorm: Khắc Phục Lỗi Co Rúm Ô "Nghỉ Giữa Ca" & Cân Đối Bố Cục Modal Mẫu Ca

**Ngày tạo:** 2026-10-16  
**Chủ đề:** Khắc phục lỗi vỡ bố cục hàng 2 trong modal chỉnh sửa mẫu ca làm việc ([`ShiftTemplateFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx))  
**Trạng thái:** Đã thống nhất với người dùng (Phương án 1)

---

## 1. Vấn Đề Gốc & Phân Tích Kỹ Thuật

### Triệu chứng từ ảnh người dùng (`pasted-image-6.png`):
1. **Ô "Nghỉ (phút)" bị bóp nghẹt thành hình vuông nhỏ:**
   - Label tiêu đề bị gãy làm 2 dòng: dòng trên `Nghỉ`, dòng dưới `(phút)`.
   - Ô input bên dưới bị co ép chỉ còn chiều rộng ~40px (bằng đúng chiều cao), trông như một ô vuông hoặc nút màu.
   - Con số giá trị (như `30` hoặc `60`) bên trong bị che khuất hoàn toàn không thể đọc hay nhập liệu.
2. **Nguyên nhân kỹ thuật (CSS Grid Sizing Bug):**
   - Hàng 2 sử dụng `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;`.
   - Trong tiêu chuẩn CSS Grid, đơn vị `1fr` thực chất là viết tắt của `minmax(auto, 1fr)`, trong đó `auto` đại diện cho kích thước nội dung tối thiểu (`min-content`).
   - Hai component [`SmartTimePicker`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/SmartTimePicker.tsx) ở cột 1 ("Bắt đầu") và cột 2 ("Kết thúc") chứa các phần tử flex và input có kích thước `min-content` lớn (~230px). Do đó, chúng chiếm hơn 85% chiều rộng của hàng, chỉ để lại ~40px còn lại cho cột 3 ("Nghỉ (phút)").
   - Thêm vào đó, chiều cao ô nhập của `input-base` là 38px, lệch 2px so với chiều cao 40px của `SmartTimePicker`, và thiếu hậu tố đơn vị trực quan.

---

## 2. Giải Pháp Thống Nhất: Phương Án 1 (Grid Chuẩn Tỉ Lệ + Hậu Tố "phút" Đồng Bộ)

### A. Cân đối lại CSS Grid với `minmax(0, ...)`
- Sử dụng `grid-template-columns: repeat(3, minmax(0, 1fr));` hoặc tỷ lệ cân đối `minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr);`.
- Việc đặt `minmax(0, ...)` triệt tiêu cơ chế `min-content` mặc định, ép các cột tuân thủ nghiêm ngặt tỷ lệ phân bổ chiều rộng mà không thể chèn ép cột lân cận.

### B. Thiết kế lại ô "Nghỉ giữa ca" chuẩn Design System
1. **Tiêu đề nhãn (Label):** Đổi từ `Nghỉ (phút)` thành `Nghỉ giữa ca` nằm trên 1 hàng gọn gàng, cỡ chữ 11.5px, màu `#64748B`.
2. **Chiều cao & Padding:** Đồng bộ chiều cao `height: 40px` (chuẩn khít với `SmartTimePicker`).
3. **Hậu tố đơn vị (Unit Badge Suffix):**
   - Đặt trong container `position: relative`.
   - Bổ sung hậu tố chữ `phút` cố định ở bên phải (`position: absolute; right: 10px; top: 50%; color: #64748B; pointerEvents: 'none'`), tương tự phong cách của ô định biên `người tối thiểu` / `người tối đa` ở Hàng 3.
   - Thêm `paddingRight: 45px` để số nhập vào không bao giờ đè lên chữ `phút`.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Mở modal thêm/sửa ca: Cả 3 cột (Bắt đầu, Kết thúc, Nghỉ giữa ca) dàn đều tăm tắp, cân đối, không có trường nào bị co rúm hay méo mó.
- [ ] Nhãn `Nghỉ giữa ca` nằm ngay ngắn trên 1 dòng duy nhất.
- [ ] Ô nhập số phút nghỉ hiển thị rõ ràng giá trị số kèm hậu tố `phút`, chiều cao 40px đồng bộ với 2 ô chọn giờ.
- [ ] Toàn bộ 17/17 test suites (69/69 tests) và build Vite thành công 100% (Zero regression).
