# TÀI LIỆU 15: LỘ TRÌNH VÀ KẾ HOẠCH TRIỂN KHAI FRONTEND (IMPLEMENTATION ROADMAP)
**Dự án:** Employee Management System  
**Phân hệ trọng tâm:** Lịch phân ca (Weekly Work Schedule Roster - SCR-11)  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. TỔNG QUAN CÁC GIAI ĐOẠN PHÁT TRIỂN (PHASED STAGES OVERVIEW)

Lộ trình phát triển được chia nhỏ thành 6 giai đoạn tuần tự từ Stage 0 đến Stage E. Mỗi công việc (task) đều được ước lượng thời gian cụ thể (tính theo giờ làm việc), phù hợp cho một lập trình viên mới bắt đầu hoặc một lượt chạy tự động của AI Agent.

```
SƠ ĐỒ LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN (IMPLEMENTATION PIPELINE)
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 0: Khởi tạo dự án & Nền tảng kỹ thuật (Vite, TS, Tokens, Vitest) │ (Ước lượng: 6h)
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE A: Khung ứng dụng, Dữ liệu mẫu, Store & Tiện ích tính toán       │ (Ước lượng: 14h)
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE B: MÀN HÌNH TRỌNG TÂM - LỊCH PHÂN CA (SCR-11, SCR-12) (B1 -> B9) │ (Ước lượng: 32h)
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE C: Phân hệ Nhân sự, Bảng điều khiển & Cài đặt (SCR-02, 03, 16)   │ (Ước lượng: 12h)
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE D: Chấm công, Mẫu ca, Nghỉ phép & Trung tâm Báo cáo (SCR-08..15) │ (Ước lượng: 16h)
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE E: Tối ưu hóa hiệu năng, WCAG 2.1 AA, Kiểm thử toàn diện & Đóng gói│ (Ước lượng: 8h)
└────────────────────────────────────────────────────────────────────────┘
                       TỔNG THỜI LƯỢNG TOÀN BỘ DỰ ÁN: 88 GIỜ LÀM VIỆC (~11 NGÀY CÔNG)
```

---

## 2. CHI TIẾT CÁC GIAI ĐOẠN VÀ ĐẦU MỤC CÔNG VIỆC (WORK BREAKDOWN STRUCTURE - WBS)

---

### GIAI ĐOẠN 0 (STAGE 0): KHỞI TẠO DỰ ÁN & NỀN TẢNG KỸ THUẬT
- **Mục tiêu:** Tạo mới thư mục `frontend/`, cấu hình môi trường Vite, TypeScript Strict Mode, React Router DOM, Vitest, nạp font ngoại tuyến và thiết lập các Design Tokens CSS Variables.
- **Thời lượng:** 6 giờ làm việc.
- **Phụ thuộc:** Không có.

| Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Mô Tả & Tiêu Chí Chấp Nhận (Acceptance Criteria) |
|:---:|:---|:---:|:---|
| `TSK-001` | Khởi tạo dự án Vite + React + TypeScript | 1.0h | Chạy scaffolding tạo thư mục `frontend/`, cấu hình `tsconfig.json` với `strict: true`, `noImplicitAny: true`. |
| `TSK-002` | Cài đặt dependencies cốt lõi | 1.0h | Cài đặt: `react-router-dom`, `zustand`, `date-fns`, `@fontsource/be-vietnam-pro`, `@fontsource/inter`, `lucide-react`. DevDeps: `vitest`, `@testing-library/react`, `jsdom`. |
| `TSK-003` | Cấu hình Vite Alias & Vitest | 1.0h | Thiết lập alias `@/` trỏ vào `src/`. File `vitest.config.ts` chạy môi trường jsdom, lệnh `npm test` hoạt động. |
| `TSK-004` | Xây dựng hệ thống CSS Tokens | 2.0h | Tạo `src/styles/tokens.css` chứa toàn bộ biến màu sắc WCAG, typography, spacing, radius theo `docs/12`. |
| `TSK-005` | Khởi tạo cấu trúc thư mục chuẩn | 1.0h | Tạo khung xương thư mục `src/` theo sơ đồ cây tại `docs/10`. |

