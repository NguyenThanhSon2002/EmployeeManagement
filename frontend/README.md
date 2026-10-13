# Hệ Thống Quản Lý Nhân Sự & Lịch Phân Ca (Employee Management System - EMS Frontend)

Hệ thống ứng dụng web quản lý nhân sự chuyên sâu cho doanh nghiệp, lấy **Lịch phân ca làm việc (Work Schedule Calendar - SCR-11/SCR-12)** làm trung tâm với động cơ tính toán và phát hiện xung đột thời gian thực (**Conflict Detection Engine** tuân thủ Bộ luật Lao động 2019).

---

## 1. Công Nghệ & Kiến Trúc Kỹ Thuật

- **Frontend Framework:** React 19 + TypeScript (Chế độ Strict Mode 100%, `noImplicitAny: true`, tuyệt đối không dùng `any`).
- **Build Tool:** Vite 8 (Tối ưu hóa Rollup, thời gian khởi động < 300ms, HMR tức thì).
- **State Management:** Zustand (Kiến trúc phân tách đa store độc lập: `useScheduleStore`, `useAuthStore`, `useAttendanceStore`, `useLeaveStore`, `useSettingsStore`, `useUIStore`).
- **Styling & Design System:** Pure CSS Modules & CSS Custom Properties (`src/styles/tokens.css`, `reset.css`, `global.css`). Tối ưu hiệu năng, không phụ thuộc vào UI Component Library cồng kềnh (Tailwind/AntD/MUI).
- **Typography:** `@fontsource/be-vietnam-pro` và `@fontsource/inter` nạp offline cục bộ, hỗ trợ hiển thị tiếng Việt hoàn hảo.
- **Iconography:** `lucide-react` (Bộ icon SVG đồng bộ, sắc nét).
- **Date Handling:** `date-fns` (Thao tác ngày tháng chuẩn xác, định dạng chuẩn GMT+7).
- **Testing Framework:** Vitest + React Testing Library + `@testing-library/jest-dom` (35 bài kiểm thử tự động, 100% pass).

---

## 2. Hướng Dẫn Cài Đặt & Vận Hành

### Yêu cầu môi trường
- **Node.js:** v18.x trở lên (Khuyến nghị Node.js v20+ hoặc v24+).
- **Trình quản lý gói:** npm 9+.

### Lệnh chạy nhanh
```bash
# 1. Di chuyển vào thư mục frontend
cd "D:\Project\Employee Management\frontend"

# 2. Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# 3. Khởi chạy máy chủ phát triển cục bộ
npm run dev
# Mở trình duyệt tại: http://localhost:5173

# 4. Chạy toàn bộ bộ kiểm thử tự động (Unit & Integration tests)
npm test

# 5. Biên dịch sản phẩm xuất xưởng (Production Build)
npm run build
```

---

## 3. Bản Đồ Màn Hình & Phân Hệ Chức Năng (17 Màn Hình Chuẩn)

