# TÀI LIỆU CẤU TRÚC THƯ MỤC & CÁC MODULE DỰ ÁN HRMS
*(Human Resource Management & Shift Scheduling System)*

**Tài liệu mã số:** `DOC-18`  
**Ngày cập nhật:** 09/11/2026  
**Phiên bản:** 4.0 (Synchronized Feature-Driven & Multi-Branch Architecture with Notification & Swap Pipeline)  
**Trạng thái:** Chính thức (Official Architecture Reference)  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Dự án **Employee Management & Shift Scheduling System (HRMS)** là giải pháp toàn diện phục vụ quản lý nhân sự đa chi nhánh, ma trận xếp ca thông minh và chấm công tuân thủ **Bộ Luật Lao Động Việt Nam 2019**. Hệ thống được thiết kế theo kiến trúc tách bạch hoàn toàn giữa Frontend (Feature-Driven SPA) và Backend (Package-by-Feature Modular Monolith), giao tiếp qua RESTful API chuẩn mực.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT: REACT 19 + TYPESCRIPT + VITE                     │
│  - Feature-Driven Architecture (Collocation: Component, API, Store)        │
│  - Dual-Mode: Browser (Real REST API Proxy) | Test (Isolated Memory Mock)   │
│  - State Management: Zustand (Micro-stores per feature + Shared Directory)  │
│  - Design Tokens: Vanilla CSS Tokens, Lucide Icons, WCAG 2.1 AA Standard   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON (Stateless JWT Bearer)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVER: SPRING BOOT 3.3.4 (JAVA 21 LTS)                  │
│  - Package-by-Feature Modular Monolith (14 Nghiệp Vụ Độc Lập)               │
│  - Stateless Security (JWT HMAC-SHA512, Dynamic RBAC @PreAuthorize)         │
│  - Conflict Detection Engine (9 Vietnamese Labor Law & Mobility Rules)      │
│  - JPA / Hibernate 6 (Optimistic Locking @Version, Soft Delete)             │
│  - Apache POI (Excel .xlsx Export) & RFC-4180 UTF-8 BOM CSV Streaming      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JDBC / TCP 3306
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE: MYSQL 8.0 (hrms_db)                       │
│  - Flyway Migrations (27 Phiên Bản: V1__init_schema -> V27)                 │
│  - 22 Bảng Quan Hệ (Foreign Keys, Optimistic Lock, Audit Trails)            │
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
│   │   │   │   │   ├── config/              # Cấu hình MVC, WebConfig phục vụ static uploads
│   │   │   │   │   ├── entity/              # BaseAuditableEntity (@Version, Soft Delete, Timestamps)
│   │   │   │   │   ├── exception/           # BusinessException, ResourceNotFoundException, GlobalExceptionHandler
│   │   │   │   │   ├── response/            # ApiResponse<T>, PageResponse<T> chuẩn hóa REST payload
│   │   │   │   │   └── service/             # Tiện ích hạ tầng (FileStorageService lưu trữ avatar/tệp)
│   │   │   │   ├── security/                # Phân hệ An ninh & Xác thực Stateless JWT
│   │   │   │   │   ├── config/              # SecurityConfig (SecurityFilterChain, CORS, BCrypt)
│   │   │   │   │   ├── jwt/                 # JwtTokenProvider, JwtAuthenticationFilter
│   │   │   │   │   └── service/             # UserPrincipal, CustomUserDetailsService
│   │   │   │   └── modules/                 # 14 Module nghiệp vụ độc lập (Package-by-Feature)
│   │   │   │       ├── attendance/          # Chấm công, tính giờ công đêm & giải trình quẹt thẻ
│   │   │   │       ├── auth/                # Xác thực, cấp phát JWT & Dynamic Role Synchronization
│   │   │   │       ├── availability/        # Đăng ký ca làm mong muốn & thời gian khả dụng nhân viên
│   │   │   │       ├── branch/              # Quản lý mạng lưới chi nhánh, cây phân cấp & người phụ trách
│   │   │   │       ├── dashboard/           # Thống kê KPI vận hành tổng thể cho cấp điều hành
│   │   │   │       ├── employee/            # Quản lý hồ sơ nhân sự, chi nhánh kiêm nhiệm, tự cấp User
│   │   │   │       ├── leave/               # Quản lý danh mục phép, sổ cái quỹ phép & quy trình duyệt đơn
│   │   │   │       ├── notification/        # Hệ thống thông báo nội bộ, chuông thông báo, tích hợp sự kiện
│   │   │   │       ├── position/            # Danh mục 3 chức danh chuẩn hóa doanh nghiệp
│   │   │   │       ├── report/              # Báo cáo tổng hợp, xuất Excel Apache POI & CSV UTF-8 BOM
│   │   │   │       ├── schedule/            # Xếp ca tuần & Conflict Detection Engine (9 rules BLLĐ)
│   │   │   │       ├── setting/             # Cấu hình tham số động hệ thống theo luật lao động
│   │   │   │       ├── shift/               # Danh mục ca làm việc chuẩn hóa theo từng chi nhánh
│   │   │   │       └── swap/                # Đề xuất và phê duyệt đổi ca làm việc giữa các nhân sự
│   │   │   └── resources/
│   │   │       ├── application.yml          # Cấu hình CSDL MySQL, JPA Hibernate, JWT, Port 8080
│   │   │       ├── application-dev.yml      # Cấu hình profile môi trường phát triển
│   │   │       └── db/migration/            # Quản lý phiên bản CSDL Flyway (V1 -> V27)
│   │   └── test/java/com/company/hrms/      # 5 Test suites trọng điểm kiểm thử tích hợp (JUnit 5)
│   └── target/                              # Thư mục build artifact (JAR)
│
├── frontend/                      # Phân hệ Giao diện Người dùng (React 19, TypeScript, Vite)
│   ├── Dockerfile                 # Multi-stage build Node 20 + Nginx Alpine
│   ├── nginx.conf                 # Cấu hình reverse proxy /api/, /uploads/ và SPA fallback
│   ├── package.json               # Khai báo dependencies (React 19, Zustand, Lucide, oxlint)
│   ├── vite.config.ts             # Thiết lập Vite server & Proxy reverse (/api và /uploads -> Port 8080)
│   ├── tsconfig.json              # Thiết lập TypeScript Strict Mode
│   ├── .env.development           # Biến môi trường dev (VITE_USE_MOCK=false)
│   ├── .env.production            # Biến môi trường production
│   ├── index.html                 # HTML template tải phông chữ Be Vietnam Pro & Inter
│   └── src/
│       ├── main.tsx               # Entry point gắn kết React DOM
│       ├── App.tsx                # Khởi tạo Auth State, nạp Settings Bootstrap, Router & Theme
│       ├── config/                # Cấu hình môi trường (env.config.ts Dual-Mode)
│       ├── routes/                # Định tuyến SPA & RBAC Guards (AppRoutes.tsx, RoleRoute, route-paths.ts)
│       ├── types/                 # Kiểu TypeScript chuẩn hóa domain (domain.types.ts, schedule.types.ts)
│       ├── shared/                # Module dùng chung toàn hệ thống (Shared Infrastructure)
│       │   ├── api/               # apiClient.ts: tự tiêm Bearer Token, unwrap ApiResponse, Blob download
│       │   ├── auth/              # authService.ts, useAuthStore.ts (quản lý phiên & Dynamic Role Sync)
│       │   ├── branch/            # branchService.ts: API tra cứu mạng lưới chi nhánh toàn cục
│       │   ├── directory/         # useDirectoryStore.ts: bộ nhớ đệm đồng bộ danh mục từ MySQL
│       │   └── store/             # useUIStore.ts: quản lý thông báo Toast và trạng thái thu phóng Sidebar
│       ├── components/            # UI components tái sử dụng dùng chung
│       │   ├── layout/            # AppLayout, Sidebar (lọc menu theo Role), Topbar, UserProfileDropdown
│       │   ├── ui/                # Button, Input, Modal, Badge, Card, AvatarUpload
│       │   ├── feedback/          # ToastNotification, Spinner, EmptyState
│       │   └── charts/            # Biểu đồ KPI thống kê
│       ├── features/              # 11 Phân hệ màn hình chức năng tự chứa (Feature-Driven Architecture)
│       │   ├── attendance/        # Giám sát chấm công ngày, nộp & phê duyệt giải trình quẹt thẻ
│       │   ├── auth/              # Đăng nhập hệ thống (Mã nhân viên / Quản trị viên)
│       │   ├── branches/          # Quản lý mạng lưới chi nhánh, cơ sở trực thuộc & người điều hành
│       │   ├── dashboard/         # Bảng điều khiển KPI điều hành tổng thể (Dành riêng cho Giám đốc)
│       │   ├── employees/         # Hồ sơ nhân sự, luân chuyển chi nhánh, chi nhánh kiêm nhiệm
│       │   ├── leaves/            # Sổ cái quỹ phép năm, nộp đơn, hủy đơn hoàn phép, duyệt đơn
│       │   ├── notification/      # Chuông thông báo Topbar, menu dropdown, useNotificationStore
│       │   ├── reports/           # Trung tâm báo cáo chấm công tháng, đối soát lịch, xuất Excel/CSV
│       │   ├── schedule/          # Ma trận xếp ca tuần, Drawer gán ca, kiểm tra vi phạm 9 rules realtime
│       │   ├── settings/          # Cài đặt tham số vận hành & các ngưỡng Luật Lao Động
│       │   └── shifts/            # Quản trị danh mục ca mẫu chuẩn hóa theo chi nhánh
│       ├── hooks/                 # Custom React Hooks (useMediaQuery, useModalFocusTrap)
│       ├── utils/                 # date.utils, code-generator.utils, conflict-detector
│       └── styles/                # CSS Design Tokens (tokens.css, global.css, reset.css)
│
├── docs/                          # Kho tài liệu kỹ thuật chuẩn mực của dự án (DOC-00 -> DOC-18)
├── plans/                         # Kế hoạch phát triển và kiểm toán qua các phase
├── uploads/                       # Thư mục lưu trữ tệp tin tải lên (ảnh đại diện nhân sự)
├── docker-compose.yml             # Điều phối 3 container: MySQL 8.0, Backend Spring Boot, Frontend React
└── .env.example                   # Mẫu cấu hình biến môi trường toàn hệ thống
```

---

## 3. PHÂN TÍCH CHI TIẾT 14 MODULE BACKEND (`backend/src/main/java/com/company/hrms`)

Hệ thống Backend áp dụng triệt để kiến trúc **Package-by-Feature**. Mỗi module là một phân vùng nghiệp vụ tự chứa (Self-contained Business Slice), sở hữu đầy đủ Controller, Service, DTO, Domain Entity và Repository.

```
[HTTP Request] ──> [Controller] ──> [Service] ──> [Repository] ──> [MySQL Entity]
                         │               │
                    (DTO Validation) (Business Logic & Transactions)