- **Điểm dừng phê duyệt (Stop Point 0):** Kiểm tra `npm run build` thành công, không có cảnh báo TypeScript nào.

---

### GIAI ĐOẠN A (STAGE A): KHUNG ỨNG DỤNG, DỮ LIỆU MẪU, STATE & PURE UTILS
- **Mục tiêu:** Xây dựng layout tổng thể (Sidebar, Topbar, RoleSwitcher), nạp toàn bộ Domain Types, cài đặt các hàm pure utils tính toán ca/xung đột, nạp mock seed data và hoàn thành 100% Unit Test.
- **Thời lượng:** 14 giờ làm việc.
- **Phụ thuộc:** Hoàn thành Stage 0.

| Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Mô Tả & Tiêu Chí Chấp Nhận (Acceptance Criteria) |
|:---:|:---|:---:|:---|
| `TSK-A01` | Khai báo Domain Types TypeScript | 2.0h | Tạo `src/types/domain.types.ts` chứa đầy đủ 14 interfaces theo mục 7 của `docs/10`. |
| `TSK-A02` | Viết các hàm pure utils thời gian & ca | 2.5h | `date.utils.ts` và `schedule-calc.utils.ts`: tính gross, net, ca đêm, cộng dồn giờ tuần. |
| `TSK-A03` | Viết Conflict Detection Engine | 3.0h | `conflict-detector.utils.ts`: kiểm tra 6 quy tắc BR-001..BR-007 độc lập với React state. |
| `TSK-A04` | Viết và chạy Vitest Unit Tests | 2.5h | Tạo 4 test suites theo `docs/14`. Chạy `npm test` đạt 100% pass với 18 test cases. |
| `TSK-A05` | Nạp Mock Seed Data neo theo tuần này | 2.0h | Tạo `src/data/mock/` với 25 nhân viên, 4 mẫu ca, seed ca tuần này/trước/sau theo `docs/13`. |
| `TSK-A06` | Xây dựng AppLayout & RoleSwitcher | 2.0h | `<AppLayout />`, `<Sidebar />` co giãn 250px/80px, `<Topbar />` có Real-time Clock và Dropdown đổi vai trò. |

- **Điểm dừng phê duyệt (Stop Point A):** Chạy `npm test` pass toàn bộ; mở trình duyệt thấy AppLayout mượt mà, đổi role trên Topbar cập nhật state tức thì.

---

### GIAI ĐOẠN B (STAGE B): MÀN HÌNH TRỌNG TÂM - LỊCH PHÂN CA (SCR-11 & SCR-12)
- **Mục tiêu:** Hoàn thiện toàn diện màn hình Lịch làm việc tuần và Drawer gán ca với đầy đủ 9 tiểu giai đoạn chuyên sâu.
- **Thời lượng:** 32 giờ làm việc.
- **Phụ thuộc:** Hoàn thành Stage A.

