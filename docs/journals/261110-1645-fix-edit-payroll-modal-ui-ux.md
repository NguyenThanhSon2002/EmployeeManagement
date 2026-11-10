# Technical Journal: Tối ưu UI/UX Modal Chỉnh Sửa Phiếu Lương (EditPayrollItemModal)

- **Thời gian:** 10/11/2026 - 16:48
- **Tác giả:** Antigravity AI
- **Đối tượng:** `EditPayrollItemModal.tsx`
- **Mục tiêu:** Khắc phục lỗi hiển thị, giảm nhiễu trực quan (zero visual noise) và nâng cấp trải nghiệm người dùng theo tiêu chuẩn UI/UX Pro Max.

---

## 1. Vấn đề Phát Hiện & Nguyên Nhân Gốc (Root Cause)

Từ ảnh chụp màn hình thực tế của người dùng đối với nhân sự **Full-time (EMP-001 - Nguyễn Thu Phương - Giám đốc)**:
1. **Đơn giá ca đêm mặc định bị lẻ & kỳ lạ (`36.058` VNĐ/h):**
   - Công thức cũ tính: `base_salary / 208 * 0.3` (với 25.000.000 đ = 36057.69 đ), làm tròn thô thành `36058`.
   - Khi hiển thị ra `CurrencyInput`, số này hiển thị thành `36.058`, kèm dòng chữ `= Thành tiền ca đêm: 0 đ (0h × 36.058 đ)`.
   - Khi nhân sự không đi làm đêm (0h), việc nhân với `36.058` khiến người dùng lầm tưởng form bị lỗi tính toán số học hoặc lỗi floating point.
2. **Dòng tính toán thừa thãi khi giờ công = 0 (Visual Noise):**
   - Cả mục Part-time và Ca đêm đều in các dòng `= Thành tiền: 0 đ (0h × 0 đ)` và `= Thành tiền ca đêm: 0 đ (0h × 36.058 đ)`.
   - Ở cột phải (*Chi Tiết Công Thức Tính*): hiển thị `Part-time (0h × 0 đ): +0 đ` và `Ca đêm (0h × 36.058 đ): +0 đ`. Điều này gây rối mắt và không giống một phiếu lương tiêu chuẩn.
3. **Lệch trục dọc (Vertical Asymmetry / Uneven Row Heights):**
   - Cột trái chỉ có Label + Input, còn cột phải có thêm dòng subtext dài bên dưới. Grid row bị kéo dãn bất đối xứng, mất nhịp điệu thị giác (visual rhythm).
4. **Thiếu Progressive Disclosure theo loại hình nhân sự:**
   - Nhân viên Full-time thường không có ca part-time nhưng vẫn bị ép hiển thị toàn bộ 2 ô Part-time trống trơn.

---

## 2. Giải Pháp & Thay Đổi Đã Thực Hiện

### A. Làm tròn đơn giá ca đêm sạch sẽ & Khử phép nhân 0h
- Làm tròn đơn giá ca đêm đến hàng nghìn đồng:
  ```ts
  const rawNRate = (Number(item.base_salary) / 208) * 0.3;
  initNRate = Math.round(rawNRate / 1000) * 1000 || 35000; // Ra 36.000 đ thay vì 36.058 đ
  ```
- Không bao giờ hiển thị huy hiệu tính tiền `(0h × ... = 0 đ)` khi giờ công = 0.
- Chỉ khi `nightHours > 0` hoặc `partTimeHours > 0` mới hiển thị huy hiệu kết quả tính tiền đẹp mắt bên dưới.

### B. Progressive Disclosure theo loại hình lao động (`isFullTime`)
- Với nhân viên **Full-time**:
  - Ưu tiên hiển thị: Hàng 1 (Giờ công & Lương cứng Full-time), Hàng 2 (Làm việc ban đêm).
  - Mục Part-time: Mặc định ẩn gọn dưới nút bấm `+ Thêm giờ làm Part-time (nếu có làm thêm ca)`. Nếu người quản lý nhấn vào hoặc nhân viên đã có giờ part-time > 0, mục này mới bung ra đầy đủ.
- Với nhân viên **Part-time**:
  - Ưu tiên hiển thị: Hàng 1 (Giờ công Part-time & Đơn giá Part-time), Hàng 2 (Làm việc ban đêm).
  - Mục Lương cứng: Thu gọn dưới nút `+ Bổ sung lương cứng (nếu có)`.

### C. Cân bằng nhịp điệu thị giác & Chiều cao ô nhập (Symmetrical Layout)
- Cả hai cột trong mỗi hàng đều có:
  - Header đồng mức cao (`minHeight: 18px`).
  - Ô nhập/view đồng mức cao chuẩn (`height: 38px`, `boxSizing: 'border-box'`).
  - Dòng hướng dẫn (subtext) đồng đều ở cả 2 bên.

### D. Bảng Xem Trước Công Thức Tính Cố Định (Sticky Live Preview)
- Chỉ hiển thị các mục thực tế có giá trị `> 0`:
  - `basePay > 0` -> Hiện Lương cứng.
  - `computedPartTimePay > 0` -> Hiện Part-time.
  - `computedNightPay > 0` -> Hiện Ca đêm.
  - `totalAllowances > 0` -> Hiện Phụ cấp.
  - `totalBonuses > 0` -> Hiện Thưởng.
  - `totalDeductions > 0` -> Hiện Khấu trừ.
- Bỏ hoàn toàn các dòng `0h × 0 đ = 0 đ`.
- Cột bên phải được áp dụng `position: 'sticky', top: 0`, modal header và footer có `flexShrink: 0`, đảm bảo bảng xem trước luôn nằm trong tầm nhìn khi cuộn xem danh sách phụ cấp, thưởng, phạt.

---

## 3. Kiểm Thử & Xác Minh

1. **Frontend TypeScript & Vite Build:**
   - Lệnh: `npm run build`
   - Kết quả: `2867 modules transformed`, build thành công trong `370ms`, 0 lỗi compile.
2. **Docker Container Deployment:**
   - Lệnh: `docker compose build frontend; docker compose up -d frontend`
   - Trạng thái container: `hrms-frontend Recreated and Started`, cổng `8082`.