```

### 1. Phân hệ dùng chung & An ninh (`com.company.hrms.common` & `security`)
- **`common/audit/AuditAwareImpl.java`**: Tự động lấy username của người dùng đang đăng nhập từ `SecurityContextHolder` để nạp vào trường `created_by` và `updated_by`.
- **`common/entity/BaseAuditableEntity.java`**: Cung cấp `id` (Long/UUID), `created_at`, `updated_at`, `created_by`, `updated_by`, `@Version` (Optimistic Locking) và cờ xóa mềm `is_deleted`.
- **`common/exception/`**: `BusinessException`, `ResourceNotFoundException`, và `GlobalExceptionHandler` bắt ngoại lệ tập trung, chuẩn hóa cấu trúc lỗi trả về.
- **`common/response/`**: `ApiResponse<T>` (chuẩn hóa REST envelope) và `PageResponse<T>` (phân trang chuẩn 1-based).
- **`common/service/FileStorageService.java`**: Xử lý tải lên và truy xuất an toàn hình đại diện (`uploads/avatars`).
- **`security/`**: Khởi tạo `SecurityFilterChain` Stateless, chứng thực JWT Bearer qua `JwtAuthenticationFilter`, kiểm tra chữ ký HMAC-SHA512 qua `JwtTokenProvider`, và phân quyền phương thức `@PreAuthorize("hasRole(...)")`.

### 2. Danh mục 14 Module nghiệp vụ (`com.company.hrms.modules.*`)

| STT | Module | Thành phần chính & Thực thể JPA | Nghiệp vụ cốt lõi |
| :---: | :--- | :--- | :--- |
| **1** | **`auth`** | `User`, `Role`, `AuthController`, `AuthService` | - Xác thực tài khoản, cấp phát Access Token (24h) và Refresh Token (7 ngày).<br>- **Dynamic Role Synchronization (Single Source of Truth):** Tự động đối chiếu chức danh nhân sự (`position_id`: `1 -> ROLE_DIRECTOR`, `2 -> ROLE_MANAGER`, `3 -> ROLE_EMPLOYEE`) để cập nhật vai trò và cấp quyền tức thời trên JWT. |
| **2** | **`branch`** | `Branch`, `BranchController`, `BranchService` | - Quản lý mạng lưới chi nhánh (thay thế mô hình phòng ban cũ).<br>- Thiết lập người điều hành cơ sở (`manager_id`), ngày khai trương (`opened_date`), địa chỉ và thông tin liên hệ. |
| **3** | **`position`** | `Position`, `PositionController`, `PositionService` | - Quản lý 3 chức danh chuẩn hóa toàn chuỗi: Giám đốc (`1`), Quản lý (`2`), Nhân viên (`3`). |
| **4** | **`employee`** | `Employee`, `EmployeeSecondaryBranch`, `EmployeeService`, `EmployeeUserProvisioningRunner` | - Hồ sơ nhân sự: Mã nhân viên (EMP-xxx), CCCD, thông tin liên hệ, avatar, khóa lạc quan `@Version`.<br>- **Cấp phát tài khoản tự động:** Tự động sinh tài khoản User liên kết theo mã NV khi tiếp nhận nhân sự mới; `EmployeeUserProvisioningRunner` tự động bù đắp tài khoản khi khởi động.<br>- **Luân chuyển & Kiêm nhiệm:** Hỗ trợ điều chuyển nhân sự sang chi nhánh mới (bảo toàn lịch sử phân ca qua Flyway V19) và gán chi nhánh kiêm nhiệm (`employee_secondary_branches`). |
| **5** | **`shift`** | `WorkShift`, `ShiftController`, `ShiftService` | - Quản lý danh mục ca chuẩn theo từng chi nhánh (`branch_id`).<br>- Hỗ trợ ca qua đêm (`is_cross_midnight`), định mức quân số (`min_staffing`, `max_staffing`), mã màu nhận diện. |
| **6** | **`schedule`** | `Schedule`, `ShiftAssignment`, `ScheduleChangeHistory`, `ConflictDetectionEngine` | - Quản lý kỳ xếp ca tuần theo từng chi nhánh, trạng thái `DRAFT` / `PUBLISHED`.<br>- **Snapshot Isolation:** Đóng băng thông tin ca làm việc vào bản ghi phân ca tại thời điểm xếp.<br>- **Động cơ kiểm tra xung đột:** 9 quy tắc tự động (xem mục 3.3).<br>- Ghi nhật ký kiểm toán thay đổi (`ScheduleChangeHistory`) sau khi lịch đã công bố.<br>- **Open Shift Claiming:** Đăng ký nhận ca trống với cờ `self_volunteered_confirm` và ghi nhận `source = 'CLAIMED'`. |
| **7** | **`attendance`** | `AttendanceRecord`, `AttendanceCorrection`, `AttendanceService` | - Ghi nhận quẹt thẻ vào/ra, tính phút đi muộn (ân hạn 5 phút), về sớm, tách bạch giờ làm đêm (`22:00 - 06:00`).<br>- Quy trình nộp và phê duyệt đơn giải trình quên quẹt thẻ lưu vết trực tiếp vào CSDL. |
| **8** | **`leave`** | `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveService` | - Quản lý danh mục phép, sổ cái quỹ phép năm cá nhân (`leave_balances`).<br>- Quy trình nộp đơn, chặn trùng lịch, phê duyệt trừ phép và hủy đơn hoàn trả ngày phép khả dụng. |
| **9** | **`availability`** | `EmployeeAvailability`, `EmployeePreferredShift`, `AvailabilityService` | - Nhân viên đăng ký lịch rảnh theo thứ trong tuần và các ca làm việc mong muốn, hỗ trợ người quản lý xếp ca tối ưu. |
| **10**| **`swap`** | `ShiftSwapRequest`, `ShiftSwapController`, `ShiftSwapService` | - Quy trình đổi ca (`SWAP`) và nhường ca (`HANDOVER`): nộp yêu cầu, mô phỏng xung đột (`/simulate`), đồng nghiệp chấp thuận, Quản lý phê duyệt.<br>- **Truy vết nhường ca:** Lưu vết nhân sự ban đầu qua `transferred_from_employee_id`. |
| **11**| **`notification`** | `Notification`, `NotificationRepository`, `NotificationService`, `LeaveNotifier`, `NotificationController` | - Tiếp nhận, lưu trữ và phân phối thông báo nội bộ thời gian thực theo người nhận (`user_id`).<br>- Tự động kích hoạt thông báo đa kênh từ `LeaveNotifier`, `ShiftSwapService`, `ScheduleAssignmentService`.<br>- Cung cấp API đếm số lượng chưa đọc (`unread-count`), đánh dấu đã đọc một thông báo hoặc toàn bộ danh sách. |
| **12**| **`dashboard`** | `DashboardController`, `DashboardService` | - Thống kê KPI vận hành thời gian thực: Tổng quân số, nhân sự đang làm việc hôm nay, quân số trực ca đêm, tỷ lệ đi làm đúng giờ (chỉ cấp cho `ROLE_DIRECTOR`). |
| **13**| **`setting`** | `SystemSetting`, `SettingController`, `SettingService` | - Cấu hình tham số động: thời gian nghỉ tối thiểu giữa 2 ca (11h/12h), trần 48h tuần, phút ân hạn đi muộn. |
| **14**| **`report`** | `ReportController`, `ExcelExportService`, `CsvExportService` | - Tổng hợp bảng công tháng, chênh lệch lịch vs thực tế, vi phạm đi muộn/về sớm.<br>- Xuất file Excel `.xlsx` nguyên bản kẻ khung bằng **Apache POI** và file CSV định dạng **UTF-8 BOM (`\uFEFF`)**.<br>- **Branch Scoping:** Quản lý cơ sở bị khóa cứng theo chi nhánh trực thuộc, chỉ Giám đốc mới có quyền truy vấn toàn chuỗi. |

### 3. Động cơ Kiểm Tra Xung Đột Phân Ca (Conflict Detection Engine)
Động cơ (`com.company.hrms.modules.schedule.engine`) thực thi kiểm soát tự động trước khi lưu hoặc cập nhật ca làm việc, bao gồm **9 quy tắc nghiệp vụ**:

1. **`ShiftOverlapRule`**: Chặn một nhân sự bị xếp trùng thời gian giữa 2 ca trong cùng một ngày.
2. **`MinRestPeriodRule`**: Bắt buộc khoảng nghỉ tối thiểu giữa 2 ca liên tiếp (ngưỡng 11h hoặc 12h cấu hình từ `system_settings`), xét cả ca qua đêm.
3. **`DailyMaxHoursRule`**: Chặn tổng giờ làm việc trong ngày vượt quá trần quy định của Luật Lao Động.
4. **`WeeklyMaxHoursRule`**: Cảnh báo hoặc chặn khi tổng giờ làm việc trong tuần của nhân viên vượt trần 48 giờ.
5. **`ApprovedLeaveOverlapRule`**: Ngăn chặn gán ca vào ngày nhân viên đã có đơn xin nghỉ phép được duyệt.
6. **`HolidayAssignmentRule`**: Cảnh báo khi xếp ca vào các ngày nghỉ Lễ/Tết chính thức của doanh nghiệp (`company_holidays`).
7. **`StaffingCapacityRule`**: Cảnh báo khi quân số bố trí trong ca chưa đạt mức tối thiểu (`min_staffing`) hoặc vượt quá mức tối đa (`max_staffing`).
8. **`EmployeeStatusRule`**: Ngăn chặn xếp ca cho nhân sự đã nghỉ việc hoặc hồ sơ đang bị tạm ngưng.
9. **`TravelBufferRule`**: Bắt buộc có khoảng đệm thời gian di chuyển hợp lý khi nhân viên làm việc giữa các chi nhánh khác nhau.
- *Logic Shift Handover:* Quản lý khoảng thời gian giao thoa giữa ca làm việc cũ và ca làm việc mới nhằm đảm bảo bàn giao công việc thông suốt.

---

## 4. PHÂN TÍCH CHI TIẾT PHÂN HỆ FRONTEND (`frontend/src`)

Frontend áp dụng mô hình **Feature-Driven Architecture** kết hợp nguyên tắc **Collocation** (Component, API Service, Zustand Store của mỗi phân hệ nằm trọn vẹn trong thư mục của phân hệ đó).

```
src/features/<feature-name>/
├── <Feature>Page.tsx        # Container Page component gắn kết State & Route
├── api/                     # Service gọi API riêng của phân hệ (thông qua apiClient)
├── store/                   # Zustand store chuyên biệt quản lý state
├── components/              # Các UI components nội bộ của phân hệ
└── dialogs/ / modals/       # Các hộp thoại Modal / Drawer thao tác nghiệp vụ
```

### 1. Phân tầng Hạ tầng Dùng chung (`src/shared`)
- **`shared/api/apiClient.ts`**:
  - Tự động lấy JWT token từ `localStorage` để gắn header `Authorization: Bearer <token>`.
  - Tự động bóc tách envelope `ApiResponse<T>`, trả dữ liệu sạch `data` trực tiếp cho giao diện.
  - Tự động xử lý kiểu trả về nhị phân (`Blob`) để kích hoạt tải file Excel/CSV về máy tính.
- **`shared/auth/`**:
  - `authService.ts`: Đăng nhập, làm mới token, lấy hồ sơ cá nhân `/me`.
  - `useAuthStore.ts`: Quản lý JWT, thông tin người dùng, thanh lọc token lỗi thời (**Stale Mock Token Purging**), thực thi **Dynamic Role & Profile Synchronization** theo chi nhánh và chức danh.
- **`shared/branch/branchService.ts`**: Tra cứu danh mục mạng lưới chi nhánh toàn cục.
- **`shared/directory/useDirectoryStore.ts`**: Nạp và lưu trữ cache danh mục (Nhân viên, Chi nhánh, Chức danh) trực tiếp từ MySQL khi ứng dụng khởi chạy, cung cấp tra cứu O(1) cho toàn bộ ứng dụng.
- **`shared/store/useUIStore.ts`**: Quản lý hàng đợi thông báo Toast toàn cục và trạng thái đóng/mở Sidebar.

### 2. Danh mục 11 Phân hệ Màn hình (`src/features/*`)

| Phân hệ (Feature) | Thư mục | Chức năng nghiệp vụ & Trải nghiệm UI |
| :--- | :--- | :--- |
| **`auth`** | `features/auth` | - Màn hình đăng nhập tinh gọn (Centered Card).<br>- Hỗ trợ đăng nhập bằng Mã nhân viên hoặc tài khoản quản trị.<br>- Tự động điều hướng landing page theo vai trò (`ROLE_DIRECTOR` vào Dashboard, các vai trò khác vào Lịch xếp ca). |
| **`schedule`** | `features/schedule` | - Ma trận phân ca tuần 8 cột (Nhân viên + 7 ngày trong tuần).<br>- Hiển thị thẻ ca có mã màu, biểu tượng ca đêm, thẻ phép năm.<br>- Thanh tiến độ tổng giờ công cảnh báo đỏ khi chạm/vượt trần 48h.<br>- Drawer gán ca kiểm tra vi phạm 9 quy tắc Luật Lao Động thời gian thực.<br>- Phân ca hàng loạt, sao chép lịch tuần, công bố lịch và xem lịch sử thay đổi.<br>- **Truy vết nhường ca:** Dòng thu gọn `▾ 1 NV đã nhường ca` hiển thị người được phân bổ ban đầu (gạch ngang mờ) kèm lý do giải trình. |
| **`dashboard`** | `features/dashboard` | - Tổng hợp 4 chỉ số KPI điều hành: Tổng quân số, Nhân sự đang làm, Ca trực đêm, Tỷ lệ đúng giờ.<br>- Thẻ Điểm Danh Nhanh: 1-click Check-in/Check-out và đồng hồ bấm giờ.<br>- **RBAC:** Dành riêng cho `ROLE_DIRECTOR` (tự động ẩn menu và chặn truy cập với các vai trò khác). |
| **`employees`** | `features/employees` | - Danh sách nhân sự: Tìm kiếm realtime, phân quyền theo chi nhánh trực thuộc.<br>- Phân quyền thao tác: Employee chỉ xem; Manager chỉnh sửa trong cơ sở; Director toàn quyền.<br>- Quản lý chi nhánh kiêm nhiệm và điều chuyển công tác.<br>- Trang hồ sơ chi tiết 4 tab: Lý lịch cá nhân, Lịch sử phân ca, Bảng chấm công, Đơn xin phép. |
| **`branches`** | `features/branches` | - Danh mục mạng lưới chi nhánh toàn chuỗi, địa chỉ, người quản lý phụ trách và ngày khai trương. |
| **`attendance`** | `features/attendance` | - Bảng giám sát điểm danh theo ngày: Có mặt, Đi muộn, Về sớm, Quên quẹt thẻ ra.<br>- Modal nộp và phê duyệt đơn giải trình chấm công lưu trữ trực tiếp vào CSDL. |
| **`leaves`** | `features/leaves` | - Sổ cái quỹ phép cá nhân: Hạn mức, Đã dùng, Đang chờ, Khả dụng.<br>- Nộp đơn xin nghỉ tự động tính số ngày và chặn trùng lịch.<br>- Phê duyệt đơn phép trừ quỹ phép tự động; nút Hủy đơn hoàn trả ngày phép tức thì. |
| **`notification`** | `features/notification` | - Chuông thông báo trên Topbar kèm badge đếm số lượng chưa đọc thời gian thực.<br>- Menu dropdown hiển thị danh sách thông báo phân trang, bộ lọc chưa đọc.<br>- Đánh dấu đã đọc đơn lẻ và đọc tất cả một chạm.<br>- Quản lý trạng thái thông báo tập trung qua `useNotificationStore`. |
| **`shifts`** | `features/shifts` | - Quản trị ca mẫu chuẩn theo từng chi nhánh: Giờ bắt đầu/kết thúc, giờ nghỉ, định mức nhân sự, Color Picker.<br>- **RBAC:** Employee chỉ xem; Manager và Director có quyền tạo mới/chỉnh sửa/xóa ca. |
| **`reports`** | `features/reports` | - 3 bảng báo cáo phân tích: Bảng chấm công tháng, Đối soát lịch vs thực tế, Vi phạm đi muộn/về sớm.<br>- Xuất file Excel `.xlsx` và CSV UTF-8 BOM.<br>- **Branch Scoping:** Manager bị khóa cứng theo chi nhánh trực thuộc; Director được chọn toàn bộ chi nhánh. |
| **`settings`** | `features/settings` | - Cấu hình tham số hệ thống: Ngưỡng nghỉ giữa ca (11h/12h), thời gian ân hạn điểm danh, trần giờ tuần.<br>- Nạp tự động vào store ngay tại `App.tsx` khi khởi động ứng dụng. |

---

## 5. MÔ HÌNH CƠ SỞ DỮ LIỆU MYSQL 8.0 (`hrms_db`)

Cơ sở dữ liệu gồm **22 bảng quan hệ**, được khởi tạo và nâng cấp tự động qua **27 bản Flyway Migrations** tại thư mục [`backend/src/main/resources/db/migration`](file:///D:/Project/Employee%20Management/backend/src/main/resources/db/migration):

### 1. Danh sách 22 Bảng Dữ Liệu

| Tên Bảng (Table) | Thực Thể JPA Tương Ứng | Mô Tả Nghiệp Vụ & Ràng Buộc Khóa Ngoại |
| :--- | :--- | :--- |
| `users` | `User` | Tài khoản đăng nhập hệ thống, mật khẩu mã hóa an toàn BCrypt |
| `roles` | `Role` | Danh mục vai trò: `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` |
| `user_roles` | *(Join Table)* | Bảng liên kết nhiều - nhiều giữa `users` và `roles` |
| `branches` | `Branch` | Mạng lưới chi nhánh kinh doanh (`manager_id -> employees`), ngày khai trương `opened_date` |
| `positions` | `Position` | 3 chức danh chuẩn: Giám đốc (1), Quản lý (2), Nhân viên (3) |
| `employees` | `Employee` | Hồ sơ nhân sự, mã NV, avatar, khóa `@Version` (`branch_id -> branches`, `position_id -> positions`, `user_id -> users`) |
| `employee_secondary_branches` | `EmployeeSecondaryBranch` | Danh sách chi nhánh kiêm nhiệm của nhân sự (`employee_id`, `branch_id`, `position_id`) |
| `work_shifts` | `WorkShift` | Danh mục ca mẫu chuẩn theo chi nhánh (`branch_id -> branches`) |
| `employee_availabilities` | `EmployeeAvailability` | Thời gian rảnh trong tuần nhân viên đăng ký (`employee_id -> employees`, `branch_id -> branches`) |
| `employee_preferred_shifts` | `EmployeePreferredShift` | Các ca làm việc mong muốn của nhân viên (`employee_id -> employees`, `work_shift_id -> work_shifts`) |
| `schedules` | `Schedule` | Kỳ lịch tuần của từng cơ sở, trạng thái DRAFT / PUBLISHED (`branch_id -> branches`) |
| `shift_assignments` | `ShiftAssignment` | Bản ghi phân ca nhân viên, chứa dữ liệu Snapshot đóng băng, lưu vết nhường ca (`transferred_from_employee_id`) và nguồn gốc phân ca (`source = 'ASSIGNED'/'CLAIMED'`) |
| `schedule_change_history` | `ScheduleChangeHistory` | Nhật ký kiểm toán các thay đổi ca sau khi lịch đã công bố |
| `shift_swap_requests` | `ShiftSwapRequest` | Đề xuất hoán đổi ca (`SWAP`) và nhường ca (`HANDOVER`) giữa 2 nhân sự và xét duyệt của Quản lý |
| `notifications` | `Notification` | Thông báo nội bộ hệ thống gửi tới người dùng (`user_id`, loại thông báo, tiêu đề, trạng thái đọc) |
| `attendance_records` | `AttendanceRecord` | Bản ghi quẹt thẻ vào/ra, số phút muộn, giờ làm đêm (`employee_id`, `shift_assignment_id`) |
| `attendance_corrections` | `AttendanceCorrection` | Đơn giải trình quên quẹt thẻ và kết quả phê duyệt (`attendance_record_id`, `employee_id`) |
| `leave_types` | `LeaveType` | Danh mục loại nghỉ phép (phép năm, việc riêng, ốm đau, không lương) |
| `leave_balances` | `LeaveBalance` | Sổ cái theo dõi quỹ phép năm của từng nhân sự (`employee_id`, `leave_type_id`) |
| `leave_requests` | `LeaveRequest` | Đơn xin nghỉ phép và quy trình phê duyệt phân cấp (`employee_id`, `leave_type_id`) |
| `company_holidays` | `CompanyHoliday` | Lịch ngày nghỉ Lễ, Tết chính thức của doanh nghiệp |
| `system_settings` | `SystemSetting` | Bảng cấu hình các tham số động theo Luật Lao Động 2019 |

### 2. Lược sử 27 Bản Flyway Migrations
1. `V1__init_schema.sql`: Khởi tạo cấu trúc bảng nền tảng ban đầu.
2. `V2__seed_master_data.sql`: Nạp danh mục ca mẫu, loại phép và ngày nghỉ lễ chuẩn.
3. `V3__seed_admin_user.sql`: Khởi tạo tài khoản quản trị viên kỹ thuật tối cao.
4. `V4__replace_department_with_branch.sql`: Chuyển đổi mô hình phòng ban sang chi nhánh (`branches`).
5. `V5__add_table_column_comments.sql`: Bổ sung chú thích SQL tiếng Việt cho toàn bộ bảng và cột.
6. `V6__standardize_positions_to_3_canonical_titles.sql`: Chuẩn hóa 3 chức danh doanh nghiệp.
7. `V7__seed_employee_user_accounts.sql`: Khởi tạo tài khoản đăng nhập liên kết cho hồ sơ nhân sự ban đầu.
8. `V8__create_employee_availabilities_table.sql`: Tạo bảng đăng ký thời gian làm việc khả dụng.
9. `V9__create_employee_secondary_branches_table.sql`: Tạo bảng quản lý chi nhánh kiêm nhiệm.
10. `V10__add_position_id_to_employee_secondary_branches.sql`: Bổ sung chức danh làm việc tại chi nhánh kiêm nhiệm.
11. `V11__create_employee_preferred_shifts_table.sql`: Tạo bảng ghi nhận ca làm việc mong muốn.
12. `V12__add_opened_date_to_branches.sql`: Bổ sung ngày khai trương cho các chi nhánh.
13. `V13__add_employee_avatar.sql`: Bổ sung cột lưu trữ đường dẫn ảnh đại diện nhân viên.
14. `V14__add_branch_id_to_work_shifts.sql`: Gắn ca làm việc trực thuộc từng chi nhánh cụ thể.
15. `V15__make_work_shifts_branch_specific.sql`: Hoàn thiện dữ liệu ca làm việc đặc thù theo cơ sở.
16. `V16__remap_cross_branch_shift_assignments.sql`: Ánh xạ lại các phân ca phù hợp với chi nhánh.
17. `V17__create_shift_swap_requests_table.sql`: Tạo bảng quy trình đổi ca giữa các nhân viên.
18. `V18__auto_increment_employee_code.sql`: Cơ chế tự động phát sinh mã nhân viên kế tiếp (EMP-xxx).
19. `V19__remap_transferred_employees_shift_assignments.sql`: Bảo toàn lịch sử phân ca khi nhân viên điều chuyển chi nhánh.
20. `V20__remap_transferred_employees_availabilities.sql`: Đồng bộ lịch khả dụng của nhân viên sau điều chuyển.
21. `V21__cleanup_orphan_cross_branch_availabilities.sql`: Dọn dẹp dữ liệu khả dụng mồ côi giữa các chi nhánh.
22. `V22__fix_work_shifts_unique_soft_delete.sql`: Sửa ràng buộc duy nhất tên ca làm có tính đến cờ xóa mềm.
23. `V23__allow_null_shift_colors.sql`: Cho phép giá trị màu ca làm việc nhận `NULL`.
24. `V24__add_transferred_from_employee_id_to_shift_assignments.sql`: Bổ sung cột lưu vết nhân sự nhường ca ban đầu (`transferred_from_employee_id`).
25. `V25__add_source_to_shift_assignments.sql`: Bổ sung cờ phân loại nguồn gốc phân ca (`source = 'ASSIGNED' | 'CLAIMED'`).
26. `V26__create_notifications_table.sql`: Tạo bảng thông báo nội bộ hệ thống (`notifications`).
27. `V27__notifications_recipient_user.sql`: Hoàn thiện liên kết tài khoản người dùng nhận thông báo (`user_id`).

---

## 6. KIẾN TRÚC AN NINH & ĐỊNH DANH (SECURITY & IDENTITY)

### 1. Cơ chế Xác thực & Ủy quyền
- **Stateless JWT:** Hệ thống không lưu trữ phiên (session) trên bộ nhớ máy chủ. Mọi yêu cầu đều được xác thực qua token chuẩn JWT HMAC-SHA512 đính kèm tại HTTP header `Authorization: Bearer <token>`.
- **Mã hóa Mật khẩu:** 100% mật khẩu người dùng được mã hóa bằng thuật toán một chiều an toàn **BCrypt** với salt ngẫu nhiên trước khi lưu vào CSDL.
- **Dynamic Role Synchronization (Single Source of Truth):**
  - Vai trò hệ thống được quyết định động theo chức danh nhân sự (`position_id`):
    - `position_id = 1` (Giám đốc) $\rightarrow$ `ROLE_DIRECTOR`
    - `position_id = 2` (Quản lý) $\rightarrow$ `ROLE_MANAGER`
    - `position_id = 3` (Nhân viên) $\rightarrow$ `ROLE_EMPLOYEE`
  - Khi người dùng đăng nhập, hệ thống tự động kiểm tra chức danh thực tế từ bảng `employees` để đồng bộ lại vai trò người dùng trong `users` và cấp quyền chính xác trên JWT.

### 2. Tự động Cấp phát Tài khoản (`EmployeeUserProvisioningRunner`)
- Khi tiếp nhận nhân sự mới (`POST /api/v1/employees`), hệ thống tự động tạo một tài khoản `User` liên kết với tên đăng nhập trùng khớp với mã nhân viên (`username = employee_code`).
- Thành phần `EmployeeUserProvisioningRunner` tự động rà soát khi khởi động máy chủ Spring Boot, phát hiện và bù đắp tài khoản cho bất kỳ nhân sự nào chưa có tài khoản đăng nhập mà không làm gián đoạn hệ thống.

---

## 7. HƯỚNG DẪN VẬN HÀNH DÀNH CHO DEVELOPER

### 1. Khởi động CSDL & Máy chủ Backend
Yêu cầu: Đã cài MySQL 8.0 lắng nghe cổng 3306 (CSDL `hrms_db`).
```powershell
cd "D:\Project\Employee Management\backend"
mvn clean spring-boot:run
```
- Máy chủ chạy tại: `http://localhost:8080`.
- Flyway sẽ tự động kích hoạt và thực thi 27 bản migration từ V1 đến V27.
- Tài liệu tương tác API Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 2. Khởi động Phân hệ Frontend
Yêu cầu: Node.js 20+ và npm.
```powershell
cd "D:\Project\Employee Management\frontend"
npm install
npm run dev
```
- Ứng dụng web mở tại: `http://localhost:5173`.
- **Vite Proxy:** Tự động điều hướng các yêu cầu `/api` và `/uploads` sang `http://127.0.0.1:8080`. Tích hợp bộ bắt lỗi proxy trả về JSON HTTP 503 thân thiện khi Backend chưa sẵn sàng.

### 3. Kiểm soát Chất lượng Mã Nguồn & Kiểm Thử
```powershell
# 1. Kiểm tra linter Frontend:
cd "D:\Project\Employee Management\frontend"
npm run lint

# 2. Biên dịch kiểm tra lỗi kiểu TypeScript Strict Mode & Build Production:
npm run build

# 3. Chạy toàn bộ 5 bộ kiểm thử tích hợp Backend (JUnit 5):
cd "D:\Project\Employee Management\backend"
mvn test
```
*(5 test suites bao phủ các nghiệp vụ cốt lõi: `ReportRbacTest`, `EmployeeBranchTransferTest`, `ShiftHandoverRuleTest`, `WorkShiftServiceTest`, `ShiftSwapServiceTest`).*