| Tiểu Giai Đoạn | Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Tiêu Chí Chấp Nhận |
|:---|:---:|:---|:---:|:---|
| **B1: Grid Read-only** | `TSK-B01` | Xây dựng khung ma trận `<WeeklyGrid />` | 3.5h | CSS Grid 8 cột, Sticky column nhân viên, 7 cột thứ. Hiển thị đúng 25 nhân viên và thẻ ca có màu WCAG. |
| | `TSK-B02` | Hàng tiêu đề `<GridHeader />` & Định biên | 1.5h | Tiêu đề ngày thứ, cờ ngày lễ `[🚩 LỄ]`, thanh định biên số người/ca (ví dụ `ĐB: 4/4`). |
| **B2: Dialogs Gán Ca** | `TSK-B03` | Bảng trượt `<AssignShiftDrawer />` | 4.0h | Drawer trượt từ phải (450px), chọn mẫu ca, xem tổng giờ tuần của nhân viên, nút xóa ca. |
| | `TSK-B04` | Modal gán hàng loạt `<BulkAssignDialog />`| 2.5h | Chọn nhiều nhân viên và dải ngày, gán đồng loạt ca. |
| **B3: Validation & Guard**| `TSK-B05` | Tích hợp Conflict Engine vào Drawer | 3.5h | Báo lỗi đỏ nếu trùng ca (BR-001); Báo cảnh báo vàng nếu nghỉ $< 11$h (BR-006) kèm ô nhập lý do $\ge 10$ ký tự. |
| | `TSK-B06` | Cờ cảnh báo nhấp nháy trên Thẻ ca ma trận | 2.0h | Thẻ ca vi phạm hiển thị icon chấm than vàng ⚠️ và Tooltip chi tiết. |
| **B4: Bộ Lọc & Tìm Kiếm**| `TSK-B07` | Thanh lọc `<ScheduleFiltersBar />` | 2.5h | Tìm kiếm nhân viên (Debounce 300ms), lọc chức danh, toggle "Chỉ hiện người có cảnh báo". |
| **B5: Thẻ Tổng Hợp KPI**| `TSK-B08` | 4 Thẻ chỉ số `<ScheduleSummaryCards />` | 2.0h | Tổng ca, Tổng giờ kế hoạch, Số cảnh báo xung đột, Số ca thiếu định biên. Bấm thẻ cảnh báo tự động lọc lưới. |
| **B6: Chế Độ Lịch Tháng**| `TSK-B09` | Chế độ xem tháng `<MonthViewGrid />` | 3.0h | Xem tổng quan 31 ngày dạng lưới tháng khi bật toggle "Tháng" trên Toolbar. |
| **B7: Publish & History** | `TSK-B10` | Quy trình công bố & Modal xác nhận | 2.5h | Modal `PublishConfirmDialog`. Chặn nếu có lỗi Mandatory. Công bố đổi trạng thái sang `PUBLISHED`. |
| | `TSK-B11` | Nhật ký thay đổi & Modal lý do sửa lịch | 2.5h | Sửa ca tuần Published kích hoạt `ChangeReasonDialog`, lưu vào `scheduleChangeHistory`, xem trong Drawer. |
| **B8: Xuất Lịch CSV** | `TSK-B12` | Tiện ích xuất CSV UTF-8 BOM | 1.5h | Bấm nút "Xuất lịch" tải file `Lich_Phan_Ca_Tuan_42.csv`, mở trên Excel không lỗi dấu tiếng Việt. |
| **B9: Tiếp Cận & Phím Tắt**| `TSK-B13` | Điều hướng bàn phím & ARIA labels | 1.0h | Phím mũi tên di chuyển giữa các ô, `Enter` mở Drawer, `Escape` đóng popup. |

- **Điểm dừng phê duyệt (Stop Point B - QUAN TRỌNG NHẤT):** Thử nghiệm toàn bộ 10 worked examples tại `docs/11`. Tất cả các thao tác gán ca, cảnh báo, ghi đè, sao chép tuần và công bố lịch hoạt động chuẩn xác 100%.

---

### GIAI ĐOẠN C (STAGE C): PHÂN HỆ NHÂN SỰ, TỔNG QUAN & CÀI ĐẶT
- **Mục tiêu:** Triển khai Dashboard tổng quan (SCR-02), Danh sách nhân viên + Form + Chi tiết 4 tabs (SCR-03, 04, 05) và màn hình Cài đặt hệ thống (SCR-16).
- **Thời lượng:** 12 giờ làm việc.
- **Phụ thuộc:** Hoàn thành Stage B.

| Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Mô Tả & Tiêu Chí Chấp Nhận |
|:---:|:---|:---:|:---|
| `TSK-C01` | Dashboard Tổng quan (SCR-02) | 3.5h | 4 Thẻ chỉ số quân số, Biểu đồ cột SVG xu hướng 7 ngày, Widget điểm danh nhanh (Check-in/out), Widget duyệt nhanh. |
| `TSK-C02` | Danh sách Nhân viên (SCR-03) | 3.0h | Bảng nhân sự phân trang, tìm kiếm họ tên/mã NV, lọc phòng ban, nút khóa/mở khóa hồ sơ. |
| `TSK-C03` | Modal Thêm/Sửa Nhân viên (SCR-04) | 2.0h | Form nhập liệu 2 cột, validation email/SĐT di động VN. |
| `TSK-C04` | Chi tiết Hồ sơ Nhân viên (SCR-05) | 2.0h | Trang 4 tabs: Thông tin lý lịch, Lịch ca tháng này, Lịch sử chấm công, Quỹ phép năm. |
| `TSK-C05` | Cài đặt Tham số Chính sách (SCR-16) | 1.5h | Toggle chuyển đổi ngưỡng nghỉ 11h vs 12h, chỉnh trần 48h tuần, nút "Reset Demo Data". |

---

### GIAI ĐOẠN D (STAGE D): CHẤM CÔNG, CA LÀM VIỆC, NGHỈ PHÉP & BÁO CÁO
- **Mục tiêu:** Triển khai các màn hình Chấm công (SCR-08, 09), Quản lý mẫu ca (SCR-10), Quản lý nghỉ phép (SCR-13, 14) và Trung tâm báo cáo xuất CSV (SCR-15).
- **Thời lượng:** 16 giờ làm việc.
- **Phụ thuộc:** Hoàn thành Stage C.

| Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Mô Tả & Tiêu Chí Chấp Nhận |
|:---:|:---|:---:|:---|
| `TSK-D01` | Quản lý Mẫu Ca Làm Việc (SCR-10) | 3.0h | Danh sách thẻ ca trực quan (màu sắc, icon, định biên), Modal thêm/sửa mẫu ca. |
| `TSK-D02` | Bảng Tổng Quan Chấm Công (SCR-08) | 3.5h | Giám sát giờ vào/ra thực tế, tính số phút đi muộn, về sớm, lọc theo ngày và phòng ban. |
| `TSK-D03` | Modal Giải Trình Chấm Công (SCR-09) | 2.0h | Form giải trình quên quét thẻ, duyệt đơn cập nhật lại giờ công thực tế. |
| `TSK-D04` | Danh Sách & Duyệt Đơn Nghỉ Phép (SCR-13, 14) | 3.5h | Danh sách đơn phép, Modal tạo đơn mới (kiểm tra quỹ phép), nút duyệt phân cấp đồng bộ sang Lịch tuần SCR-11. |
| `TSK-D05` | Trung Tâm Báo Cáo & Xuất CSV (SCR-15) | 4.0h | 3 Tabs báo cáo (Công tháng, Scheduled vs Actual, Đi muộn/về sớm) kèm nút tải file CSV UTF-8 BOM. |

---

### GIAI ĐOẠN E (STAGE E): ĐÁNH BÓNG GIAO DIỆN, A11Y, KIỂM THỬ QA & TỔNG KẾT
- **Mục tiêu:** Rà soát toàn diện khả năng đáp ứng trên thiết bị di động, kiểm định độ tương phản WCAG 2.1 AA, chạy toàn bộ test suites và đóng gói sản phẩm.
- **Thời lượng:** 8 giờ làm việc.
- **Phụ thuộc:** Hoàn thành Stage D.

