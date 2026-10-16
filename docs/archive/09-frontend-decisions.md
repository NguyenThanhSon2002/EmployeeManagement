# TÀI LIỆU 09: SỔ BỘ QUYẾT ĐỊNH VÀ GIẢ ĐỊNH KIẾN TRÚC FRONTEND
**Dự án:** Employee Management System (Hệ thống Quản lý Nhân sự, Ca làm việc & Chấm công)  
**Phiên bản:** 1.0.0  
**Ngày lập:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline (Frontend Prototype Phase)  

---

## 1. TỔNG QUAN KHẢO SÁT HIỆN TRẠNG DỰ ÁN (DETECTED STATE SUMMARY)

Trước khi tiến hành quy hoạch chi tiết kiến trúc Frontend, hệ thống đã thực hiện quét toàn bộ thư mục dự án `D:\Project\Employee Management` và phát hiện các thành phần sau:

### 1.1. Hiện trạng Mã nguồn & Thư mục
- **Thư mục tài liệu `docs/`:** Đã tồn tại các tài liệu nền tảng từ đợt quy hoạch trước:
  - `docs/00-assumptions-and-decisions.md`: Sổ bộ 15 quyết định kiến trúc tổng thể (DEC-001 đến DEC-015), giả định và bảng thuật ngữ.
  - `docs/01-product-requirements.md`: Yêu cầu sản phẩm (FR-001 đến FR-033, NFR-001 đến NFR-012, RBAC matrix 4 vai trò).
  - `docs/02-ui-ux-specification.md`: Đặc tả giao diện 17 màn hình (SCR-01 đến SCR-17), thiết kế hệ thống màu, luồng người dùng và wireframes ASCII.
  - `docs/03-database-design.md`: Thiết kế CSDL quan hệ 20 bảng (MySQL 8.0, audit columns, snapshotting, optimistic locking).
  - `docs/04-api-specification.md`: Danh mục 42 REST API (API-001 đến API-042), envelops, error catalog.
  - `docs/05-architecture-and-tech-stack.md`: Kiến trúc Modular Monolith (Spring Boot 3.3 package-by-feature).
  - `docs/07-scheduling-business-rules.md`: 18 quy tắc nghiệp vụ xếp ca (BR-001 đến BR-018) và 8 worked examples.
  - `docs/_progress.md`: Bảng theo dõi tiến độ tài liệu ban đầu.
- **Thành phần chưa có trong `docs/`:** `docs/06-development-roadmap.md` và `docs/08-traceability-matrix.md` chưa được hoàn thiện trong đợt trước.
- **Thư mục mã nguồn:** Thư mục `frontend/` chưa được tạo (hoàn toàn phù hợp với ràng buộc HARD CONSTRAINTS của nhiệm vụ lập quy hoạch).
- **Thư mục mẫu thiết kế:** Thư mục `design/` và `design/prototype/` hiện chưa có trong workspace.

### 1.2. Nguồn Chân Lý (Source of Truth) & Nguyên Tắc Kế Thừa
- Toàn bộ nội dung quy hoạch Frontend tại tài liệu này (và các tài liệu từ 10 đến 16) **kế thừa 100%** từ bộ tài liệu nền tảng:
  - **Mã định danh chức năng:** FR-001 đến FR-033.
  - **Mã quy tắc nghiệp vụ:** BR-001 đến BR-018.
  - **Mã màn hình giao diện:** SCR-01 đến SCR-17.
  - **Mã endpoint API:** API-001 đến API-042.
  - **Hệ thống Design Tokens:** Kế thừa bảng màu, token độ tương phản và quy chuẩn bố cục tại `docs/02-ui-ux-specification.md`.
- Các điểm tinh chỉnh chuyên biệt cho giai đoạn **Frontend Prototype độc lập (Mock Data & Client-side Engine)** được ghi nhận chi tiết thành các quyết định `FDEC-xxx` bên dưới.

---

## 2. SỔ BỘ QUYẾT ĐỊNH FRONTEND (FRONTEND DECISION REGISTER - FDEC)

