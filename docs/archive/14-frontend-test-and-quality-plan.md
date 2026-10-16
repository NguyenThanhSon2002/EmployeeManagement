# TÀI LIỆU 14: KẾ HOẠCH KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG FRONTEND (TEST & QUALITY PLAN)
**Dự án:** Employee Management System  
**Phân hệ:** Toàn bộ Frontend (Trọng tâm: Core Work Scheduling - SCR-11)  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. DANH MỤC KIỂM THỬ ĐƠN VỊ TIỆN ÍCH PHÂN CA (UNIT TEST SPECIFICATIONS - VITEST)

Toàn bộ các hàm tiện ích tính toán và kiểm tra xung đột trong `src/utils/` bắt buộc phải đạt độ bao phủ kiểm thử (Test Coverage) **tối thiểu 95%** với các ca kiểm thử biên (Boundary Cases) cụ thể.

```
SƠ ĐỒ CÁC BỘ KIỂM THỬ ĐƠN VỊ CỐT LÕI (CORE VITEST SUITES)
├── [Suite 1: schedule-calc.test.ts] Tính giờ Gross, Net, Giờ đêm, Trừ nghỉ giữa ca
├── [Suite 2: overlap-detector.test.ts] Kiểm tra giao thoa thời gian ca (BR-001)
├── [Suite 3: rest-time-checker.test.ts] Kiểm tra thời gian nghỉ giữa 2 ca 11h/12h (BR-006)
├── [Suite 4: weekly-hours.test.ts] Cộng dồn giờ kế hoạch tuần & cảnh báo trần 48h (BR-004)
├── [Suite 5: copy-merge.test.ts] Thuật toán trộn ca sao chép tuần (Skip vs Replace)
└── [Suite 6: csv-exporter.test.ts] Xuất file CSV tiếng Việt kèm ký tự UTF-8 BOM
```

---

### Bộ Kiểm Thử 1: Tính Thời Lượng Ca Làm Việc (`schedule-calc.test.ts`)
| Test Case ID | Mục Đích Kiểm Thử | Dữ Liệu Đầu Vào (Input) | Kết Quả Kỳ Vọng (Expected Output) | Ý Nghĩa Nghiệp Vụ / Biên |
|:---:|:---|:---|:---|:---|
| `TC-CALC-01` | Ca hành chính chuẩn có nghỉ trưa | `start: "08:00"`, `end: "17:00"`, `break: 60`, `crossMidnight: false` | `{ grossHours: 9.0, netHours: 8.0, nightHours: 0.0 }` | Ca ngày thường chuẩn Điều 105 BLLĐ. |
| `TC-CALC-02` | Ca không nghỉ giữa ca | `start: "06:00"`, `end: "14:00"`, `break: 0`, `crossMidnight: false` | `{ grossHours: 8.0, netHours: 8.0, nightHours: 0.0 }` | Ca sáng sớm liên tục. |
| `TC-CALC-03` | Ca qua đêm trọn vẹn khung giờ đêm | `start: "22:00"`, `end: "06:00"`, `break: 0`, `crossMidnight: true` | `{ grossHours: 8.0, netHours: 8.0, nightHours: 8.0 }` | Ca đêm từ 22:00 đến 06:00 sáng hôm sau. |
| `TC-CALC-04` | Ca tối có 2 giờ làm việc ban đêm | `start: "16:00"`, `end: "24:00"`, `break: 30`, `crossMidnight: false` | `{ grossHours: 8.0, netHours: 7.5, nightHours: 2.0 }` | Khung giờ 22:00 - 24:00 tính là giờ đêm. |
| `TC-CALC-05` | Ca ngắn (Part-time) 4 tiếng | `start: "18:00"`, `end: "22:00"`, `break: 0`, `crossMidnight: false` | `{ grossHours: 4.0, netHours: 4.0, nightHours: 0.0 }` | Ca tối bán thời gian kết thúc đúng 22:00. |

---

