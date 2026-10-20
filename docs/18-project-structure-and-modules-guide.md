# TÀI LIỆU CẤU TRÚC THƯ MỤC & CÁC MODULE DỰ ÁN HRMS
*(Human Resource Management & Shift Scheduling System)*

**Tài liệu mã số:** `DOC-18`  
**Ngày cập nhật:** 16/10/2026  
**Phiên bản:** 2.0 (Synchronized Feature-Driven Architecture)  
**Trạng thái:** Chính thức (Official Architecture Reference)  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Dự án **Employee Management & Shift Scheduling System** là giải pháp phần mềm quản lý nhân sự, ma trận xếp ca làm việc thông minh và chấm công tuân thủ **Bộ Luật Lao Động Việt Nam 2019**. Hệ thống được xây dựng theo kiến trúc hiện đại, tách biệt hoàn toàn giữa Frontend và Backend, giao tiếp thông qua RESTful API chuẩn mực.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT: REACT 19 + TYPESCRIPT + VITE                     │
│  - Feature-Driven Architecture (Collocation: Component, API, Store)        │
│  - Dual-Mode: Browser (Real REST API Proxy) | Test (Isolated Memory Mock)   │
│  - State: Zustand (Micro-stores per feature + Shared Auth & UI)             │
│  - UI: Vanilla CSS Tokens, Lucide Icons, WCAG 2.1 AA Accessibility          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON (JWT Bearer Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVER: SPRING BOOT 3.3.4 (JAVA 21 LTS)                  │
│  - Package-by-Feature Modular Monolith                                      │
│  - Stateless Security (JWT Access & Refresh Token, RBAC @PreAuthorize)      │
│  - Conflict Detection Engine (8 Vietnamese Labor Law Rules: BR-001 -> 008)  │
│  - JPA / Hibernate 6 (Optimistic Locking @Version, Soft Delete)             │
│  - Apache POI (Excel .xlsx Export) & RFC-4180 UTF-8 BOM CSV Streaming      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JDBC / TCP 3306
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE: MYSQL 8.0 (hrms_db)                       │
│  - Flyway Migrations (V1 Schema, V2 Master Data, V3 Users & RBAC)           │
│  - 17 Relational Tables with Foreign Key Constraints & Audit Trails         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SƠ ĐỒ CÂY THƯ MỤC TOÀN BỘ DỰ ÁN

```text
D:\Project\Employee Management\
├── backend/                       # Phân hệ Máy chủ Backend (Spring Boot 3.3.4, Java 21 LTS)
│   ├── Dockerfile                 # Multi-stage build Maven + Eclipse Temurin 21 JRE
│   ├── pom.xml                    # Quản lý Maven dependencies và build plugins
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/company/hrms/
│   │   │   │   ├── HrmsApplication.java     # Lớp khởi chạy chính (Spring Boot Entry Point)
│   │   │   │   ├── common/                  # Kiến trúc hạ tầng dùng chung (Cross-cutting Concerns)
│   │   │   │   │   ├── audit/               # Tự động ghi nhận created_by, updated_by (AuditAwareImpl)
│   │   │   │   │   ├── entity/              # BaseAuditableEntity (@Version, Soft Delete, Timestamps)
│   │   │   │   │   ├── exception/           # BusinessException, ResourceNotFoundException, GlobalExceptionHandler
│   │   │   │   │   ├── response/            # ApiResponse<T>, PageResponse<T> chuẩn hóa REST payload
│   │   │   │   │   └── util/                # DateTimeUtils (chuẩn hóa múi giờ, định dạng ngày giờ)
│   │   │   │   ├── security/                # Phân hệ An ninh & Xác thực Stateless JWT
│   │   │   │   │   ├── config/              # SecurityConfig (SecurityFilterChain, CORS, BCrypt)
│   │   │   │   │   ├── jwt/                 # JwtTokenProvider, JwtAuthenticationFilter
│   │   │   │   │   └── service/             # UserPrincipal, CustomUserDetailsService
│   │   │   │   └── modules/                 # 10 Module nghiệp vụ chính (Package-by-Feature)
│   │   │   │       ├── auth/                # Xác thực, cấp phát Access Token & Refresh Token
│   │   │   │       ├── department/          # Danh mục phòng ban & cây phân cấp tổ chức
│   │   │   │       ├── position/            # Danh mục chức danh, vị trí việc làm
│   │   │   │       ├── employee/            # Quản lý hồ sơ nhân sự, phân trang, Optimistic Lock
│   │   │   │       ├── shift/               # Danh mục mẫu ca làm việc chuẩn & cờ qua đêm
│   │   │   │       ├── schedule/            # Xếp ca tuần & Conflict Detection Engine (8 rules BLLĐ)
│   │   │   │       ├── attendance/          # Chấm công, tính giờ công đêm & giải trình quẹt thẻ
│   │   │   │       ├── leave/               # Quản lý danh mục phép, sổ cái quỹ phép & duyệt đơn
│   │   │   │       ├── setting/             # Cấu hình tham số động hệ thống theo luật lao động
│   │   │   │       └── report/              # Xuất báo cáo Excel Apache POI & CSV UTF-8 BOM
│   │   │   └── resources/
│   │   │       ├── application.yml          # Cấu hình CSDL MySQL, JPA Hibernate, JWT, Port 8080
│   │   │       ├── application-dev.yml      # Cấu hình profile môi trường phát triển
│   │   │       └── db/migration/            # Quản lý phiên bản CSDL Flyway
│   │   │           ├── V1__init_schema.sql  # Khởi tạo toàn bộ 17 bảng quan hệ và khóa ngoại FK
│   │   │           ├── V2__seed_master_data.sql # Dữ liệu mẫu (ca làm, phòng ban, ngày lễ công ty)
│   │   │           └── V3__seed_admin_user.sql  # Tài khoản mẫu admin, manager, employee
│   │   └── test/java/com/company/hrms/      # 36 bài kiểm thử tích hợp (Spring Boot Test, 100% Pass)
│   └── target/                              # Thư mục build artifact (JAR)
│
├── frontend/                      # Phân hệ Giao diện Người dùng (React 19, TypeScript, Vite)
│   ├── Dockerfile                 # Multi-stage build Node 20 + Nginx Alpine
│   ├── nginx.conf                 # Cấu hình reverse proxy /api/ và SPA fallback
│   ├── package.json               # Khai báo dependencies (React 19, Zustand, Lucide, Vitest)
│   ├── vite.config.ts             # Thiết lập Vite server & Proxy reverse (/api -> 127.0.0.1:8080 kèm error handling & cấu hình Vitest)
│   ├── tsconfig.json              # Thiết lập TypeScript Strict Mode
│   ├── .env.development           # Biến môi trường dev (VITE_USE_MOCK=false)
│   ├── .env.production            # Biến môi trường production
│   ├── index.html                 # HTML template tải phông chữ Be Vietnam Pro & Inter
│   └── src/
│       ├── main.tsx               # Entry point gắn kết React DOM
│       ├── App.tsx                # Khởi tạo Auth State, Router & Theme
│       ├── config/                # Cấu hình môi trường (env.config.ts Dual-Mode)
│       ├── routes/                # Định tuyến SPA & RBAC Guards (AppRoutes.tsx, RoleRoute, HomeRedirect, route-paths.ts)
│       ├── types/                 # Kiểu TypeScript chuẩn hóa domain (domain.types.ts, schedule.types.ts)
│       ├── shared/                # Module dùng chung toàn hệ thống (Shared Infrastructure)
│       │   ├── api/
│       │   │   └── apiClient.ts   # Axios/Fetch client: tự gán Bearer Token, unwrap ApiResponse, Blob download
│       │   ├── auth/
│       │   │   ├── authService.ts # Gọi API đăng nhập, làm mới token, lấy user /me
│       │   │   └── useAuthStore.ts# Zustand store quản lý JWT, user principal, xác thực & duy trì phiên làm việc
│       │   ├── department/
│       │   │   └── departmentService.ts # Gọi API danh mục phòng ban toàn cục
│       │   ├── directory/
│       │   │   └── useDirectoryStore.ts # Zustand store nạp & đồng bộ danh mục thực tế từ MySQL (Employees, Departments, Positions)
│       │   └── store/
│       │       └── useUIStore.ts  # Quản lý Toast notification và trạng thái UI toàn cục
│       ├── components/            # UI components tái sử dụng dùng chung
│       │   ├── layout/            # Khung sườn (AppLayout, Sidebar lọc menu theo RoleType, Topbar tinh gọn, UserProfileDropdown)
│       │   ├── ui/                # Nguyên tử UI (Button, Input, Modal, Badge, Card,...)
│       │   ├── feedback/          # Thông báo Toast, Spinner, Empty State
│       │   └── charts/            # Biểu đồ KPI thống kê
│       ├── features/              # Các phân hệ màn hình chức năng tự chứa (Feature-Driven Architecture)
│       │   ├── auth/              # Phân hệ xác thực & Đăng nhập người dùng
│       │   │   └── LoginPage.tsx  # Giao diện đăng nhập tinh gọn (Centered Card, Form tài khoản chuẩn)
│       │   ├── schedule/          # Ma trận xếp ca tuần & kiểm tra xung đột trực quan (Core Feature)
│       │   │   ├── SchedulePage.tsx       # Màn hình chính ma trận xếp ca tuần
│       │   │   ├── schedule.css           # Bảng style riêng biệt cho WeeklyGrid
│       │   │   ├── api/scheduleService.ts # Gọi API lấy lịch tuần, gán ca, xóa ca, công bố
│       │   │   ├── store/useScheduleStore.ts # Quản lý lịch tuần, assignmentsMap, tính vi phạm
│       │   │   ├── components/            # WeeklyGrid, ShiftCell, ShiftBadge, ConflictIndicator,...
│       │   │   ├── dialogs/               # AssignShiftDrawer, BulkAssignDialog, CopyWeekDialog,...
│       │   │   └── __tests__/             # Unit tests cho xếp ca
│       │   ├── dashboard/         # Bảng điều khiển KPI & Thẻ điểm danh nhanh
│       │   │   ├── DashboardPage.tsx      # Bảng điều khiển tổng quan
│       │   │   └── components/            # QuickAttendanceCard, KpiOverview,...
│       │   ├── employees/         # Quản lý danh sách & Hồ sơ nhân sự chi tiết
│       │   │   ├── EmployeeListPage.tsx   # Danh sách nhân viên, lọc phòng ban, phân trang
│       │   │   ├── EmployeeDetailPage.tsx # Hồ sơ chi tiết (tab lý lịch, lịch làm, chấm công, phép)
│       │   │   ├── api/employeeService.ts # Gọi API CRUD hồ sơ nhân viên
│       │   │   ├── components/            # EmployeeTable, EmployeeFormModal, DeleteConfirmModal,...
│       │   │   └── __tests__/             # Unit tests xóa nhân viên & nghiệp vụ hồ sơ
│       │   ├── attendance/        # Giám sát chấm công & Giải trình giờ công
│       │   │   ├── AttendanceOverviewPage.tsx # Màn hình theo dõi chấm công ngày
│       │   │   ├── api/attendanceService.ts   # Gọi API check-in, check-out, bản ghi chấm công
│       │   │   ├── store/useAttendanceStore.ts# Lưu trữ dữ liệu chấm công, trạng thái quẹt thẻ
│       │   │   ├── components/            # AttendanceTable, AttendanceCorrectionModal,...
│       │   │   └── __tests__/
│       │   ├── leaves/            # Quản lý đơn nghỉ phép & Phê duyệt phân cấp
│       │   │   ├── LeaveRequestsPage.tsx  # Danh sách đơn phép & Sổ cái quỹ phép cá nhân
│       │   │   ├── api/leaveService.ts    # Gọi API đơn phép, quỹ phép, duyệt đơn
│       │   │   ├── store/useLeaveStore.ts # Quản lý trạng thái phép, trigger sync sang lịch
│       │   │   ├── components/            # LeaveRequestModal, LeaveApprovalModal,...
│       │   │   └── __tests__/
│       │   ├── shifts/            # Quản lý danh mục mẫu ca làm việc
│       │   │   ├── ShiftTemplatesPage.tsx # Màn hình quản trị ca mẫu
│       │   │   ├── components/            # ShiftTemplateModal, ShiftColorPicker,...
│       │   │   └── __tests__/
│       │   ├── reports/           # Trung tâm xuất báo cáo & Dữ liệu
│       │   │   ├── ReportsPage.tsx        # Bảng điều khiển xuất báo cáo
│       │   │   ├── api/reportService.ts   # Gọi API tải file Excel .xlsx & CSV UTF-8
│       │   │   └── components/            # MonthlyAttendanceReport,...
│       │   └── settings/          # Cài đặt tham số hệ thống & Ngưỡng luật lao động
│       │       ├── SettingsPage.tsx       # Màn hình cấu hình tham số
│       │       ├── store/useSettingsStore.ts # Quản lý tham số cấu hình
│       │       └── components/            # SettingRuleForm,...
│       ├── hooks/                 # Custom React Hooks (useMediaQuery, useModalFocusTrap)
│       ├── utils/                 # Hàm tiện ích thuần túy (date.utils, code-generator.utils, conflict-detector,...)
│       │   └── __tests__/         # Bộ 15 bài kiểm thử đơn vị Vitest (code-generator, date.utils)
│       ├── styles/                # Hệ thống CSS Design Tokens (tokens.css, global.css, reset.css)
│       └── test/                  # Cấu hình kiểm thử Vitest (setupTests.ts, vitest.config, fixtures/ cho test cô lập)
│
├── docs/                          # Kho 19 tài liệu kỹ thuật chuẩn mực của dự án (DOC-00 -> DOC-18)
├── plans/                         # Kế hoạch phát triển và nhật ký kiểm toán qua các phase
├── docker-compose.yml             # Điều phối 3 container: MySQL 8.0, Backend Spring Boot, Frontend React
└── .env.example                   # Mẫu cấu hình biến môi trường toàn hệ thống
```

---

## 3. PHÂN TÍCH CHI TIẾT 10 MODULE BACKEND (`backend/src/main/java/com/company/hrms`)

Hệ thống Backend áp dụng triệt để kiến trúc **Package-by-Feature**. Thay vì gom toàn bộ Controller hay Service vào một chỗ (Package-by-Layer), mỗi module là một đơn vị ranh giới nghiệp vụ độc lập, bao gồm đầy đủ các tầng từ giao diện API tới ánh xạ cơ sở dữ liệu.

```
[HTTP Request] ──> [Controller] ──> [Service] ──> [Repository] ──> [MySQL Entity]
                        │               │
                   (DTO Validation) (Business Logic & Transactions)
```

### 1. Phân hệ dùng chung (`com.company.hrms.common`)
- **`audit/AuditAwareImpl.java`**: Tự động trích xuất username hiện tại từ `SecurityContextHolder` để nạp vào trường `created_by` và `updated_by`.
- **`entity/BaseAuditableEntity.java`**: Lớp cơ sở cung cấp `id` (UUID hoặc Long), `created_at`, `updated_at`, `created_by`, `updated_by`, `@Version` (Optimistic Locking chống xung đột ghi đồng thời), và cờ xóa mềm `is_deleted`.
- **`exception/`**: 
  - `BusinessException.java`: Lớp ngoại lệ nghiệp vụ tùy biến kèm mã lỗi `ErrorCode`.
  - `ResourceNotFoundException.java`: Ngoại lệ khi không tìm thấy tài nguyên (HTTP 404).
  - `GlobalExceptionHandler.java`: Bắt mọi lỗi ngoại lệ và định dạng về cấu trúc phản hồi `ErrorResponse` chuẩn.
- **`response/`**: `ApiResponse<T>` (bọc kết quả API kèm timestamp, status code, message) và `PageResponse<T>` (bọc danh sách phân trang chuẩn 1-based).
- **`util/DateTimeUtils.java`**: Tiện ích chuyển đổi `LocalDate`, `LocalTime`, `LocalDateTime`, tính khoảng cách phút, chuẩn hóa múi giờ `Asia/Ho_Chi_Minh`.

### 2. Phân hệ an ninh bảo mật (`com.company.hrms.security`)
- **`config/SecurityConfig.java`**: Khai báo `SecurityFilterChain`, tắt CSRF vì hệ thống Stateless, kích hoạt CORS, phân quyền đường dẫn, quản lý phiên `SessionCreationPolicy.STATELESS`, thiết lập bộ mã hóa mật khẩu `BCryptPasswordEncoder`.
- **`jwt/JwtTokenProvider.java`**: Ký và thẩm tra JWT Token sử dụng thuật toán HMAC-SHA512 với secret key an toàn.
- **`jwt/JwtAuthenticationFilter.java`**: Chặn bắt mọi HTTP request, bóc tách header `Authorization: Bearer <token>`, giải mã và tiêm `UsernamePasswordAuthenticationToken` vào `SecurityContext`.
- **`service/`**: `CustomUserDetailsService` và `UserPrincipal` cầu nối giữa Spring Security và bảng người dùng `users` trong CSDL.

### 3. Chi tiết 10 Module nghiệp vụ (`com.company.hrms.modules.*`)

| Module | Đường dẫn gói | Thành phần chính & Thực thể JPA | Nghiệp vụ cốt lõi |
| :--- | :--- | :--- | :--- |
| **`auth`** | `modules.auth` | `User`, `Role`, `AuthController`, `AuthService` | Đăng nhập tài khoản, cấp phát cặp Access Token (24h) và Refresh Token (7 ngày), endpoint `/api/v1/auth/login`, `/refresh`, `/me`. |
| **`department`** | `modules.department` | `Department`, `DepartmentController`, `DepartmentService` | Quản lý danh mục phòng ban, mô hình cây phân cấp (`parent_department_id`), chỉ định trưởng phòng (`manager_id`), ngăn xóa phòng ban còn nhân viên. |
| **`position`** | `modules.position` | `Position`, `PositionController`, `PositionService` | Quản lý danh mục chức danh, vị trí công việc chuyên môn trong doanh nghiệp. |
| **`employee`** | `modules.employee` | `Employee`, `EmployeeController`, `EmployeeService` | Quản lý toàn diện hồ sơ nhân viên (Mã NV, CCCD, thông tin liên lạc, hợp đồng, trạng thái). Hỗ trợ tìm kiếm động (Search Specification), phân trang, khóa lạc quan `@Version`. |
| **`shift`** | `modules.shift` | `WorkShift`, `ShiftController`, `ShiftService` | Quản lý danh mục mẫu ca chuẩn (Sáng, Hành chính, Chiều, Đêm). Hỗ trợ ca qua đêm (`is_cross_midnight`), định mức quân số (`min_staffing`, `max_staffing`), mã màu hiển thị. |
| **`schedule`** | `modules.schedule` | `Schedule`, `ShiftAssignment`, `ScheduleChangeHistory`, `ScheduleConflictEngine` | Xếp ca tuần phòng ban. **Snapshot Isolation** đóng băng ca vào bản ghi gán ca. **Conflict Engine** kiểm tra 8 quy tắc Luật Lao Động 2019 (BR-001 -> BR-008). Kiểm toán lịch sử thay đổi sau khi công bố (`PUBLISHED`). |
| **`attendance`** | `modules.attendance` | `AttendanceRecord`, `AttendanceCorrection`, `AttendanceService` | Ghi nhận chấm công quẹt thẻ vào/ra. Tự động tính phút đi muộn (ân hạn 5p), về sớm, tách bạch giờ làm ban đêm (`22:00 - 06:00`). Xử lý đơn giải trình quên quẹt thẻ. |
| **`leave`** | `modules.leave` | `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveService` | Quản lý loại nghỉ phép, sổ cái quỹ phép năm cá nhân, quy trình nộp đơn, chặn trùng ngày (`BR-009`) và phê duyệt phân cấp của Quản lý. |
| **`setting`** | `modules.setting` | `SystemSetting`, `SettingController`, `SettingService` | Lưu trữ cấu hình tham số động hệ thống (ngưỡng nghỉ giữa ca 11h/12h, trần 48h tuần, mức độ cảnh báo vi phạm). |
| **`report`** | `modules.report` | `ReportController`, `ExcelExportService`, `CsvExportService` | Tổng hợp bảng công tháng. Xuất file Microsoft Excel `.xlsx` nguyên bản bằng **Apache POI** và file `.csv` chuẩn RFC-4180 có tiền tố **UTF-8 BOM (`\uFEFF`)** chống lỗi font tiếng Việt. |

---

## 4. PHÂN TÍCH CHI TIẾT PHÂN HỆ FRONTEND (`frontend/src`)

Frontend áp dụng triết lý **Feature-Driven Architecture** kết hợp mô hình **Collocation** (tất cả những gì thuộc về một tính năng thì nằm cùng trong thư mục tính năng đó: Component, API Service, Zustand Store, Tests).

### 1. Phân tầng Hạ tầng Dùng chung (`src/shared`)
- **`shared/api/apiClient.ts`**:
  - Tự động lấy JWT token từ `localStorage` để tiêm vào header `Authorization: Bearer <token>`.
  - Tự động giải nén phong bì `ApiResponse<T>` để trả về trực tiếp dữ liệu `data` cho UI.
  - Tự động phát hiện kiểu `Content-Type` nhị phân (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`) để chuyển thành `Blob` và kích hoạt tải file tự động trên trình duyệt.
- **`shared/auth/`**:
  - `authService.ts`: Các phương thức gọi API xác thực (`login`, `refreshToken`, `getCurrentUser`).
  - `useAuthStore.ts`: Zustand store quản lý trạng thái đăng nhập, lưu token, khôi phục phiên (`initAuth`), giải mã thông tin `currentUser` và phân quyền RBAC.
- **`shared/department/departmentService.ts`**: Cung cấp hàm nạp danh mục phòng ban toàn cục dùng chung cho bộ lọc ca, bảng nhân sự và báo cáo.
- **`shared/directory/useDirectoryStore.ts`**: Zustand store quản lý bộ nhớ đệm danh mục toàn hệ thống (Nhân viên, Phòng ban, Vị trí chức danh). Tự động nạp trực tiếp 100% từ API MySQL khi ứng dụng khởi động và cung cấp tra cứu O(1) theo ID cho toàn bộ các màn hình nghiệp vụ.
- **`shared/store/useUIStore.ts`**: Quản lý hàng đợi thông báo Toast toàn cục (Success, Warning, Error, Info).

### 2. Chi tiết các Phân hệ Giao diện (`src/features/*`)

```
src/features/<feature-name>/
├── <Feature>Page.tsx        # Container Page component kết nối State & Route
├── api/                     # Service gọi API riêng của phân hệ (gọi qua apiClient)
├── store/                   # Zustand store chuyên biệt quản lý state phân hệ
├── components/              # Các UI components nội bộ của phân hệ
├── dialogs/ / modals/       # Các hộp thoại Drawer / Modal thao tác nghiệp vụ
└── __tests__/               # Bài kiểm thử Vitest cho phân hệ
```

| Phân hệ (Feature) | Thư mục | Các file then chốt | Chức năng nghiệp vụ & Trải nghiệm UI |
| :--- | :--- | :--- | :--- |
| **`auth`** | `features/auth` | `LoginPage.tsx` | - Màn hình đăng nhập tập trung, tinh gọn (Centered Card tối giản).<br>- Biểu mẫu xác thực chuẩn với tài khoản công việc / mật khẩu, hiển thị cảnh báo lỗi trực quan, tùy chọn ghi nhớ tài khoản (`saved_username`). |
| **`schedule`** *(Trọng tâm)* | `features/schedule` | `SchedulePage.tsx`, `WeeklyGrid.tsx`, `scheduleService.ts`, `useScheduleStore.ts`, `AssignShiftDrawer.tsx` | - Ma trận 8 cột (Nhân viên + 7 ngày trong tuần).<br>- Hiển thị thẻ ca có mã màu, biểu tượng ca đêm, thẻ phép `[🏖️ PHÉP NĂM]`.<br>- Thanh tiến độ tổng giờ công tuần cảnh báo đỏ khi chạm/vượt trần 48h.<br>- Drawer gán ca kiểm tra vi phạm luật lao động realtime.<br>- Bộ lọc phòng ban, lọc nhân viên có xung đột, tìm kiếm.<br>- Hộp thoại phân ca hàng loạt, sao chép lịch tuần, công bố lịch, xem lịch sử thay đổi. |
| **`dashboard`** | `features/dashboard` | `DashboardPage.tsx`, `QuickAttendanceCard.tsx` | - Tổng hợp KPI vận hành: Tổng quân số, nhân sự đang làm hôm nay, ca trực đêm, tỷ lệ đúng giờ.<br>- Thẻ Điểm Danh Nhanh: Nút 1-click Check-in/Check-out và đồng hồ bấm giờ công làm việc.<br>- **Kiểm soát truy cập (RBAC):** Chỉ mở cho `ROLE_DIRECTOR`. Đối với `ROLE_MANAGER` và `ROLE_EMPLOYEE`, hệ thống tự động ẩn menu trên Sidebar và kích hoạt Safe Fallback Redirect về `/schedule`. |
| **`employees`** | `features/employees` | `EmployeeListPage.tsx`, `EmployeeDetailPage.tsx`, `employeeService.ts` | - Bảng danh sách nhân viên: Tìm kiếm realtime, phân quyền phạm vi chi nhánh (`Branch Scoping`): Quản lý và Nhân viên cố định theo chi nhánh trực thuộc, Giám đốc xem/lọc toàn chuỗi.<br>- Phân quyền thao tác: `ROLE_EMPLOYEE` chỉ đọc (ẩn nút Thêm & Sửa); `ROLE_MANAGER` được thêm/sửa nhân sự trong chi nhánh; `ROLE_DIRECTOR` toàn quyền (thêm/sửa mọi trường, xóa nhân sự).<br>- Modal thêm mới/sửa hồ sơ (`EmployeeFormModal`): Khóa trường Chi nhánh và Trạng thái hợp đồng đối với Non-director, tích hợp cơ chế phòng vệ đa tầng (Defense-in-depth).<br>- Trang hồ sơ chi tiết gồm 4 tab: Lý lịch cá nhân, Lịch sử phân ca, Bảng chấm công, Đơn xin nghỉ phép. |
| **`attendance`** | `features/attendance` | `AttendanceOverviewPage.tsx`, `attendanceService.ts`, `useAttendanceStore.ts`, `AttendanceCorrectionModal.tsx` | - Bảng giám sát chấm công toàn công ty theo ngày: Có mặt, Đi muộn, Về sớm, Quên quẹt thẻ ra.<br>- Modal nộp đơn và duyệt giải trình giờ công của nhân viên. |
| **`leaves`** | `features/leaves` | `LeaveRequestsPage.tsx`, `leaveService.ts`, `useLeaveStore.ts`, `LeaveApprovalModal.tsx` | - Sổ cái quỹ phép cá nhân: Hạn mức, Đã dùng, Đang chờ, Còn lại.<br>- Nộp đơn xin nghỉ tự động tính số ngày và chặn trùng lịch.<br>- Phê duyệt đơn phép phân cấp: Duyệt đơn tự động trừ quỹ phép và đồng bộ sang lưới xếp ca. |
| **`shifts`** | `features/shifts` | `ShiftTemplatesPage.tsx`, `ShiftTemplateCard.tsx`, `ShiftTemplateFormModal.tsx` | - Quản lý mẫu ca chuẩn: Giờ bắt đầu/kết thúc, thời gian nghỉ, định mức nhân sự tối thiểu/tối đa, bảng chọn màu trực quan (Color Picker).<br>- **Phân quyền thao tác (RBAC):** `ROLE_EMPLOYEE` chỉ đọc (ẩn và chặn nút Thêm/Sửa/Xóa với cơ chế phòng vệ đa tầng); `ROLE_MANAGER` và `ROLE_DIRECTOR` có toàn quyền quản trị mẫu ca (thêm mới, chỉnh sửa, xóa mềm). |
| **`reports`** | `features/reports` | `ReportsPage.tsx`, `reportService.ts`, `MonthlyAttendanceReport.tsx` | - Xem bảng chấm công tổng hợp tháng.<br>- Nút tải file Excel `.xlsx` nguyên bản kẻ bảng định dạng đẹp.<br>- Nút tải file CSV UTF-8 BOM hiển thị chuẩn tiếng Việt trên mọi hệ điều hành.<br>- **Kiểm soát truy cập (RBAC):** Chỉ dành cho `ROLE_DIRECTOR` và `ROLE_MANAGER`. Đối với `ROLE_EMPLOYEE`, menu Báo Cáo trên Sidebar được ẩn và route `/reports` được bảo vệ bằng `RoleRoute` (chuyển hướng an toàn về `/schedule`). |
| **`settings`** | `features/settings` | `SettingsPage.tsx`, `useSettingsStore.ts` | - Cấu hình linh hoạt: Thời gian nghỉ tối thiểu giữa 2 ca liên tiếp (11h hoặc 12h), thời gian ân hạn điểm danh, trần giờ làm việc tối đa trong tuần.<br>- **Kiểm soát truy cập (RBAC):** Chỉ dành cho `ROLE_DIRECTOR` và `ROLE_MANAGER`. Đối với `ROLE_EMPLOYEE`, menu Cài Đặt trên Sidebar được ẩn (nhóm "PHÂN TÍCH & THIẾT LẬP" tự động ẩn hoàn toàn khi không có mục con) và route `/settings` được bảo vệ bằng `RoleRoute` (chuyển hướng an toàn về `/schedule`). |

---

## 5. MÔ HÌNH CƠ SỞ DỮ LIỆU MYSQL 8.0 (`hrms_db`)

Cơ sở dữ liệu được quản lý tự động thông qua **Flyway Migrations** tại thư mục [`backend/src/main/resources/db/migration`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration):

```
[V1__init_schema.sql] ──> [V2__seed_master_data.sql] ──> [V3__seed_admin_user.sql]
  (Khởi tạo 17 bảng)         (Ca mẫu, phòng ban, ngày lễ)        (Tài khoản & phân quyền)
```

| Tên Bảng (Table) | Mô tả Nghiệp Vụ | Ràng Buộc Khóa Ngoại (Foreign Keys) |
| :--- | :--- | :--- |
| `users` | Tài khoản đăng nhập hệ thống, mật khẩu mã hóa BCrypt | - |
| `roles` | Danh mục vai trò: ADMIN, HR_MANAGER, DEPT_MANAGER, EMPLOYEE | - |
| `user_roles` | Bảng liên kết nhiều - nhiều giữa Tài khoản và Vai trò | `user_id -> users`, `role_id -> roles` |
| `departments` | Danh mục phòng ban, hỗ trợ cây phân cấp cha - con | `parent_department_id -> departments`, `manager_id -> employees` |
| `positions` | Danh mục chức danh, vị trí việc làm chuyên môn | - |
| `employees` | Hồ sơ nhân sự, trạng thái làm việc, trường khóa `@Version` | `department_id -> departments`, `position_id -> positions`, `manager_id -> employees`, `user_id -> users` |
| `work_shifts` | Danh mục mẫu ca làm việc, cờ qua đêm, định mức quân số, mã màu | - |
| `schedules` | Quản lý kỳ lịch theo tuần và phòng ban, trạng thái DRAFT / PUBLISHED | `department_id -> departments` |
| `shift_assignments` | Bản ghi phân ca nhân viên, chứa dữ liệu Snapshot đóng băng | `schedule_id -> schedules`, `employee_id -> employees`, `work_shift_id -> work_shifts` |
| `schedule_change_history` | Nhật ký kiểm toán các thay đổi ca sau khi lịch đã công bố | `schedule_id -> schedules`, `shift_assignment_id -> shift_assignments`, `employee_id -> employees` |
| `attendance_records` | Bản ghi chấm công quẹt thẻ vào/ra, số phút muộn, giờ làm đêm | `employee_id -> employees`, `shift_assignment_id -> shift_assignments` |
| `attendance_corrections` | Đơn giải trình giờ công quên quẹt thẻ và lịch sử xét duyệt | `attendance_record_id -> attendance_records`, `employee_id -> employees`, `reviewed_by -> users` |
| `leave_types` | Danh mục loại nghỉ phép (phép năm, việc riêng, ốm đau, không lương) | - |
| `leave_balances` | Sổ cái theo dõi quỹ phép năm của từng nhân viên theo từng năm | `employee_id -> employees`, `leave_type_id -> leave_types` |
| `leave_requests` | Đơn xin nghỉ phép và quy trình phê duyệt phân cấp | `employee_id -> employees`, `leave_type_id -> leave_types`, `tier1_reviewed_by -> users` |
| `company_holidays` | Lịch ngày nghỉ Lễ, Tết chính thức của công ty | - |
| `system_settings` | Bảng cấu hình các tham số động theo Luật Lao Động 2019 | - |

---

## 6. HƯỚNG DẪN VẬN HÀNH DÀNH CHO DEVELOPER

### 1. Khởi động CSDL MySQL & Phân hệ Backend
Yêu cầu: Đã cài MySQL 8.0 lắng nghe cổng 3306 (database `hrms_db`, user `root`, password `123456`).
```powershell
cd "D:\Project\Employee Management\backend"
mvn clean spring-boot:run
```
- Máy chủ Spring Boot chạy tại: `http://localhost:8080`.
- Flyway sẽ tự động chạy migration từ V1 đến V6 khởi tạo bảng và nạp dữ liệu mẫu ban đầu.
- **Lưu ý quan trọng về thứ tự khởi động (Startup Dependency Order):** Hãy đợi cho đến khi console hiển thị `Started HrmsApplication in ... seconds` trước khi mở hoặc reload Frontend trên trình duyệt. Điều này đảm bảo CSDL và toàn bộ Bean dịch vụ đã sẵn sàng, ngăn chặn triệt để lỗi kết nối bị từ chối (`ECONNREFUSED`) từ Vite dev proxy.
- Tài liệu tương tác API Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 2. Khởi động Phân hệ Frontend
```powershell
cd "D:\Project\Employee Management\frontend"
npm install
npm run dev
```
- Ứng dụng web mở tại: `http://localhost:5173`.
- **Cấu hình Vite Dev Proxy (`vite.config.ts`):**
  - Proxy reverse được cấu hình trỏ tới `http://127.0.0.1:8080` (hoặc biến môi trường `VITE_BACKEND_URL`).
  - *Khắc phục lỗi IPv6 Windows:* Sử dụng địa chỉ IPv4 `127.0.0.1` thay vì `localhost` để triệt tiêu lỗi phân giải `::1` trên Node.js 18+.
  - *Cơ chế Proxy Error Handler:* Tích hợp hook `configure(proxy)` tự động bắt lỗi khi Backend offline, trả về HTTP `503 Service Unavailable` kèm phản hồi JSON chuẩn (`code: BACKEND_UNAVAILABLE`) và ghi log cảnh báo thân thiện thay vì dump lỗi thô ra console.

### 3. Chạy Toàn Bộ Kiểm Thử Tự Động (Automated Testing)
```powershell
# Chạy toàn bộ bài kiểm thử Frontend Vitest (15 unit tests):
cd "D:\Project\Employee Management\frontend"
npm test

# Chạy kiểm thử Frontend ở chế độ tương tác theo dõi file (Watch mode):
npm run test:watch

# Biên dịch kiểm tra lỗi TypeScript & Build Production:
npm run build

# Chạy 36 bài kiểm thử Backend JUnit 5 & Spring Boot Test:
cd "D:\Project\Employee Management\backend"
mvn test
```

### 4. Tài Khoản Khởi Tạo Mẫu (Seed Accounts)
| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) | Nhân viên đại diện | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | **ROLE_ADMIN** | Đinh Thị Uyên (EMP-021) | Toàn quyền quản trị hệ thống, cấu hình tham số, xuất báo cáo, phân quyền |
| `manager` | `Admin@123` | **ROLE_DEPT_MANAGER** | Nguyễn Văn An (EMP-001) | Quản lý phòng ban, xếp ca tuần, phê duyệt đơn phép và giải trình chấm công |
| `employee` | `Admin@123` | **ROLE_EMPLOYEE** | Trần Thị Bích (EMP-002) | Xem lịch cá nhân, bấm điểm danh nhanh vào/ra ca, nộp đơn xin nghỉ phép |