```
SƠ ĐỒ TRUY XUẤT QUYẾT ĐỊNH FRONTEND (FDEC REGISTER)
├── [FDEC-001] Chiến lược Giao diện: Plain CSS Tokens vs Ant Design / MUI
├── [FDEC-002] Thư viện Thời gian: date-fns v3 vs Day.js
├── [FDEC-003] Quản lý Trạng thái: Zustand v4 vs React Context / Redux
├── [FDEC-004] Kiến trúc Bảng Lịch tuần: Custom CSS Grid vs FullCalendar / React Big Calendar
├── [FDEC-005] Phông chữ Ngoại tuyến: @fontsource Be Vietnam Pro & Inter
├── [FDEC-006] Đồ họa Biểu đồ Dashboard: Hand-built Pure SVG Components
├── [FDEC-007] Ngưỡng Cảnh báo Nghỉ ngơi: 11h (Prompt) vs 12h (Luật lao động)
├── [FDEC-008] Quy ước Ca Qua Đêm & Ranh giới Tuần (Sunday-night Spill)
├── [FDEC-009] Hộp thoại Xử lý Sao chép Tuần lên Ô đã có Ca (Skip vs Replace)
├── [FDEC-010] Cơ chế Xuất Báo cáo Client-side: Real CSV Export (UTF-8 BOM)
├── [FDEC-011] Tầng Dữ liệu Mẫu (Mock Repository Layer) tương thích 1-1 với REST API
├── [FDEC-012] Neo Dữ liệu Mẫu theo Thứ Hai Tuần Hiện Tại (Dynamic Monday Offset)
├── [FDEC-013] Quản lý Nhật ký Thay đổi Lịch Đã Công bố (In-memory Audit History)
└── [FDEC-014] Trình Chuyển đổi Vai trò Thị giác (Visual Role Switcher)
```

---

### FDEC-001: Chiến lược Giao diện - Plain CSS với CSS Variables & Design Tokens thay vì UI Component Library nặng
- **Bối cảnh:** Tài liệu kiến trúc toàn diện `docs/00` (DEC-004) đề xuất Ant Design 5.x khi kết nối Backend Spring Boot. Tuy nhiên, trong giai đoạn Prototype tập trung tối đa vào **Ma trận Lịch tuần (Weekly Roster Grid)**, việc kéo theo toàn bộ bundle Ant Design hoặc Material UI tạo ra các vấn đề:
  1. Khó can thiệp layout CSS Grid phức tạp bên trong cell ma trận.
  2. Bị bó buộc vào cơ chế re-render nội bộ của thư viện.
  3. Cần môi trường build nhẹ, độc lập, không phát sinh xung đột CSS-in-JS.
- **So sánh đánh giá:**

| Tiêu chí | Plain CSS + Design Tokens (Được chọn) | Ant Design 5.x | Material UI (MUI v5/v6) | CoreUI React |
|:---|:---|:---|:---|:---|
| **Kích thước Bundle** | **Gần như 0 KB** (Chỉ CSS chuẩn) | Rất lớn (~1.5 MB JS/CSS) | Lớn (~1.2 MB) | Trung bình (~400 KB) |
| **Độ linh hoạt cho Roster Grid** | **100% tự do** (CSS Grid, Subgrid, Flex) | Bị bó cứng trong Antd Table API | Khó tùy biến Cell tùy chỉnh | Bị gò bó theo Bootstrap class |
| **Kiểm soát Design Tokens** | Trực tiếp qua CSS Variables (`:root`) | Qua ConfigProvider theme token | Qua `createTheme()` của Emotion | Qua SCSS override |
| **Thời gian khởi động Vite** | **< 150ms** | ~800ms | ~1200ms | ~500ms |
| **Độ độc lập công nghệ** | Cao nhất, không vendor lock-in | Phụ thuộc Ant Design ecosystem | Phụ thuộc Emotion / MUI engine | Phụ thuộc Bootstrap |

- **Quyết định:** Sử dụng **Plain CSS kết hợp CSS Variables và Hệ thống Design Tokens chuẩn** (tương thích mã màu và kiểu dáng tại `docs/02-ui-ux-specification.md`). Toàn bộ các UI component cơ bản (Button, Modal, Drawer, Toast, Badge, Select, Table) được xây dựng dưới dạng các component React tinh gọn, thuần túy ngữ nghĩa HTML5.
- **Lý do & Đánh đổi:**
  - *Ưu điểm:* Tốc độ tải và Fast Refresh cực nhanh; toàn quyền kiểm soát CSS Grid của bảng lịch tuần; không có rủi ro xung đột version thư viện. Dễ dàng chuyển giao cho lập trình viên Java học frontend nắm vững bản chất CSS/DOM.
  - *Đánh đổi:* Phải tự xây dựng các component cơ bản (Button, Dialog, Toast, Select) thay vì dùng sẵn; tuy nhiên các component này đều được đặc tả chi tiết trong `docs/12`.
- **Tác động:** Mã nguồn frontend trong sáng, style được tổ chức trong thư mục `src/styles/tokens.css` và CSS Modules/BEM class.
- **Cách thay đổi sau này:** Nếu sau này dự án chuyển sang tích hợp Ant Design theo DEC-004, các component giao diện cơ bản trong `src/components/ui/` chỉ cần thay thế phần ruột bằng component Antd tương ứng mà không làm thay đổi các trang nghiệp vụ.