### Bộ Kiểm Thử 2: Kiểm Tra Trùng Khung Giờ Làm Việc (`overlap-detector.test.ts`)
| Test Case ID | Mục Đích Kiểm Thử | Ca Đã Có (Existing) | Ca Mới Cần Gán (New) | Kết Quả Kỳ Vọng | Ghi Chú Kỹ Thuật |
|:---:|:---|:---|:---|:---:|:---|
| `TC-OVERLAP-01`| Trùng nhau hoàn toàn | `12/10 08:00 - 17:00` | `12/10 08:00 - 17:00` | `hasOverlap: true` | Trùng 100% thời gian $\rightarrow$ Chặn. |
| `TC-OVERLAP-02`| Ca mới nằm lọt trong ca cũ | `12/10 08:00 - 17:00` | `12/10 10:00 - 14:00` | `hasOverlap: true` | Giao thoa bên trong $\rightarrow$ Chặn. |
| `TC-OVERLAP-03`| Ca mới giao thoa phần đuôi ca cũ | `12/10 08:00 - 16:00` | `12/10 14:00 - 22:00` | `hasOverlap: true` | Trùng 2 tiếng (14:00 - 16:00) $\rightarrow$ Chặn. |
| `TC-OVERLAP-04`| Hai ca tiếp giáp sát giờ (Edge-touching)| `12/10 06:00 - 14:00` | `12/10 14:00 - 22:00` | `hasOverlap: false` | Tiếp giáp tại đúng 14:00:00 không tính trùng giờ! |
| `TC-OVERLAP-05`| Hai ca tách rời hoàn toàn | `12/10 06:00 - 12:00` | `12/10 16:00 - 22:00` | `hasOverlap: false` | Hợp lệ (cách nhau 4 tiếng). |
| `TC-OVERLAP-06`| Ca đêm giao thoa với ca sáng hôm sau | `12/10 22:00 - 13/10 06:00` | `13/10 05:00 - 13/10 13:00` | `hasOverlap: true` | Trùng 1 tiếng (05:00 - 06:00) ngày 13/10 $\rightarrow$ Chặn. |

---

### Bộ Kiểm Thử 3: Kiểm Tra Thời Gian Nghỉ Ngơi Giữa 2 Ca (`rest-time-checker.test.ts`)
| Test Case ID | Mục Đích Kiểm Thử | Ca Trước (End Time) | Ca Sau (Start Time) | Ngưỡng Nghỉ | Kết Quả Kỳ Vọng | Chi Tiết Phép Tính |
|:---:|:---|:---|:---|:---:|:---:|:---|
| `TC-REST-01` | Vi phạm ngưỡng 11 giờ | `12/10 22:00:00` | `13/10 06:00:00` | **11.0 giờ** | `isViolated: true` | Khoảng nghỉ: 8.0 giờ ($< 11.0$h, thiếu 3.0h) $\rightarrow$ Warning. |
| `TC-REST-02` | Đạt ngưỡng nghỉ chính xác 11.0h | `12/10 22:00:00` | `13/10 09:00:00` | **11.0 giờ** | `isViolated: false`| Khoảng nghỉ: 11.0 giờ ($= 11.0$h) $\rightarrow$ Hợp lệ. |
| `TC-REST-03` | Vi phạm khi đổi sang ngưỡng 12.0h | `12/10 21:00:00` | `13/10 08:30:00` | **12.0 giờ** | `isViolated: true` | Khoảng nghỉ: 11.5 giờ ($< 12.0$h, thiếu 0.5h) $\rightarrow$ Warning. |
| `TC-REST-04` | Ca đêm Chủ Nhật tràn sang Thứ Hai | `18/10 22:00 (CN)` | `19/10 08:00 (T2)` | **11.0 giờ** | `isViolated: true` | Ca đêm kết thúc 06:00 T2. Nghỉ đến 08:00 T2 chỉ có 2.0h $\rightarrow$ Warning. |

---

### Bộ Kiểm Thử 4: Thuật Toán Sao Chép Lịch Tuần (`copy-merge.test.ts`)
| Test Case ID | Kịch Bản Kiểm Thử | Tuần Nguồn ($W-1$) | Tuần Đích Hiện Tại ($W0$) | Chế Độ Sao Chép | Kết Quả Kỳ Vọng |
|:---:|:---|:---:|:---:|:---:|:---|
| `TC-COPY-01` | Tuần đích hoàn toàn trống | 100 ca | 0 ca | `SKIP_OCCUPIED` | `copiedCount: 100`, `skippedCount: 0`. Toàn bộ 100 ca được tạo mới. |
| `TC-COPY-02` | Tuần đích đã có ca và chọn Skip | 100 ca | 20 ca (trùng 15 ô) | `SKIP_OCCUPIED` | `copiedCount: 85`, `skippedCount: 15`. Giữ nguyên 20 ca cũ, tổng sau chép: 105 ca. |
| `TC-COPY-03` | Tuần đích đã có ca và chọn Replace | 100 ca | 20 ca | `REPLACE_ALL` | `copiedCount: 100`, `skippedCount: 0`. Xóa sạch 20 ca cũ, chép đè 100 ca nguồn. |
| `TC-COPY-04` | Tuần đích có Đơn nghỉ phép đã duyệt | 100 ca | 5 thẻ nghỉ phép | `REPLACE_ALL` | Giữ nguyên 5 thẻ nghỉ phép, không bị xóa đè. |