| Mã Màn Hình | Tên Màn Hình / Chức Năng | Đường Dẫn Tuyến | Mô Tả Nghiệp Vụ & Điểm Nổi Bật |
|:---|:---|:---|:---|
| **SCR-01** | Đăng nhập hệ thống | `/login` | Tích hợp **Bộ chuyển đổi vai trò (RoleSwitcher)** góc trên bên phải để demo tức thì 4 vai trò. |
| **SCR-02** | Bảng điều khiển (Dashboard) | `/dashboard` | 4 thẻ KPI quân số hôm nay, biểu đồ cột SVG xu hướng đi làm 7 ngày, Web Check-in/out và widget duyệt nhanh. |
| **SCR-03** | Danh sách nhân viên | `/employees` | Bảng dữ liệu phân trang 10 dòng/trang, tìm kiếm tức thì theo mã NV/tên/email, lọc theo phòng ban. |
| **SCR-04** | Modal Thêm/Sửa hồ sơ | Modal trên SCR-03 | Bố cục Form 2 cột, thẩm định Regex email doanh nghiệp và số điện thoại Việt Nam 10 chữ số. |
| **SCR-05** | Chi tiết hồ sơ nhân sự 360° | `/employees/:id` | 4 Tabs dữ liệu liên kết: Tab 1 (Lý lịch & Hợp đồng), Tab 2 (Lịch ca), Tab 3 (Bảng công), Tab 4 (Quỹ phép). |
| **SCR-08** | Bảng chấm công hàng ngày | `/attendance` | Giám sát giờ vào, giờ ra, số phút đi muộn, về sớm, giờ thực tế (`actualHours`), giờ đêm, trạng thái chấm công. |
| **SCR-09** | Modal giải trình công | Modal trên SCR-08 | Xử lý quên quét thẻ, thiếu check-out; Quản lý/HR phê duyệt cập nhật ngay giờ công thực tế. |
| **SCR-10** | Danh mục mẫu ca làm việc | `/shifts` | CRUD 4 mẫu ca chuẩn (Sáng, Sáng sớm, Chiều, Đêm), định biên min/max, cờ ca qua đêm (`+1`), bảo vệ snapshotting. |
| **SCR-11** | **Bảng phân ca làm việc tuần** | `/schedule` | **Core feature**: Ma trận 8 cột (Sticky Cột Nhân viên 260px + 7 cột Thứ), thẻ ca màu WCAG, cờ cảnh báo ⚠️. |
| **SCR-12** | **Drawer phân ca & xử lý xung đột**| Drawer trên SCR-11 | Kiểm tra xung đột tức thời BR-001..BR-007; chặn lưu nếu vi phạm Mandatory; bắt buộc giải trình $\ge 10$ ký tự nếu cảnh báo. |
| **SCR-13** | Quản lý đơn xin nghỉ phép | `/leaves` | Thẻ theo dõi quỹ phép năm, nộp đơn xin nghỉ, kiểm tra dải ngày trùng (BR-009) và số dư phép còn lại. |
| **SCR-14** | Modal phê duyệt đơn nghỉ | Modal trên SCR-13 | Phê duyệt/từ chối đơn; **Tự động đồng bộ**: Bấm duyệt sẽ gán ngay thẻ `[🏖️ PHÉP NĂM]` sang Bảng Lịch Tuần. |
| **SCR-15** | Trung tâm báo cáo & thống kê | `/reports` | 3 Tabs báo cáo: Tổng hợp công tháng, Đối chiếu Kế hoạch vs Thực tế (%), Báo cáo vi phạm kỷ luật. Xuất file CSV UTF-8 BOM. |
| **SCR-16** | Cài đặt hệ thống & tham số | `/settings` | Tinh chỉnh ngưỡng nghỉ giữa 2 ca (11.0h vs 12.0h BLLĐ 2019), trần tuần 48h, nút đỏ **Reset Demo Data**. |
| **SCR-17** | Hộp thoại thao tác hàng loạt | Popup trên SCR-11 | Gán ca hàng loạt (Bulk Assign), Sao chép tuần (Copy Week SKIP vs REPLACE), Công bố lịch (Publish Week). |

---

## 4. Động Cơ Tính Toán & Quy Tắc Kiểm Soát Xung Đột (Conflict Engine)

Toàn bộ logic tính toán nằm trong các pure functions tại `src/utils/conflict-detector.utils.ts` và `src/utils/schedule-calc.utils.ts`:

1. **BR-001 (Xung đột thời gian / Overlap):**
   - *Mức độ:* `MANDATORY` (Chặn lưu bắt buộc).
   - *Quy tắc:* Nhân viên không thể làm 2 ca có khoảng thời gian thực tế giao nhau trong cùng một ngày hoặc giữa ca đêm qua hôm sau.