---

### FDEC-002: Thư viện Xử lý Thời gian - `date-fns` v3 thay vì `dayjs`
- **Bối cảnh:** Tài liệu `docs/00` (DEC-009) nhắc tới Day.js. Tuy nhiên trong ngữ cảnh lập trình React với TypeScript hiện đại và các thuật toán tính toán lịch biểu tuần (cộng trừ ngày, tính khoảng cách giữa 2 ca, lấy thứ Hai đầu tuần, so sánh dải thời gian), `date-fns` có ưu thế vượt trội:
- **So sánh đánh giá:**

| Tiêu chí | `date-fns` v3 (Được chọn) | `dayjs` | Moment.js |
|:---|:---|:---|:---|
| **Mô hình lập trình** | **Pure Functions (Hàm thuần túy)** | Object wrapper (OOP-like) | Mutable Object (Cũ, cấm dùng) |
| **Tính bất biến (Immutability)** | Tuyệt đối (nhận Date, trả về Date mới) | Hỗ trợ qua plugin | Dễ đột biến dữ liệu gây bug |
| **Tree-shaking** | **100% Tree-shakable** (import hàm nào tải hàm đó) | Tốt nhưng cần quản lý plugin | Kém (kéo toàn bộ thư viện) |
| **Hỗ trợ TypeScript** | First-class, kiểu dữ liệu Date chuẩn JS | Tốt qua `@types/dayjs` | Kém |
| **Bản địa hóa tiếng Việt** | Có sẵn `date-fns/locale/vi` chuẩn xác | Có `dayjs/locale/vi` | Có locale vi |

- **Quyết định:** Sử dụng **`date-fns` v3** làm thư viện thao tác ngày giờ chính thức cho Frontend.
- **Lý do:** Đối tượng thời gian xuyên suốt ứng dụng luôn là kiểu nguyên bản `Date` của JavaScript, không bị bọc (wrap) qua custom class. Các hàm nghiệp vụ xếp ca là pure functions dễ viết Unit Test với Vitest.
- **Tác động:** Mọi module thao tác thời gian gọi trực tiếp từ `date-fns` (`startOfWeek`, `endOfWeek`, `addDays`, `differenceInMinutes`, `format`, `parseISO`).
- **Cách thay đổi sau này:** Cung cấp lớp bọc tiện ích tại `src/utils/date.utils.ts`. Nếu sau này chuyển sang Day.js, chỉ cần sửa logic trong file util này.

---

### FDEC-003: Quản lý Trạng thái Ứng dụng - Zustand v4+ thay vì React Context + useReducer
- **Bối cảnh:** Cần một giải pháp quản lý trạng thái chia sẻ giữa các trang (danh sách phân ca tuần, danh sách nhân viên, bộ lọc phòng ban, trạng thái lịch draft/published, cấu hình demo).
- **So sánh đánh giá:**

| Tiêu chí | Zustand v4+ (Được chọn) | React Context + useReducer | Redux Toolkit |
|:---|:---|:---|:---|
| **Boilerplate Code** | **Cực kỳ tối giản** (~15 dòng tạo store) | Trung bình (cần Provider, Reducer, Dispatch) | Nặng (Slices, Thunks, Store) |
| **Hiệu năng Render ma trận** | **Tối ưu tuyệt đối** (Selector re-render đúng ô đổi) | **Kém**: Đổi 1 ô khiến toàn bộ bảng 25 nhân viên render lại | Tối ưu bằng Selector |
| **Hỗ trợ ngoài React Hook** | Có thể đọc/ghi ngoài React component (trong util/mock) | Không, bắt buộc phải nằm trong component tree | Có thể gọi store trực tiếp |
| **Dung lượng thư viện** | **~1.1 KB** (Siêu nhẹ) | 0 KB (Có sẵn trong React) | ~11 KB |
| **Mức độ dễ học cho Java Dev** | Rất trực quan, giống như một Service singleton | Dễ nhầm lẫn giữa render và dispatch | Phức tạp, nhiều khái niệm trừu tượng |

- **Quyết định:** Sử dụng **Zustand v4+** làm State Management chính thức cho toàn bộ ứng dụng prototype.
- **Lý do:** Ma trận lịch tuần chứa hàng trăm ô dữ liệu (25 nhân viên x 7 ngày = 175 ô). Với React Context, bất kỳ thao tác đổi 1 ca nào cũng kích hoạt re-render toàn bộ 175 ô. Zustand hỗ trợ Atomic Selectors (`useScheduleStore(state => state.assignments[empId])`), chỉ re-render duy nhất ô hoặc hàng bị thay đổi, đảm bảo tốc độ 60fps mượt mà.
- **Tác động:** Tạo các stores: `useAuthStore`, `useScheduleStore`, `useEmployeeStore`, `useAttendanceStore`, `useLeaveStore`, `useSettingsStore`.
- **Cách thay đổi sau này:** Khi kết nối Backend thật, các store này có thể chuyển giao trạng thái server-state cho TanStack Query v5 theo đúng kiến trúc của DEC-003 mà không làm xáo trộn cấu trúc component.