---

## 2. DANH MỤC KIỂM THỬ COMPONENT VÀ TƯƠNG TÁC (COMPONENT & INTEGRATION TESTS)

Sử dụng `@testing-library/react` để mô phỏng chính xác hành vi tương tác của người dùng:

| Test Case ID | Component Cần Test | Kịch Bản Tương Tác Của Người Dùng | Kết Quả Kỳ Vọng Trên Giao Diện |
|:---:|:---|:---|:---|
| `TC-INT-01` | `<WeeklyGrid />` | Click vào một ô ngày còn trống của nhân viên EMP-001 | Drawer `AssignShiftDrawer` trượt ra, tiêu đề hiển thị đúng tên nhân viên và ngày click. |
| `TC-INT-02` | `<AssignShiftDrawer />`| Chọn Ca Sáng cho EMP-001 (không có xung đột) và bấm "Lưu" | Drawer đóng lại, Toast thông báo "Gán ca thành công", ô lịch xuất hiện Thẻ Ca Sáng màu xanh nhạt. |
| `TC-INT-03` | `<AssignShiftDrawer />`| Chọn ca trùng giờ (gây ra lỗi BR-001 Mandatory) | Xuất hiện Banner màu đỏ báo lỗi trùng ca. Nút "Lưu phân ca" bị disabled. |
| `TC-INT-04` | `<AssignShiftDrawer />`| Chọn ca vi phạm BR-006 (Warning), tích checkbox và nhập lý do $\ge 10$ ký tự | Nút "Lưu phân ca" được kích hoạt (enabled). Lưu thành công kèm cờ cảnh báo màu vàng trên ô. |
| `TC-INT-05` | `<ScheduleToolbar />` | Lịch đang có 1 lỗi Mandatory $\rightarrow$ Click nút "Công bố lịch" | Nút công bố bị disabled hoặc hiện Modal chặn: "Không thể công bố khi còn lỗi nghiêm trọng". |
| `TC-INT-06` | `<ScheduleToolbar />` | Lịch đang ở trạng thái DRAFT hợp lệ $\rightarrow$ Click "Công bố lịch" | Mở `PublishConfirmDialog`, bấm xác nhận $\rightarrow$ Badge chuyển sang `PUBLISHED` màu xanh lá. |
| `TC-INT-07` | `<ScheduleCell />` | Sửa ca trên một tuần đã `PUBLISHED` | Mở `ChangeReasonDialog` bắt buộc nhập lý do điều chỉnh $\ge 5$ ký tự trước khi cho phép lưu. |
| `TC-INT-08` | `<RoleSwitcher />` | Chuyển vai trò sang "Nhân viên (Employee)" | Toàn bộ các nút: Gán ca, Xóa ca, Sao chép tuần, Công bố lịch đều biến mất hoặc bị vô hiệu hóa (Read-only). |

---

## 3. BẢNG CHECKLIST KIỂM THỬ THỦ CÔNG TỪNG MÀN HÌNH (MANUAL QA CHECKLIST)