2. **BR-002 (Thời gian nghỉ tối thiểu giữa 2 ca):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Khoảng cách từ giờ kết thúc ca trước tới giờ bắt đầu ca kế tiếp phải $\ge 11.0$ giờ (hoặc $12.0$ giờ theo cấu hình BLLĐ 2019).
3. **BR-003 (Trần giờ làm việc tối đa trong ngày):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Tổng số giờ làm việc thực tế trong ngày không được vượt quá 12.0 giờ.
4. **BR-004 (Trần giờ làm việc tối đa trong tuần):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Tổng số giờ làm việc được phân công trong tuần (từ Thứ 2 đến Chủ nhật) không được vượt quá 48.0 giờ.
5. **BR-005 (Làm việc liên tục quá số ngày):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Không bố trí nhân viên làm việc quá 6 ngày liên tục mà không có ít nhất 1 ngày nghỉ trọn vẹn 24h.
6. **BR-006 (Trùng lịch nghỉ phép / Ngày lễ):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Nhân viên đã có đơn nghỉ phép được duyệt hoặc ngày lễ công ty. Bắt buộc nhập lý do điều động làm thêm lễ/nghỉ nếu vẫn gán ca.
7. **BR-007 (Định biên nhân sự tối thiểu/tối đa):**
   - *Mức độ:* `WARNING` (Cảnh báo).
   - *Quy tắc:* Cảnh báo khi số lượng nhân sự xếp vào một ca thấp hơn định biên tối thiểu hoặc vượt quá định biên tối đa.

---

## 5. Dữ Liệu Mẫu & Kịch Bản Thử Nghiệm Chuẩn (10 Worked Examples)

Hệ thống được nạp sẵn 25 nhân sự mẫu và 4 mẫu ca làm việc chuẩn với neo thời gian xác định (**Deterministic Monday Anchor**):

- **EX-01 (Ca qua đêm +1 ngày):** Nhân viên `EMP-003 (Lê Văn Cường)` được phân công Ca Đêm (22:00 - 06:00). Thẻ ca hiển thị nhãn tím `(+1)` và tính đúng giờ sang ngày hôm sau.
- **EX-02 (Thời gian nghỉ 10.0h < 11.0h):** Nhân viên `EMP-002 (Trần Thị Bích)` làm Ca Chiều kết thúc 22:00 Thứ 3, sau đó được gán Ca Sáng 08:00 Thứ 4. Thời gian nghỉ thực tế là 10.0h $\rightarrow$ Kích hoạt cờ cảnh báo `⚠️ BR-002: Khoảng cách nghỉ giữa 2 ca là 10.0h (ngưỡng tối thiểu: 11.0h)`.
- **EX-03 (Chặn đứng phân ca trùng giờ):** Phân công 2 ca cùng khung giờ cho cùng một nhân viên $\rightarrow$ Drawer chặn nút "Lưu phân ca" với thông báo lỗi màu đỏ (BR-001 Mandatory).
- **EX-04 (Gán ca ngày nghỉ phép):** Nhân viên `EMP-002` có đơn nghỉ phép Thứ 5. Thẻ ô hiển thị màu xanh lá `[🏖️ Nghỉ phép năm]`. Khi mở Drawer gán ca vào ngày này $\rightarrow$ Xuất hiện cảnh báo vi phạm BR-006.
- **EX-05 (Vượt trần 48h tuần):** Nhân viên làm việc 6 ca chuẩn 8.0h (48.0h), khi gán thêm ca thứ 7 $\rightarrow$ Cảnh báo BR-004 vượt quá 48.0 giờ/tuần.
- **EX-06 (Bộ lọc chỉ hiện nhân sự có cảnh báo):** Bấm checkbox "Chỉ hiện có cảnh báo ⚠️" trên thanh công cụ $\rightarrow$ Danh sách lập tức lọc chỉ còn các nhân sự vi phạm (EMP-002, EMP-004).
- **EX-07 (Khóa chế độ xem khi chuyển sang Nhân viên):** Dùng `RoleSwitcher` đổi sang `ROLE_EMPLOYEE` $\rightarrow$ Giao diện ẩn toàn bộ nút chỉnh sửa (Chế độ Chỉ đọc - Read-only mode).
- **EX-08 (Xuất CSV tiếng Việt Excel):** Bấm "Xuất file CSV" $\rightarrow$ File tải về có tiền tố Byte Order Mark UTF-8 (`\uFEFF`), mở bằng Microsoft Excel hiển thị đầy đủ dấu tiếng Việt, không bị lỗi font (mojibake).
- **EX-09 (Điều chỉnh lịch đã công bố):** Chuyển trạng thái lịch sang `PUBLISHED`, sau đó sửa hoặc xóa ca $\rightarrow$ Bắt buộc nhập lý do điều chỉnh $\ge 5$ ký tự, tự động lưu vết vào `ChangeHistoryDrawer`.
- **EX-10 (Đổi ngưỡng nghỉ 11h/12h):** Vào trang `/settings`, chuyển ngưỡng nghỉ sang `12.0 giờ (BLLĐ 2019)` $\rightarrow$ Quay lại trang `/schedule`, toàn bộ các ca có thời gian nghỉ từ 11h đến 12h lập tức bật cờ cảnh báo ⚠️.