---

### FDEC-004: Kiến trúc Bảng Lịch tuần - Custom CSS Grid thay vì Thư viện Lịch có sẵn
- **Bối cảnh:** Yêu cầu trọng tâm của hệ thống là hiển thị ma trận phân ca: **Hàng = Nhân viên (Resources)**, **Cột = 7 ngày trong tuần**.
- **So sánh đánh giá:**

| Tiêu chí | Custom CSS Grid (Được chọn) | FullCalendar (Resource Timeline) | React Big Calendar |
|:---|:---|:---|:---|
| **Mô hình Resource Matrix** | **100% khớp**: Hàng nhân viên, Cột ngày | Rất tốt nhưng đòi hỏi gói **Premium License ($480+)** | Không hỗ trợ Resource Timeline tự nhiên |
| **Chi phí bản quyền** | **0 VNĐ (Open Source, Tự do thương mại)** | Tốn phí bản quyền doanh nghiệp hàng năm | Miễn phí (MIT) |
| **Tùy biến Thẻ ca & Cảnh báo** | Toàn quyền kiểm soát thẻ ca, icon, badge cảnh báo | Phải can thiệp qua render hooks phức tạp | Tùy biến giới hạn |
| **Khả năng ảo hóa (Virtualization)**| Dễ dàng cắm `@tanstack/react-virtual` khi > 100 nhân sự | Tự xử lý nhưng tiêu tốn DOM lớn | Khó tích hợp ảo hóa hàng |
| **Điều hướng bàn phím (A11y)**| Tự do thiết lập ARIA grid, phím mũi tên chuyển ô | Tuân thủ tốt nhưng khó can thiệp phím tắt riêng | Hạn chế |

- **Quyết định:** Xây dựng **Custom Weekly Roster Grid** bằng **CSS Grid + Flexbox**.
- **Lý do:** Khẳng định lại và hiện thực hóa quyết định DEC-005 từ `docs/00`. Tránh hoàn toàn chi phí bản quyền, kiểm soát 100% trải nghiệm người dùng theo đúng chuẩn nghiệp vụ Việt Nam.

---

### FDEC-005: Phông chữ Ngoại tuyến - `@fontsource/be-vietnam-pro` và `@fontsource/inter`
- **Bối cảnh:** Hệ thống vận hành tại doanh nghiệp có thể triển khai trên mạng nội bộ (On-premise / Private Intranet) không có kết nối Internet ra Google Fonts. Cần đảm bảo phông chữ hiển thị tiếng Việt hoàn hảo, không lệch dấu, không phụ thuộc CDN bên ngoài.
- **Quyết định:** Cài đặt các gói font ngoại tuyến qua npm: `@fontsource/be-vietnam-pro` (cho tiêu đề, hiển thị thương hiệu Việt) và `@fontsource/inter` (cho dữ liệu bảng, số liệu, giờ ca).
- **Lý do:** Tự chủ 100% tài nguyên mạng, load font tức thì từ local bundle, không phát sinh lỗi Flash of Unstyled Text (FOUT).

---

### FDEC-006: Đồ họa Biểu đồ Dashboard - Hand-built Pure SVG Components
- **Bối cảnh:** Màn hình Tổng quan (SCR-02) và Báo cáo (SCR-15) cần hiển thị biểu đồ xu hướng đi làm 7 ngày (tỷ lệ đúng giờ, đi muộn, vắng mặt) và thanh tỷ lệ giờ làm việc thực tế so với kế hoạch.
- **Quyết định:** Xây dựng các component biểu đồ bằng **SVG thuần túy (Hand-built SVG)**:
  - `<TrendBarChart />`: Biểu đồ cột SVG hiển thị 7 ngày.
  - `<DonutRatioChart />`: Biểu đồ tròn/donut SVG hiển thị tỷ lệ có mặt/vắng mặt hôm nay.
  - `<ProgressBar />`: Thanh tiến độ % giờ làm việc theo kế hoạch.
- **Lý do:**
  - Không kéo thêm thư viện chart nặng nề (Recharts, Chart.js) vào bundle prototype.
  - Zero hydration mismatch, tính toán kích thước co giãn (responsive) cực kỳ chính xác qua thuộc tính `viewBox`.
  - Style trực tiếp màu sắc qua CSS variables của hệ thống Design Tokens.