| Mã Task | Tên Đầu Mục Công Việc | Thời Lượng | Mô Tả & Tiêu Chí Chấp Nhận |
|:---:|:---|:---:|:---|
| `TSK-E01` | Kiểm thử Responsive & Chế độ Mobile | 3.0h | Kiểm tra giao diện trên Mobile (< 768px): Day Tabs trượt ngang mượt mà; Tablet: co giãn sidebar 80px. |
| `TSK-E02` | Kiểm định Tiếp cận (WCAG 2.1 AA Audit) | 2.0h | Rà soát tiêu điểm bàn phím, Focus trap trên Modal, aria-labels trên toàn bộ các thẻ ca. |
| `TSK-E03` | Rà soát Toàn diện Tính Nhất quán (QA Audit) | 2.0h | Thực thi 100% checklist thủ công trong `docs/14`, kiểm tra nút Reset Demo Data. |
| `TSK-E04` | Tối ưu hóa Build & Tài liệu Bàn giao | 1.0h | Chạy `npm run build`, kiểm tra dung lượng bundle tối ưu, cập nhật README hướng dẫn chạy dev. |

---

## 3. THỨ TỰ ƯU TIÊN VÀ ĐƯỜNG GĂNG RÚT GỌN (CRITICAL PATH FOR LIMITED CAPACITY)

Nếu nguồn lực hoặc thời gian bị giới hạn, dự án phải tuân thủ nghiêm ngặt **Đường găng cốt lõi (Core Critical Path)** để luôn có một sản phẩm demo phân ca hoàn hảo:

```text
ĐƯỜNG GĂNG ƯU TIÊN TUYỆT ĐỐI (MVP CRITICAL PATH):
[Stage 0: Setup] ──> [Stage A: Foundation & Utils] ──> [Stage B: Lịch phân ca SCR-11] ──> [Bàn giao Demo]
     (6h)                         (14h)                                (32h)                  (Tổng: 52h)
```
- **Các tính năng có thể tạm hoãn sang Phase 2 (Nếu thiếu thời gian):**
  - Chế độ xem lịch tháng (B6) $\rightarrow$ Xem lịch tuần là đủ cho 90% nhu cầu vận hành.
  - Form thêm nhân viên chi tiết (SCR-04) $\rightarrow$ Đã có sẵn 25 nhân viên hạt giống để demo.
  - Báo cáo nâng cao đa tiêu chí $\rightarrow$ Tập trung vào chức năng xuất CSV của Bảng lịch tuần.

---

## 4. PHỤ LỤC: DANH MỤC CÁC PROMPT THI CÔNG SẴN SÀNG CHO AGY (READY-TO-PASTE AGY PROMPTS)

*Các prompt dưới đây được thiết kế hoàn chỉnh, đóng gói trong code block để người dùng chỉ cần sao chép và dán trực tiếp vào công cụ `agy`. Prompt yêu cầu agent tự động đọc tài liệu, cấm ghi đè bừa bãi và bắt buộc phải chạy build/test thành công mới được kết thúc.*

---

### Prompt 1: Thi công Giai đoạn 0 (Stage 0 Setup)
```text
Bạn là Senior Frontend Architect. Hãy triển khai GIAI ĐOẠN 0 (STAGE 0) cho dự án Employee Management System tại thư mục `frontend/`.

YÊU CẦU BẮT BUỘC TRƯỚC KHI BẮT ĐẦU:
1. Đọc kỹ các tài liệu thiết kế: `docs/09-frontend-decisions.md`, `docs/10-frontend-architecture-plan.md`, `docs/12-frontend-design-system-and-screens.md`, và `docs/15-frontend-implementation-roadmap.md`.
2. Tạo mới thư mục `frontend/` (sử dụng Vite + React + TypeScript Strict). Cấm xóa hoặc can thiệp vào bất kỳ file nào trong thư mục `docs/`.
3. Cài đặt các gói phụ thuộc: `react-router-dom`, `zustand`, `date-fns`, `@fontsource/be-vietnam-pro`, `@fontsource/inter`, `lucide-react`. Cài đặt devDependencies: `vitest`, `@testing-library/react`, `jsdom`, `@types/node`.
4. Thiết lập cấu hình TypeScript strict 100% (`noImplicitAny: true`), Vite alias `@/` trỏ tới `src/`, và Vitest test runner.
5. Tạo file `src/styles/tokens.css` chứa đầy đủ Design Tokens (Colors đạt chuẩn WCAG 2.1 AA, Typography, Spacing 8pt, Radius, Shadows, Breakpoints) theo đúng đặc tả tại Tài liệu 12.
6. Tạo khung xương thư mục `src/` theo cây thư mục tại Tài liệu 10.

ĐIỀU KIỆN NGHIỆM THU:
- Chạy lệnh `npm run build` bên trong `frontend/` phải thành công 100% với zero lỗi và zero cảnh báo TypeScript.
- Chạy lệnh `npx vitest run` thành công.
```

