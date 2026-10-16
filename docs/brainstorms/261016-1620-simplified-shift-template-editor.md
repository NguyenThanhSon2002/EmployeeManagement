# Báo Cáo Brainstorm: Đơn Giản Hóa Giao Diện Chỉnh Sửa Mẫu Ca & Ghim Cố Định Nút "Lưu Thay Đổi"

**Ngày tạo:** 2026-10-16  
**Chủ đề:** Tinh gọn giao diện chỉnh sửa ca làm việc (SCR-10) theo nguyên lý KISS và khắc phục lỗi khuất nút Lưu  
**Trạng thái:** Đã thống nhất với người dùng (Phương án 1)

---

## 1. Vấn Đề Gốc & Phân Tích Thực Trạng

### Triệu chứng từ ảnh người dùng cung cấp (`pasted-image-10.png`):
1. **Mất nút "Lưu thay đổi":** Người dùng vào chỉnh sửa ca nhưng không thấy bất kỳ nút Lưu thay đổi nào ở dưới form.
2. **Nguyên nhân kỹ thuật:** Form cũ được chia thành 5 khối Card lồng nhau (1. Nhận diện ca, 2. Khung giờ, 3. Định biên, 4. Bảng màu, 5. Thẻ xem trước), khiến chiều cao modal vượt quá 900px. Khi container modal có `overflow: hidden`, phần footer chứa nút "Lưu mẫu ca" và "Hủy" bị đẩy tuột ra ngoài mép dưới màn hình và bị cắt cụt (clipped).
3. **Phản hồi của người dùng:** *"hiện tại phần chỉnh sửa ca nhưng lại chưa có nút lưu thay đổi, hãy thêm nút lưu thay đổi và tôi muốn chỉnh sửa ca đơn gian thôi"*.

---

## 2. Giải Pháp Thống Nhất: Phương Án 1 (Form Tinh Gọn + Sticky Footer)

Áp dụng nghiêm ngặt nguyên lý **KISS (Keep It Simple, Stupid)** và **YAGNI**:

### A. Loại Bỏ Các Khối Card Lồng Nhau (Flatten Layout)
- Bỏ toàn bộ 5 khối hộp có viền xám lồng nhau phức tạp.
- Sử dụng bố cục form một lớp (single surface) phẳng, tối giản, thanh lịch, dễ nhìn.

### B. Cấu Trúc Bố Cục Tinh Gọn (3 Hàng Gọn Gàng)
1. **Hàng 1 (Thông tin ca):**
   - Cột trái: Mã ca (VD: `CA_SANG`)
   - Cột phải: Tên ca (VD: `Ca Sáng (06:00 - 14:00)`)
2. **Hàng 2 (Khung giờ & Thời lượng):**
   - Giờ bắt đầu, Giờ kết thúc, Thời gian nghỉ (phút) trên 1 hàng 3 cột.
   - Tự động hiển thị một dòng phụ nhỏ gọn: `⏱️ 7.5 giờ công thực tế` (nếu ca qua đêm thì có icon `🌙 Ca qua đêm (+1 ngày)`).
3. **Hàng 3 (Định biên & Màu sắc nhận diện):**
   - Cột trái: Định biên nhân sự (Tối thiểu - Tối đa).
   - Cột phải: Bảng chọn 6 mã màu chuẩn WCAG AA dạng chấm màu/swatch bo góc nhỏ gọn kèm thẻ Preview mini ngay kế bên.

### C. Nút "Lưu Thay Đổi" Luôn Luôn Hiển Thị (Sticky Footer)
- Chân modal được thiết kế cố định (Fixed/Sticky Footer) với đường kẻ phân cách mờ.
- Nút **"Lưu thay đổi"** to rõ, màu xanh primary rực rỡ kèm icon Checkmark, nằm cạnh nút "Hủy".
- Đảm bảo **100% không bao giờ bị cuộn che khuất hay bị đẩy ra ngoài màn hình** dù người dùng mở trên bất kỳ độ phân giải nào (kể cả màn hình 1366x768 hay tablet).

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Mở modal chỉnh sửa ca, nút **"Lưu thay đổi"** và nút **"Hủy"** lập tức xuất hiện rõ ràng trong tầm mắt.
- [ ] Chiều cao modal gọn gàng (~480px), không cần cuộn dọc dài dòng.
- [ ] Bấm nút "Lưu thay đổi" cập nhật thành công dữ liệu ca vào Zustand store & hiển thị Toast thông báo.
- [ ] Giữ vững 100% kết quả test suites (55/55 tests passed) và build Vite xanh 0 lỗi.