### SCR-11: Bảng Lịch Làm Việc Tuần (Trọng Tâm)
- [ ] Mở màn hình: Dữ liệu tải đầy đủ cho tuần hiện tại (W0), hiển thị 25 nhân viên và 7 cột thứ.
- [ ] Nút "Hôm nay": Bấm vào tự động cuộn hoặc đánh dấu viền cột ngày hiện tại trong tuần.
- [ ] Chuyển tuần: Bấm `< Tuần trước` chuyển sang W-1 (trạng thái Published); bấm `Tuần sau >` chuyển sang W+1.
- [ ] Lọc phòng ban: Đổi sang "Phòng Kỹ thuật" $\rightarrow$ Danh sách đổi sang các lập trình viên.
- [ ] Tìm kiếm: Gõ "EMP-001" $\rightarrow$ Lưới chỉ hiển thị duy nhất dòng của Nguyễn Văn An.
- [ ] Cờ "Chỉ hiện cảnh báo": Bật checkbox $\rightarrow$ Lưới chỉ lọc ra 2 nhân viên có cờ vàng ⚠️ (Trần Thị Bích và Phạm Văn Dũng).
- [ ] Xuất CSV: Bấm nút "Xuất lịch (CSV)" $\rightarrow$ File tải về máy tính, mở bằng Microsoft Excel hiển thị đúng tiếng Việt không lỗi font.
- [ ] Phím tắt: Dùng phím mũi tên di chuyển giữa các ô; bấm `Enter` mở Drawer; bấm `Del` mở xác nhận xóa.
- [ ] Nút "Reset Demo Data": Bấm khôi phục $\rightarrow$ Trang tải lại và toàn bộ dữ liệu trở về trạng thái gốc.

### SCR-02: Bảng Điều Khiển Tổng Quan
- [ ] 4 Thẻ KPI: Số liệu tổng quân số (45), có mặt (38), đi muộn (2), nghỉ phép (3) hiển thị chính xác.
- [ ] Widget điểm danh nhanh: Bấm "Check-in vào ca" $\rightarrow$ Đổi nút sang "Check-out kết thúc ca" và bắt đầu đếm giờ.
- [ ] Widget duyệt nhanh: Bấm "Chấp thuận" trên đơn phép của Trần Thị Bích $\rightarrow$ Thẻ đơn biến mất khỏi danh sách chờ.

### SCR-03: Danh Sách Nhân Viên
- [ ] Bảng dữ liệu hiển thị phân trang: 10 nhân viên/trang.
- [ ] Bấm nút "Thêm nhân viên": Modal form mở ra với đầy đủ các trường thông tin.
- [ ] Bấm icon con mắt `[👁️]`: Chuyển hướng mượt mà sang SCR-05 (Chi tiết hồ sơ nhân viên).

### SCR-10: Cấu Hình Mẫu Ca Làm Việc
- [ ] Hiển thị đầy đủ 4 mẫu ca (Sáng, Sáng sớm, Chiều, Đêm) với màu sắc nhận diện đặc trưng.
- [ ] Thử sửa ca: Đổi giờ hoặc định biên $\rightarrow$ Không làm biến động các ca đã gán trên lịch nhờ snapshot.

### SCR-13: Danh Sách Đơn Xin Nghỉ Phép
- [ ] Hiển thị đơn phép đã duyệt của Trần Thị Bích ngày Thứ Năm.
- [ ] Thử tạo đơn mới: Chọn ngày trùng đơn cũ $\rightarrow$ Hệ thống báo lỗi trùng lặp đơn (BR-009).

### SCR-15: Báo Cáo & Thống Kê
- [ ] Tab "Báo cáo Tổng hợp Công tháng": Hiển thị bảng ma trận tổng giờ làm việc thực tế của 25 nhân viên.
- [ ] Tab "Đối chiếu Kế hoạch vs Thực tế": Cột Chênh lệch (%) hiển thị đúng tỷ lệ hoàn thành giờ công.
- [ ] Bấm nút "Xuất file CSV" $\rightarrow$ File tải về thành công với bảng mã UTF-8 BOM.

### SCR-16: Cài Đặt Tham Số Hệ Thống
- [ ] Chuyển toggle "Ngưỡng nghỉ tối thiểu giữa 2 ca" từ 11 giờ sang 12 giờ.
- [ ] Quay lại màn hình SCR-11 $\rightarrow$ Xuất hiện thêm cảnh báo mới do ca kết thúc 21:00 và bắt đầu 08:30 (khoảng nghỉ 11.5h $< 12.0$h).

---

## 4. MA TRẬN ĐÁP ỨNG THIẾT BỊ VÀ TRÌNH DUYỆT (RESPONSIVE & BROWSER MATRIX)