---

### Prompt 2: Thi công Giai đoạn A (Stage A Foundation & Engine)
```text
Bạn là Senior Frontend Architect. Hãy tiếp tục triển khai GIAI ĐOẠN A (STAGE A) trong thư mục `frontend/`.

YÊU CẦU BẮT BUỘC:
1. Đọc kỹ `docs/10-frontend-architecture-plan.md`, `docs/13-frontend-mock-data-plan.md`, và `docs/14-frontend-test-and-quality-plan.md`.
2. Khai báo 100% Domain Interfaces trong `src/types/domain.types.ts` khớp với Tài liệu 10.
3. Xây dựng các hàm pure utils:
   - `src/utils/date.utils.ts`: Thao tác ngày giờ, offset Thứ Hai tuần hiện tại (`startOfWeek(new Date(), {weekStartsOn: 1})`), format dd/MM/yyyy.
   - `src/utils/schedule-calc.utils.ts`: Tính gross hours, net hours, night hours (22h-06h), ca qua đêm (+1 ngày), tổng giờ kế hoạch tuần.
   - `src/utils/conflict-detector.utils.ts`: Kiểm tra 6 quy tắc BR-001..BR-007 (trùng ca, nghỉ < 11h, vượt 48h, trùng phép, ngày lễ, nhân viên nghỉ việc).
4. Viết các bộ kiểm thử Vitest trong `src/utils/__tests__/` theo đúng danh mục tại Tài liệu 14.
5. Tạo dữ liệu hạt giống xác định trong `src/data/mock/` với 25 nhân viên, 5 phòng ban, 4 mẫu ca chuẩn, lịch tuần này/trước/sau theo Tài liệu 13.
6. Xây dựng `<AppLayout />`, `<Sidebar />` (co giãn 250px/80px), `<Topbar />` (Đồng hồ GMT+7 thực tế) và component `<RoleSwitcher />` chuyển đổi vai trò tức thì qua Zustand.

ĐIỀU KIỆN NGHIỆM THU:
- Chạy `npx vitest run` phải pass 100% tất cả các bài test (tối thiểu 18 test cases).
- Chạy `npm run build` thành công, không có lỗi TypeScript nào.
```

---