---

### FDEC-007: Cấu hình Tham số Cảnh báo & Ngưỡng Nghỉ ngơi - 11 giờ vs 12 giờ
- **Bối cảnh & Xung đột:**
  - Trong yêu cầu đề bài của Prompt: "Thresholds: daily warning > 12h, weekly warning > 48h, minimum rest between shifts 11h, late grace 5 minutes".
  - Trong tài liệu `docs/00` (DEC-010) và `docs/07` (BR-006): Giá trị tham chiếu theo Điều 110 Bộ luật Lao động 2019 là **12 giờ**.
- **Quyết định:**
  - Thiết lập giá trị mặc định trong file cấu hình demo `src/data/mock/settings.mock.ts` là **11.0 giờ** theo đúng yêu cầu prompt (`MIN_REST_BETWEEN_SHIFTS_HOURS = 11.0`).
  - Đồng thời, trên màn hình Cài đặt Demo (SCR-16), cung cấp ô điều chỉnh cho phép người dùng chuyển đổi linh hoạt giữa 11 giờ và 12 giờ để minh họa tính tùy biến của hệ thống chính sách.
- **Tác động:** Engine kiểm tra xung đột client-side đọc ngưỡng này từ `useSettingsStore`.
- **Cách thay đổi sau này:** Quản trị viên chỉ cần đổi giá trị trong `system_settings` mà không phải sửa mã nguồn.

---

### FDEC-008: Quy ước Ca Qua Đêm & Ranh giới Tuần (Overnight & Sunday-night Spill)
- **Bối cảnh:** Ca qua đêm (ví dụ: 22:00 Thứ Hai đến 06:00 Thứ Ba, hoặc 22:00 Chủ Nhật đến 06:00 Thứ Hai tuần sau). Cần thống nhất cách gán ô, tính giờ và kiểm tra xung đột.
- **Quyết định:**
  1. **Quy tắc hiển thị ô:** Ca qua đêm hoàn toàn thuộc về **ngày bắt đầu ca (Start Date)**. Ví dụ ca đêm bắt đầu tối Thứ Hai hiển thị tại ô Thứ Hai, có nhãn biểu thị `Ca Đêm (+1 ngày)`.
  2. **Quy tắc tính giờ tuần:** Toàn bộ số giờ làm việc (ví dụ 8.0 giờ) được tính **01 lần duy nhất vào ngày bắt đầu và tuần bắt đầu**.
  3. **Quy tắc tràn ranh giới tuần (Sunday-night Spillover):** Một ca làm việc bắt đầu tối Chủ Nhật tuần này (22:00 Chủ Nhật đến 06:00 Thứ Hai tuần sau) chỉ được tính giờ vào tuần hiện tại, nhưng thời gian từ 00:00 đến 06:00 sáng Thứ Hai tuần kế tiếp **bắt buộc phải tham gia vào thuật toán kiểm tra Trùng ca (BR-001) và Thời gian nghỉ ngơi (BR-006)** của ca sáng Thứ Hai tuần kế tiếp.
- **Lý do:** Bảo vệ sức khỏe người lao động, không để xảy ra kẽ hở quản lý khi xếp ca đêm Chủ Nhật rồi tiếp tục xếp ca sáng Thứ Hai lúc 07:00 (chỉ nghỉ 1 tiếng).

---

### FDEC-009: Hộp thoại Xử lý Sao chép Tuần lên Ô đã có Ca (Skip vs Replace)
- **Bối cảnh:** Khi người quản lý nhấn nút "Sao chép từ tuần trước" sang tuần hiện tại, tuần hiện tại có thể đã có một số ca được xếp trước đó hoặc có đơn nghỉ phép đã duyệt.
- **Quyết định:** Trước khi thực hiện sao chép, hệ thống mở Modal xem trước (Preview Modal) hiển thị:
  - Tổng số ca nguồn ở tuần trước: $N_{source}$.
  - Số ô đang trống ở tuần hiện tại: $N_{empty}$.
  - Số ô đã có ca hoặc có nghỉ phép: $N_{occupied}$.
  - Cung cấp 3 lựa chọn hành động:
    1. **Bỏ qua các ô đã có ca (Mặc định - Skip occupied cells):** Giữ nguyên các ca đã xếp và các đơn phép, chỉ điền ca tuần trước vào các ô trống.
    2. **Ghi đè toàn bộ (Replace all):** Xóa toàn bộ các ca hiện tại ở tuần đích và thay thế bằng ca tuần trước (giữ nguyên đơn nghỉ phép đã duyệt).
    3. **Hủy thao tác (Cancel).**

---