---

## 6. Đáp Ứng Thiết Bị & Khả Năng Tiếp Cận (Responsive & WCAG 2.1 AA)

- **Mobile View (< 768px):** Tự động chuyển đổi sang `<MobileDayView />` với bộ chọn thứ dạng **Day Tabs Slider** (`< [T2] [T3] [•T4•] ... >`) và danh sách thẻ nhân viên xếp dọc, giúp thao tác phân ca một tay dễ dàng trên điện thoại.
- **Tablet View (768px - 1024px):** Thanh Sidebar tự động thu gọn sang chế độ icon-only 80px, ma trận lịch tuần co giãn tự nhiên.
- **Desktop View (> 1024px):** Sidebar đầy đủ 250px, ma trận 8 cột chuẩn với cột thông tin nhân viên cố định (Sticky Column).
- **Accessibility (A11y):**
  - Mọi thẻ ca có thuộc tính `aria-label` mô tả chi tiết tên ca, giờ vào/ra, số giờ làm và cảnh báo vi phạm cho trình đọc màn hình.
  - Mọi hộp thoại Dialog và Drawer đều tích hợp hook `useModalFocusTrap`, giam giữ phím `Tab`/`Shift+Tab` và đóng nhanh bằng phím `Escape`.
  - Toàn bộ màu chữ và màu nền đạt tỷ lệ tương phản WCAG 2.1 AA ($\ge 4.5:1$).

---

## 7. Cấu Trúc Thư Mục Mã Nguồn

```text
frontend/
├── src/
│   ├── components/
│   │   ├── charts/TrendBarChart.tsx            # Biểu đồ cột SVG xu hướng 7 ngày
│   │   └── layout/                             # AppLayout, Sidebar, Topbar, RoleSwitcher
│   ├── data/mock/                              # Dữ liệu mẫu khởi tạo xác định
│   ├── features/
│   │   ├── attendance/                         # SCR-08 & SCR-09 Chấm công & Giải trình
│   │   ├── dashboard/                          # SCR-02 Bảng điều khiển đa vai trò
│   │   ├── employees/                          # SCR-03, 04, 05 Hồ sơ nhân sự 4 tabs
│   │   ├── leaves/                             # SCR-13 & SCR-14 Quản lý & Duyệt đơn nghỉ phép
│   │   ├── reports/                            # SCR-15 Trung tâm báo cáo & đối chiếu giờ
│   │   ├── schedule/                           # SCR-11 & SCR-12 Core Schedule Matrix
│   │   │   ├── components/                     # WeeklyGrid, MobileDayView, ShiftCard, KPI...
│   │   │   └── dialogs/                        # AssignShiftDrawer, BulkAssign, CopyWeek...
│   │   ├── settings/                           # SCR-16 Cài đặt tham số & Reset Demo
│   │   └── shifts/                             # SCR-10 Quản lý mẫu ca làm việc
│   ├── hooks/                                  # useModalFocusTrap, useMediaQuery
│   ├── routes/                                 # AppRoutes, route-paths
│   ├── store/                                  # Zustand stores (Schedule, Auth, Attendance...)
│   ├── styles/                                 # tokens.css, reset.css, global.css
│   ├── test/                                   # Vitest suites (Foundation, A11y, Integration...)
│   └── utils/                                  # conflict-detector, schedule-calc, csv-exporter...
├── package.json
├── tsconfig.json
└── vite.config.ts
```