### Prompt 3: Thi công Giai đoạn B (Stage B Lịch Phân Ca SCR-11 - CỐT LÕI)
```text
Bạn là Senior Frontend Engineer chuyên về giao diện lịch biểu doanh nghiệp. Hãy triển khai GIAI ĐOẠN B (STAGE B: Core Work Scheduling SCR-11 & SCR-12) trong `frontend/`.

YÊU CẦU BẮT BUỘC:
1. Đọc thật kỹ `docs/11-schedule-screen-specification.md` (Tài liệu chi tiết nhất), `docs/12` và `docs/13`.
2. Xây dựng màn hình `SchedulePage.tsx` và các component con trong `src/features/schedule/`:
   - `<WeeklyGrid />`: Bảng ma trận 8 cột (Sticky column nhân viên, 7 cột thứ Hai đến Chủ Nhật). Ô hiển thị thẻ ca mang màu sắc an toàn WCAG, icon loại ca, nhãn ca và cờ cảnh báo ⚠️.
   - `<GridHeader />`: Hiển thị ngày tháng, định biên nhân sự của ca ngày đó, đánh dấu ngày lễ `[🚩 LỄ]`.
   - `<AssignShiftDrawer />`: Bảng trượt 450px gán/sửa/xóa ca đơn lẻ. Tích hợp chạy Conflict Engine tức thì: báo đỏ chặn lưu nếu trùng ca (BR-001); báo vàng nếu nghỉ < 11h (BR-006) hoặc vượt 48h (BR-004) kèm ô bắt buộc nhập lý do giải trình $\ge 10$ ký tự.
   - `<BulkAssignDialog />`: Gán ca hàng loạt cho nhiều nhân sự.
   - `<CopyWeekDialog />`: Xem trước số ca và sao chép tuần trước sang tuần này với tùy chọn Skip occupied (mặc định) / Replace all.
   - `<PublishConfirmDialog />`: Kiểm tra điều kiện và công bố lịch tuần chính thức (`PUBLISHED`). Chặn công bố nếu có lỗi Mandatory.
   - `<ChangeReasonDialog />` & `<ChangeHistoryDrawer />`: Bắt buộc nhập lý do khi sửa ca trên tuần đã Published, lưu vết vào mảng lịch sử và cho phép mở xem.
   - `<ScheduleFiltersBar />`: Tìm kiếm tên/mã NV (debounce 300ms), lọc chức danh, toggle "Chỉ hiện cảnh báo".
   - `<ScheduleSummaryCards />`: 4 thẻ chỉ số KPI tổng hợp.
   - Nút "Xuất lịch (CSV)": Tải file CSV thực sự với bảng mã UTF-8 BOM.
   - Phím tắt bàn phím: Phím mũi tên di chuyển giữa các ô, `Enter` mở Drawer, `Del` xóa ca, `Escape` đóng popup.
   - Nút "Reset Demo Data" khôi phục dữ liệu ban đầu.

ĐIỀU KIỆN NGHIỆM THU:
- Thử nghiệm thành công 10 kịch bản worked examples trong Tài liệu 11.
- Chạy `npm run build` và `npx vitest run` thành công 100%.
```

---

### Prompt 4: Thi công Giai đoạn C (Stage C Tổng Quan, Nhân Sự & Cài Đặt)
```text
Bạn là Senior Frontend Developer. Hãy triển khai GIAI ĐOẠN C (STAGE C: Dashboard SCR-02, Employees SCR-03/04/05, Settings SCR-16) trong `frontend/`.

YÊU CẦU BẮT BUỘC:
1. Đọc kỹ `docs/12-frontend-design-system-and-screens.md` (Mục 3) và `docs/10`.
2. Triển khai các màn hình trong `src/features/`:
   - `dashboard/DashboardPage.tsx` (SCR-02): 4 Thẻ KPI quân số, Biểu đồ cột SVG xu hướng 7 ngày `<TrendBarChart />`, Widget điểm danh nhanh (Check-in/out kèm đồng hồ đếm giờ làm), Widget duyệt nhanh đơn từ.
   - `employees/EmployeeListPage.tsx` (SCR-03): Bảng nhân viên phân trang, tìm kiếm họ tên/mã NV, lọc phòng ban, nút kích hoạt/khóa tài khoản.
   - `employees/EmployeeDetailPage.tsx` (SCR-05): Chi tiết hồ sơ 4 tabs (Lý lịch, Lịch ca tháng, Bảng công, Nghỉ phép).
   - `employees/components/EmployeeFormModal.tsx` (SCR-04): Modal thêm/sửa nhân viên, validate email và số điện thoại VN.
   - `settings/SettingsPage.tsx` (SCR-16): Toggle chuyển đổi ngưỡng nghỉ ngơi 11 giờ vs 12 giờ, chỉnh giờ trần tuần 48h, nút Reset Demo Data.
3. Đảm bảo điều hướng Router chuyển đổi mượt mà giữa các trang qua Sidebar.

ĐIỀU KIỆN NGHIỆM THU:
- Chuyển vai trò trên Topbar sang Employee: Dashboard đổi sang view cá nhân.
- Chạy `npm run build` thành công.
```