### FDEC-010: Cơ chế Xuất Báo cáo Client-side - Real CSV Export với UTF-8 BOM
- **Bối cảnh:** Giai đoạn Prototype chạy thuần túy phía Client, không có backend Java để chạy Apache POI xuất file Excel `.xlsx`.
- **Quyết định:** Xây dựng tiện ích xuất file CSV thực thụ chạy hoàn toàn trên trình duyệt:
  - Tự động chèn ký tự Byte Order Mark của UTF-8 (`\uFEFF`) vào đầu chuỗi nội dung.
  - Xử lý bao đóng dấu ngoặc kép `""` cho các ô chứa dấu phẩy, dấu chấm phẩy hoặc ký tự xuống dòng.
  - Sử dụng Blob và thẻ `<a download="..."/>` để kích hoạt trình duyệt tải file về máy tính.
- **Lý do:** UTF-8 BOM giúp phần mềm Microsoft Excel tại Việt Nam tự động nhận diện bảng mã tiếng Việt mà không bị lỗi hiển thị ký tự có dấu (mojibake). Thao tác tải file hoạt động 100% offline.

---

### FDEC-011: Thiết kế Tầng Dữ liệu Mẫu (Mock Repository Layer) Tương thích REST
- **Bối cảnh:** Giai đoạn prototype cần hoạt động mượt mà với mock data, nhưng mục tiêu dài hạn là kết nối với backend Spring Boot (42 APIs trong `docs/04`). Nếu viết mock data phân tán trực tiếp trong component React, khi chuyển sang backend thật sẽ phải đập đi viết lại toàn bộ giao diện.
- **Quyết định:** Áp dụng mẫu thiết kế **Repository / Service Interface Pattern**:
  - Mọi thao tác truy xuất dữ liệu từ giao diện chỉ được gọi thông qua các hàm Service Interface (ví dụ: `scheduleService.getWeeklyRoster(deptId, startDate)`).
  - Triển khai phiên bản `MockScheduleService` thao tác trên bộ nhớ In-Memory Store và `localStorage`.
  - Giả lập độ trễ mạng thực tế (Network Latency: 150ms - 300ms) thông qua `Promise` và `setTimeout` để kiểm tra trạng thái Loading/Skeleton.
- **Lý do:** Khi backend Spring Boot hoàn thành, chỉ cần tạo `RestScheduleService` (gọi Axios/Fetch) và hoán đổi cấu hình dependency injection mà không cần sửa bất kỳ dòng mã nào trong component giao diện.

---

### FDEC-012: Cơ chế Neo Dữ liệu Mẫu theo Thứ Hai Tuần Hiện Tại (Dynamic Monday Offset)
- **Bối cảnh:** Nếu seed dữ liệu ca làm việc với các ngày cố định (ví dụ `2026-10-12`), khi lập trình viên mở ứng dụng vào tháng sau hoặc năm sau, nút "Tuần này" và nút "Hôm nay" sẽ rơi vào tuần trống không có dữ liệu, làm giảm trải nghiệm demo.
- **Quyết định:** Xây dựng cơ chế sinh dữ liệu mẫu động:
  - Xác định mốc `CurrentMonday = startOfWeek(new Date(), { weekStartsOn: 1 })`.
  - Toàn bộ dữ liệu ca làm việc, chấm công, nghỉ phép được sinh bằng các hàm offset: `addDays(CurrentMonday, offset)`.
  - Seed đầy đủ 3 tuần liên tiếp: Tuần trước (`CurrentMonday - 7 ngày`), Tuần này (`CurrentMonday`), Tuần sau (`CurrentMonday + 7 ngày`).
- **Lý do:** Bất kỳ ngày nào mở ứng dụng lên, tuần hiện tại luôn có dữ liệu sống động, nút "Hôm nay" luôn trỏ tới ngày có dữ liệu thật.

---

### FDEC-013: Quản lý Nhật ký Thay đổi Lịch Đã Công bố (In-memory Change History)
- **Bối cảnh:** Theo quy tắc BR-015, khi lịch ở trạng thái `PUBLISHED`, mọi thao tác sửa đổi ca làm việc bắt buộc phải có lý do giải trình.
- **Quyết định:**
  - Khi người dùng sửa/xóa/gán ca trên tuần đã `PUBLISHED`, hệ thống hiển thị Dialog bắt buộc nhập "Lý do thay đổi" (`change_reason`, tối thiểu 5 ký tự).
  - Lưu bản ghi thay đổi vào mảng `scheduleChangeHistory` trong Zustand store (lưu `id`, `scheduleId`, `employeeId`, `workDate`, `actionType`, `oldShift`, `newShift`, `reason`, `changedAt`, `changedByRole`).
  - Trên thanh công cụ Bảng lịch tuần, cung cấp nút "Lịch sử thay đổi (N)" mở Drawer xem danh sách các lần chỉnh sửa của tuần đó.