### 4.1. Ma Trận Kích Thước Màn Hình (Responsive Viewports)
| Thiết Bị Kiểm Thử | Chiều Rộng Viewport | Bố Cục Kỳ Vọng Của Bảng Lịch Tuần (SCR-11) | Tiêu Chí Đạt (Pass Criteria) |
|:---|:---:|:---|:---|
| **Điện thoại di động (iPhone/Android)**| `375px - 430px` | Tự động chuyển sang **Day Tabs Slider + Single Day List**. Ẩn Sidebar (Menu Hamburger). | Không bị vỡ bố cục ngang; Thao tác chọn thứ và đổi ca bằng ngón tay mượt mà. |
| **Máy tính bảng (iPad/Android Tab)** | `768px - 1024px` | Sidebar thu gọn 80px (chỉ hiện icon). Giữ nguyên lưới 7 cột nhưng co gọn padding cell. | Cột nhân viên cố định bên trái (Sticky); Trục ngang cuộn nhẹ nếu quá hẹp. |
| **Laptop / Desktop Tiêu Chuẩn** | `1280px - 1440px` | Sidebar mở rộng 250px. Hiển thị hoàn hảo 7 cột thứ trên 1 màn hình không cần cuộn ngang. | Lưới phân ca hiển thị thoáng đãng, chữ rõ nét, đạt độ tương phản chuẩn. |
| **Màn hình Lớn (Ultra-wide Desktop)** | `1920px` trở lên | Nội dung mở rộng tối đa (Max-width 1800px), căn giữa canvas. Thêm khoảng thở thị giác. | Không bị kéo dãn kỳ dị; Giữ vững tỷ lệ font và card. |

### 4.2. Ma Trận Trình Duyệt Hỗ Trợ (Target Browsers)
- **Google Chrome (Bản 115+):** Trình duyệt chính (Primary target) - 100% tính năng hoạt động hoàn hảo.
- **Microsoft Edge (Bản 115+):** Hoạt động tương đương Chrome (nhân Chromium).
- **Mozilla Firefox (Bản 120+):** Kiểm tra kỹ CSS Grid và đường viền bảng ma trận.
- **Apple Safari (Bản 16+ trên macOS & iOS):** Kiểm tra hiển thị font Be Vietnam Pro và định dạng ngày `date-fns`.

---

## 5. MỤC TIÊU HIỆU NĂNG VÀ TIÊU CHÍ HOÀN THÀNH (PERFORMANCE TARGETS & DEFINITION OF DONE)

### 5.1. Chỉ Số Hiệu Năng Mục Tiêu (Performance SLA)
1. **Tốc độ Tải Lưới Lịch Tuần (25 nhân sự x 7 ngày):** Thời gian render lần đầu **dưới 200 mili-giây**.
2. **Quy mô Mở rộng Lớn (300 nhân sự x 31 ngày):** Thời gian render và phản hồi tương tác **dưới 2.5 giây** (đạt chuẩn NFR-001).
3. **Độ Trễ Tương Tác Ô (Interaction Latency):** Từ lúc click vào ô lịch đến khi Drawer trượt ra hoàn tất: **dưới 80 mili-giây** (Không cảm nhận độ trễ thị giác).
4. **Tìm Kiếm Danh Sách:** Áp dụng Debounce 300ms, lọc tức thì 25 nhân sự trong dưới 10 mili-giây.

### 5.2. Tiêu Chí Hoàn Thành Một Tính Năng (Definition of Done - DoD)
Một màn hình hoặc tính năng chỉ được xem là HOÀN THÀNH (DONE) khi đáp ứng toàn bộ 8 tiêu chí:
- [x] **1. Tuân thủ TypeScript:** 100% TypeScript Strict, không có bất kỳ cảnh báo biên dịch nào, zero `any`.
- [x] **2. Đạt Chuẩn Thiết Kế:** Tuân thủ 100% bảng màu tokens và tỷ lệ tương phản WCAG 2.1 AA.
- [x] **3. Đầy Đủ 4 Trạng Thái:** Có đủ giao diện Loading (Skeleton), Empty State, Error State và Normal State.
- [x] **4. Không Hard-code Chuỗi:** Toàn bộ thông điệp và câu báo lỗi đọc từ file từ điển chuẩn `messages.vi.ts`.
- [x] **5. Kiểm Thử Đơn Vị:** Toàn bộ pure functions có unit test với Vitest, 100% test cases pass.
- [x] **6. Kiểm Soát Phân Quyền:** Hoạt động chính xác theo cả 3 góc nhìn vai trò (Admin, Manager, Employee).
- [x] **7. Điều Hướng Bàn Phím:** Các Dialog có focus trap, lưới lịch hỗ trợ phím mũi tên và Escape.
- [x] **8. Khôi Phục Dữ Liệu:** Tính năng Reset Demo Data hoạt động trơn tru.

---
*Kết thúc Tài liệu 14.*