---

### Prompt 5: Thi công Giai đoạn D (Stage D Chấm Công, Ca, Nghỉ Phép & Báo Cáo)
```text
Bạn là Senior Frontend Developer. Hãy triển khai GIAI ĐOẠN D (STAGE D: Attendance SCR-08/09, Shifts SCR-10, Leaves SCR-13/14, Reports SCR-15) trong `frontend/`.

YÊU CẦU BẮT BUỘC:
1. Đọc kỹ `docs/12-frontend-design-system-and-screens.md` (Mục 3) và `docs/04-api-specification.md`.
2. Triển khai các màn hình:
   - `shifts/ShiftTemplatesPage.tsx` (SCR-10): Danh sách mẫu ca trực quan dạng thẻ màu, Modal thêm/sửa ca, cờ ca qua đêm.
   - `attendance/AttendanceOverviewPage.tsx` (SCR-08): Bảng theo dõi giờ check-in, check-out thực tế, tính số phút đi muộn/về sớm, lọc theo ngày.
   - `attendance/components/AttendanceCorrectionModal.tsx` (SCR-09): Đơn giải trình quên check-out, duyệt giải trình cập nhật lại giờ công.
   - `leaves/LeaveRequestsPage.tsx` (SCR-13, SCR-14): Danh sách đơn nghỉ phép, Modal nộp đơn (kiểm tra quỹ phép), nút duyệt phân cấp. Khi duyệt đơn, tự động cập nhật hiển thị thẻ nghỉ phép trên Bảng Lịch tuần SCR-11.
   - `reports/ReportsPage.tsx` (SCR-15): 3 Tabs báo cáo (Tổng hợp công tháng, Đối chiếu Scheduled vs Actual, Đi muộn/về sớm) kèm nút "Xuất file CSV (UTF-8 BOM)".

ĐIỀU KIỆN NGHIỆM THU:
- Duyệt một đơn nghỉ phép mới $\rightarrow$ Bảng lịch tuần SCR-11 xuất hiện ngay thẻ nghỉ phép tương ứng.
- Chạy `npm run build` thành công.
```

---

### Prompt 6: Thi công Giai đoạn E (Stage E Polish, A11y & QA Verification)
```text
Bạn là Senior Frontend QA & Accessibility Engineer. Hãy triển khai GIAI ĐOẠN E (STAGE E: Polish, A11y, Mobile & QA Verification) trong `frontend/`.

YÊU CẦU BẮT BUỘC:
1. Đọc kỹ `docs/14-frontend-test-and-quality-plan.md`.
2. Kiểm tra và tinh chỉnh Responsive trên di động (< 768px):
   - Màn hình Lịch tuần SCR-11 tự động chuyển sang Chế độ bộ chọn thứ dạng Tab trượt ngang (Day Tabs Slider) và danh sách ca theo ngày (Day-by-Day List).
   - Sidebar trên di động chuyển thành Drawer trượt ra khi bấm menu hamburger.
3. Rà soát chuẩn tiếp cận Accessibility (WCAG 2.1 AA):
   - Đảm bảo toàn bộ các Dialog và Drawer có Accessible Focus Trap.
   - Toàn bộ các thẻ ca có thuộc tính `aria-label` chi tiết cho trình đọc màn hình.
   - Bảng điều hướng bằng phím mũi tên hoạt động trơn tru.
4. Chạy toàn bộ Unit Tests và thực thi checklist QA theo Tài liệu 14.
5. Viết tài liệu `frontend/README.md` hướng dẫn chi tiết cách chạy dev server, chạy tests, xuất build và kịch bản demo.

ĐIỀU KIỆN NGHIỆM THU:
- Chạy `npx vitest run` pass 100%.
- Chạy `npm run build` thành công, bundle tối ưu.
- Toàn bộ checklist DoD trong Tài liệu 14 được thỏa mãn.
```

---
*Kết thúc Tài liệu 15.*