---

### FDEC-014: Trình Chuyển đổi Vai trò Thị giác (Visual Role Switcher)
- **Bối cảnh:** Giai đoạn prototype chưa có backend xác thực JWT. Cần cho phép người kiểm thử dễ dàng trải nghiệm góc nhìn của cả 3 nhóm vai trò: Quản trị viên/Nhân sự (Admin/HR), Trưởng bộ phận (Department Manager), và Nhân viên thông thường (Employee).
- **Quyết định:**
  - Đặt một component `<RoleSwitcher />` nổi bật trên Top Navigation Bar.
  - Dropdown cho phép chọn ngay 3 vai trò:
    1. **Quản trị viên / Nhân sự (Admin / HR):** Toàn quyền xem và chỉnh sửa tất cả phòng ban, cấu hình mẫu ca, cài đặt hệ thống.
    2. **Trưởng bộ phận (Department Manager):** Toàn quyền lập lịch, công bố lịch, duyệt đơn của Phòng Vận hành; các nút xóa nhân viên hoặc cấu hình hệ thống bị vô hiệu hóa hoặc ẩn.
    3. **Nhân viên (Employee):** Chỉ xem lịch cá nhân ở trạng thái Published, bấm Check-in/Check-out, gửi đơn nghỉ phép/giải trình; Bảng lịch tuần bị khóa chế độ chỉ xem (Read-only) hoặc chuyển sang SCR-17.

---

## 3. CÁC GIẢ ĐỊNH VÀ GIẢI QUYẾT XUNG ĐỘT VỚI TÀI LIỆU CŨ (CONFLICT RESOLUTION)

| Vấn đề / Khía cạnh | Quy định trong Tài liệu Cũ (`docs/00 - 05`) | Quyết định trong Quy hoạch Frontend này (`docs/09 - 16`) | Lý do & Biện pháp Giải quyết Xung đột |
|:---|:---|:---|:---|
| **Thư viện UI chính** | Ant Design 5.x (`docs/00` DEC-004) | Plain CSS với Design Tokens (`FDEC-001`) | **Giải quyết:** Giai đoạn prototype ưu tiên độ mượt mà của Custom Grid và không vendor lock-in. Thiết kế Tokens tuân thủ 100% mã màu và spacing của Ant Design để sau này tích hợp không bị lệch giao diện. |
| **Thư viện Ngày giờ** | Day.js (`docs/00` DEC-009) | `date-fns` v3 (`FDEC-002`) | **Giải quyết:** `date-fns` hoạt động trên `Date` chuẩn, pure functions dễ test. Lớp bọc `date.utils.ts` cách ly thư viện với component. |
| **Quản lý State** | TanStack Query cho server state (`docs/00` DEC-003) | Zustand store (`FDEC-003`) cho prototype | **Giải quyết:** Giai đoạn này không có server thật. Zustand đóng vai trò In-memory Database phía client. Khi có REST API, TanStack Query sẽ thay thế các selector của Zustand. |
| **Ngưỡng nghỉ giữa 2 ca** | 12.0 giờ (`docs/00` DEC-010, `docs/07` BR-006) | 11.0 giờ mặc định (`FDEC-007`) | **Giải quyết:** Ưu tiên mặc định 11.0h theo yêu cầu prompt; cấu hình động trong `DemoSettings` cho phép đổi thành 12.0h để demo tuân thủ BLLĐ 2019. |
| **Thư viện Biểu đồ** | Recharts (`docs/05`) | Hand-built SVG Charts (`FDEC-006`) | **Giải quyết:** Tránh kéo thêm package nặng cho prototype. Đồ họa SVG thuần túy nhẹ hơn và linh hoạt tuyệt đối. |

---

## 4. MA TRẬN RỦI RO KỸ THUẬT VÀ BIỆN PHÁP GIẢM THIỂU (TECHNICAL RISKS & MITIGATION)

