# Báo Cáo Brainstorm: Chuẩn Hóa Bộ Chọn Giờ Trên Desktop (Smart Time Input & Quick Dropdown)

**Ngày tạo:** 2026-10-16  
**Chủ đề:** Khắc phục lỗi vỡ layout form (clipping/overflow) và trải nghiệm cuộn giật khựng của bộ chọn giờ ca làm việc  
**Trạng thái:** Đã thống nhất với người dùng (Phương án 1)

---

## 1. Vấn Đề Gốc & Phân Tích Kỹ Thuật

### Triệu chứng từ ảnh người dùng (`pasted-image-11963.png`):
1. **Lỗi vỡ giao diện (Form Overflow & Clipping):**
   - Popover con lăn thời gian kiểu iPhone có chiều cao lớn (~280px) được đặt `position: absolute` bên trong vùng thân modal có thuộc tính `overflow-y: auto`.
   - Khi mở popover ở trường "Bắt đầu" hoặc "Kết thúc", menu popover bị cắt cụt ngang nửa con số `08 : 00` ngay mép trên của footer modal và đè che lấp hoàn toàn các trường thông tin bên dưới (Định biên nhân sự, người tối đa).
2. **Trải nghiệm cuộn không mượt mà (Laggy & Stuttering on Desktop):**
   - **Xung đột State & Scroll:** Sự kiện `onScroll` liên tục bắn `onChange` lên component cha khiến cả form re-render liên tục. Trong khi đó, `useEffect` lại cưỡng bức gán ngược `scrollTop` theo giá trị giờ hiện tại, dẫn tới vòng lặp xung đột làm bánh xe bị giật nảy, khựng đơ khi lăn chuột.
   - **Bất cập nền tảng:** Bánh xe cuộn tròn (Cupertino Wheel) vốn được thiết kế cho màn hình cảm ứng điện thoại (Touch/Swipe với quán tính haptic). Khi áp dụng lên Web Desktop với chuột máy tính (mỗi nấc cuộn chuột 100-120px), thao tác trở nên vụng về và kém hiệu quả so với việc gõ phím trực tiếp hoặc chọn mốc giờ sẵn có.

---

## 2. Các Phương Án Đã Đánh Giá

| Tiêu chí | Phương án 1 (Được chọn) <br> **Desktop Smart Time Input** | Phương án 2 <br> **Sửa Cupertino Wheel + Portal** | Phương án 3 <br> **Inline Dial/Stepper (+/-)** |
| :--- | :--- | :--- | :--- |
| **Bản chất UX** | Gõ trực tiếp + Dropdown gợi ý mốc giờ (Google Calendar / Shadcn) | Bánh xe iPhone nhưng đưa ra React Portal ngoài Modal | Tăng/giảm giờ phút bằng nút bấm trực tiếp trên form |
| **Khả năng gõ bàn phím** | ⭐⭐⭐ Rất nhanh, hỗ trợ phím số, tự format `HH:mm` | ❌ Không hỗ trợ gõ bàn phím | ❌ Phải click nhiều lần |
| **Không đè/vỡ Form** | ⭐⭐⭐ Nhỏ gọn, dropdown tự định vị hoặc đóng ngay sau 1 click | ⚠️ Popover vẫn to (280px), che khuất các trường dưới | ⭐⭐⭐ Không có popover, không lo che khuất |
| **Độ mượt trên Desktop** | ⭐⭐⭐ 100% mượt, zero lag, zero scroll conflict | ⚠️ Phụ thuộc thuật toán debounce mô phỏng quán tính | ⭐⭐⭐ Rất mượt |
| **Tính tương thích Web** | Chuẩn Best-Practice ứng dụng Web quản trị nhân sự | Thiên hướng Mobile app | Phù hợp widget nhỏ |

---

## 3. Thiết Kế Chi Tiết Phương Án 1 (Đã Thống Nhất)

### A. Thiết Kế Component `SmartTimePicker.tsx`
1. **Ô nhập liệu thông minh (Smart Input Capsule):**
   - Thiết kế chuẩn Design System: Chiều cao 40px, bo góc 8px, viền xám sáng, focus ring màu xanh `#2563EB`.
   - Icon đồng hồ `Clock` bên trái, nút mở menu danh sách bên phải.
   - **Hỗ trợ gõ trực tiếp:** Người dùng có thể bôi đen hoặc gõ nhanh giờ (VD: gõ `08:00`, `14:30`). Tự động validate định dạng `HH:mm` hợp lệ (00:00 - 23:59).
2. **Dropdown gợi ý mốc giờ (Quick Presets & Interval Slots):**
   - Danh sách mốc giờ cách nhau 30 phút hoặc 1 tiếng (VD: `06:00`, `06:30`, `07:00`, ..., `23:30`).
   - Có thanh lọc/chọn nhanh các ca chuẩn: `Ca Sáng (06:00, 08:00)`, `Ca Chiều (12:00, 14:00)`, `Ca Tối/Đêm (18:00, 22:00)`.
   - Chiều cao dropdown gọn gàng (~180px), cuộn tự nhiên bằng chuột, tự động cuộn đến giờ hiện tại khi mở.
   - Nhấn click 1 chạm là tự động chọn và đóng menu, không gây vướng víu che các ô nhập khác.
3. **Chống tràn/cắt xén giao diện:**
   - Kích thước vừa vặn theo chiều rộng của ô input (`width: 100%`), không bị bè ngang.
   - Định vị an toàn, đóng mở nhạy bén khi click outside hoặc bấm phím `Enter` / `Escape`.

### B. Tích hợp lại vào Modal `ShiftTemplateFormModal.tsx`
- Thay thế `IOSTimePicker` bằng `SmartTimePicker` cho cả hai trường "Bắt đầu" và "Kết thúc".
- Giữ nguyên các tính năng tính giờ công tự động (`⏱️ X.Xh công thực tế`) và cảnh báo ca đêm (`🌙 Ca qua đêm (+1)`).

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Mở modal thêm/sửa ca: Giao diện form hiển thị vuông vắn, không có popover to đè che khuất các trường định biên hay nút footer.
- [ ] Người dùng có thể gõ giờ trực tiếp từ bàn phím vào ô "Bắt đầu" và "Kết thúc".
- [ ] Bấm mở danh sách mốc giờ cuộn mượt mà, chọn nhanh 1 chạm là tự đóng.
- [ ] Giờ công thực tế và cờ ca qua đêm tự động cập nhật chính xác theo giờ đã chọn.
- [ ] Bộ unit tests đạt 100% (Zero regression) và build Vite hoàn toàn sạch lỗi.