| Mã Rủi ro | Mô tả Rủi ro Kỹ thuật | Mức độ | Biện pháp Phòng ngừa & Giải pháp Kỹ thuật trong Bản thiết kế |
|:---:|:---|:---:|:---|
| **RSK-01** | **Hiệu năng Render Ma trận lớn (300 NV x 31 ngày = 9,300 ô):** Gây giật lag, đơ trình duyệt nếu re-render toàn bộ. | **CAO** | 1. Tách cấu trúc component: Mỗi Cell là một React Memoized Component (`React.memo`).<br>2. Lưu trữ dữ liệu phân ca theo chỉ mục Map (`Map<string, ShiftAssignment>` với key `${employeeId}_${date}`).<br>3. Chuẩn bị sẵn cơ chế ảo hóa hàng (`TanStack Virtual`) khi danh sách nhân viên vượt quá 50 người. |
| **RSK-02** | **Độ trễ khi chạy Engine Kiểm tra Xung đột trên Client:** Kiểm tra 6 quy tắc cho hàng trăm ca mỗi khi gán ca có thể gây chậm UI. | **TRUNG BÌNH** | 1. Phân loại kiểm tra cục bộ: Chỉ kiểm tra xung đột trên tập ca của nhân viên được gán và các ca lân cận trong khoảng $\pm 1$ ngày, độ phức tạp $O(K)$ với $K \le 5$.<br>2. Chỉ chạy toàn diện kiểm tra cả tuần khi người dùng bấm "Công bố lịch". |
| **RSK-03** | **Lệch Múi giờ và Ngày tháng do Local Browser Timezone:** Người dùng mở trình duyệt ở múi giờ khác GMT+7 bị lệch ngày phân ca. | **TRUNG BÌNH** | 1. Chuẩn hóa chuỗi ngày lịch luôn là dạng `YYYY-MM-DD` (không kèm giờ) cho các thuộc tính `work_date`.<br>2. Ép buộc mốc giờ ca theo múi giờ `Asia/Ho_Chi_Minh` bằng các hàm util định dạng thống nhất trong `date.utils.ts`. |
| **RSK-04** | **Mất dữ liệu Demo khi người dùng bấm F5 (Reload):** Trải nghiệm demo bị gián đoạn nếu toàn bộ ca vừa gán bị mất sau khi tải lại trang. | **THẤP** | Tích hợp cơ chế tự động đồng bộ Zustand store vào `localStorage` (`persist` middleware). Cung cấp nút bấm rõ ràng "Khôi phục dữ liệu mẫu ban đầu (Reset Demo Data)" trên Topbar. |
| **RSK-05** | **Xung đột Đồng bộ Trạng thái Chéo Trang:** Duyệt đơn nghỉ phép ở trang SCR-13 nhưng Bảng lịch tuần SCR-11 không cập nhật thẻ nghỉ phép. | **THẤP** | Sử dụng Zustand Shared Store tập trung. Khi action `approveLeaveRequest` được kích hoạt, store tự động cập nhật cả lát cắt `leaves` và tính toán lại danh sách `conflicts` của `schedules`. |

---

## 5. CÁC CÂU HỎI MỞ VÀ KHUYẾN NGHỊ HÀNH ĐỘNG (OPEN QUESTIONS & RECOMMENDATIONS)

Dưới đây là các câu hỏi mang tính định hướng sản phẩm cần xác nhận từ Product Owner / Ban Giám đốc trong các giai đoạn tiếp theo. Mọi câu hỏi đều đã được đưa ra khuyến nghị xử lý an toàn, **không làm gián đoạn tiến độ triển khai hiện tại**:

### OQ-FE-001: Có nên tự động lưu bản nháp vào LocalStorage khi người quản lý đang xếp dở lịch tuần?
- **Khuyến nghị của Tech Lead:** **CÓ (Nên áp dụng ngay)**. Khi người quản lý gán 20 ca mà chưa bấm công bố, nếu vô tình đóng tab hoặc mất điện, việc lưu trạng thái vào `localStorage` sẽ giúp phục hồi nguyên trạng phiên làm việc, tránh bức xúc cho người dùng.

### OQ-FE-002: Có cần tính năng Kéo - Thả (Drag-and-Drop) ca làm việc trong giai đoạn sau không?
- **Khuyến nghị của Tech Lead:** **GIAI ĐOẠN 2 (Future Scope)**. Thao tác click vào ô và mở Drawer chọn ca hiện tại là phương án tiếp cận ổn định, dễ hỗ trợ điều hướng bàn phím (Accessibility) và chạy tốt trên màn hình cảm ứng máy tính bảng. Cấu trúc DOM của Cell sẽ được thiết kế sẵn sàng để tích hợp thư viện `@dnd-kit` trong giai đoạn tiếp theo.

### OQ-FE-003: Có cho phép nhân viên tự tạo yêu cầu Đổi ca (Shift Swap Request) cho nhau trên giao diện không?
- **Khuyến nghị của Tech Lead:** **GIAI ĐOẠN 2 (Future Scope)**. Trong giai đoạn MVP và Prototype này, quyền điều phối ca làm việc tập trung hoàn toàn vào Trưởng bộ phận và HR để đảm bảo kỷ luật lao động và kiểm soát giờ tăng ca.

---
*Kết thúc Tài liệu 09.*
