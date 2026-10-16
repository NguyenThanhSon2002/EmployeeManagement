# TÀI LIỆU CẤU TRÚC THƯ MỤC & CÁC MODULE DỰ ÁN HRMS
*(Human Resource Management & Shift Scheduling System)*

**Tài liệu mã số:** `DOC-18`  
**Ngày lập:** 16/10/2026  
**Phiên bản:** 1.0 (Full-Stack Integrated)  
**Trạng thái:** Chính thức (Official Architecture Reference)  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Dự án **Employee Management & Shift Scheduling System** là giải pháp phần mềm quản lý nhân sự, ma trận xếp ca làm việc thông minh và chấm công tuân thủ **Bộ Luật Lao Động Việt Nam 2019**. Hệ thống được xây dựng theo kiến trúc hiện đại, tách biệt hoàn toàn giữa Frontend và Backend, giao tiếp thông qua RESTful API chuẩn mực.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT: REACT 19 + VITE + ZUSTAND                     │
│  - Dual-Mode: Browser (Real REST API Proxy) | Test (Isolated Memory Mock)   │
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
├── backend/                       # Phân hệ Máy chủ Backend (Spring Boot 3.3.4, Java 21)
│   ├── pom.xml                    # Cấu hình Maven dependencies và build plugins
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/company/hrms/
│   │   │   │   ├── HrmsApplication.java     # Lớp khởi chạy chính (Spring Boot Entry Point)
│   │   │   │   ├── common/                  # Kiến trúc hạ tầng chung (Cross-cutting Concerns)
│   │   │   │   │   ├── audit/               # Tự động ghi nhận created_by, updated_by
│   │   │   │   │   ├── entity/              # BaseAuditableEntity (@Version, Soft Delete)
│   │   │   │   │   ├── exception/           # BusinessException, GlobalExceptionHandler
│   │   │   │   │   ├── response/            # ApiResponse, PageResponse, ErrorResponse
│   │   │   │   │   └── utils/               # DateTimeUtils (chuẩn hóa múi giờ, định dạng)
│   │   │   │   ├── security/                # Phân hệ An ninh & Xác thực JWT
│   │   │   │   │   ├── config/              # SecurityConfig (Filter Chain, CORS, BCrypt)
│   │   │   │   │   ├── jwt/                 # JwtTokenProvider, JwtAuthenticationFilter
│   │   │   │   │   └── service/             # UserPrincipal, CustomUserDetailsService
│   │   │   │   └── modules/                 # 10 Module nghiệp vụ chính (Package-by-Feature)
│   │   │   │       ├── auth/                # Xác thực, đăng nhập, cấp phát Token
│   │   │   │       ├── department/          # Danh mục phòng ban & cây tổ chức
│   │   │   │       ├── position/            # Danh mục chức danh, vị trí việc làm
│   │   │   │       ├── employee/            # Quản lý hồ sơ nhân viên
│   │   │   │       ├── shift/               # Danh mục mẫu ca làm việc
│   │   │   │       ├── schedule/            # Xếp ca tuần & Conflict Detection Engine
│   │   │   │       ├── attendance/          # Chấm công & giải trình giờ công
│   │   │   │       ├── leave/               # Quản lý nghỉ phép & quỹ phép năm
│   │   │   │       ├── setting/             # Tham số cấu hình luật lao động
│   │   │   │       └── report/              # Xuất báo cáo Excel POI & CSV UTF-8
│   │   │   └── resources/
│   │   │       ├── application.yml          # Cấu hình CSDL MySQL, JWT, JPA, Logging
│   │   │       ├── application-dev.yml      # Cấu hình mở rộng môi trường phát triển
│   │   │       └── db/migration/            # Quản lý phiên bản CSDL Flyway
│   │   │           ├── V1__init_schema.sql  # Khởi tạo toàn bộ 17 bảng và ràng buộc FK
│   │   │           ├── V2__seed_master_data.sql # Dữ liệu mẫu ban đầu (ca, phòng ban, ngày lễ)
│   │   │           └── V3__seed_admin_user.sql  # Tài khoản mẫu admin, manager, employee
│   │   └── test/java/com/company/hrms/      # Toàn bộ 36 bài kiểm thử tích hợp (100% Pass)
│   └── target/                              # Thư mục build đầu ra và JAR artifact
│
├── frontend/                      # Phân hệ Giao diện Người dùng (React 19, TypeScript, Vite)
│   ├── package.json               # Khai báo thư viện: React, Zustand, Date-fns, Lucide
│   ├── vite.config.ts             # Cấu hình Vite & Reverse Proxy (/api -> localhost:8080)
│   ├── tsconfig.json              # Thiết lập TypeScript Strict Mode
│   ├── .env.development           # Biến môi trường dev (VITE_USE_MOCK=false)
│   ├── .env.production            # Biến môi trường production
│   ├── index.html                 # Template HTML gốc tải phông Be Vietnam Pro & Inter
│   └── src/
│       ├── main.tsx               # Entry point gắn kết React DOM
│       ├── App.tsx                # App component khởi tạo Auth & Router
│       ├── config/                # Cấu hình môi trường (env.config.ts Dual-Mode)
│       ├── types/                 # Toàn bộ định nghĩa kiểu TypeScript (domain.types.ts)
│       ├── routes/                # Định tuyến ứng dụng (AppRoutes.tsx, route-paths.ts)
│       ├── components/layout/     # Khung giao diện dùng chung
│       │   ├── AppLayout.tsx      # Khung layout tổng thể (Sidebar + Topbar + Content)
│       │   ├── Sidebar.tsx        # Thanh menu điều hướng chính
│       │   ├── Topbar.tsx         # Thanh tiêu đề, thông báo, tài khoản
│       │   └── RoleSwitcher.tsx   # Menu chuyển đổi vai trò trực tiếp (Admin/Manager/NV)
│       ├── services/              # Tầng gọi API kết nối với Spring Boot
│       │   ├── apiClient.ts       # Axios/Fetch wrapper tự động gắn Bearer Token & tải Blob
│       │   ├── authService.ts     # Gọi API đăng nhập, làm mới token, lấy user /me
│       │   ├── departmentService.ts # Gọi API danh mục phòng ban
│       │   ├── employeeService.ts # Gọi API hồ sơ nhân sự (CRUD, filter, paginate)
│       │   ├── scheduleService.ts # Gọi API ma trận lịch tuần, gán ca, xóa ca, công bố
│       │   ├── attendanceService.ts # Gọi API check-in, check-out, bản ghi chấm công
│       │   ├── leaveService.ts    # Gọi API đơn phép, quỹ phép, phê duyệt đơn
│       │   └── reportService.ts   # Gọi API xuất báo cáo Excel .xlsx & CSV
│       ├── store/                 # Quản lý trạng thái toàn cục bằng Zustand
│       │   ├── useAuthStore.ts    # Quản lý phiên đăng nhập, JWT token, vai trò người dùng
│       │   ├── useScheduleStore.ts # Quản lý lịch tuần, danh sách ca gán, kiểm tra xung đột
│       │   ├── useAttendanceStore.ts # Quản lý dữ liệu chấm công, check-in/out, giải trình
│       │   ├── useLeaveStore.ts   # Quản lý danh sách đơn xin nghỉ phép, duyệt đơn
│       │   ├── useSettingsStore.ts# Quản lý các tham số luật lao động
│       │   └── useUIStore.ts      # Quản lý thông báo Toast, theme, drawer trạng thái
│       ├── features/              # 8 Phân hệ giao diện chức năng chính
│       │   ├── schedule/          # Ma trận xếp ca tuần trực quan (SCR-11, SCR-12)
│       │   ├── dashboard/         # Bảng điều khiển KPI & Thẻ điểm danh nhanh hôm nay
│       │   ├── employees/         # Danh sách nhân viên & Trang hồ sơ chi tiết (SCR-04, 05)
│       │   ├── attendance/        # Theo dõi chấm công & Modal giải trình giờ công
│       │   ├── leaves/            # Quản lý đơn nghỉ phép & Modal phê duyệt phân cấp
│       │   ├── shifts/            # Quản lý danh mục mẫu ca làm việc (SCR-10)
│       │   ├── reports/           # Trung tâm báo cáo xuất dữ liệu Excel/CSV (SCR-15)
│       │   └── settings/          # Cài đặt tham số hệ thống & ngưỡng luật lao động
│       ├── utils/                 # Các hàm tiện ích thuần túy (date, csv, conflict calc)
│       ├── styles/                # Hệ thống CSS Design Tokens (global.css, tokens.css)
│       └── test/                  # Toàn bộ 35 bài kiểm thử Vitest (100% Pass)
│
├── docs/                          # Kho tài liệu kỹ thuật chuẩn mực của dự án (19 files)
└── plans/                         # Kế hoạch triển khai & nhật ký thực thi qua các giai đoạn
```

---

## 3. PHÂN TÍCH CHI TIẾT 10 MODULE BACKEND (`com.company.hrms.modules`)

Toàn bộ Backend được tổ chức theo kiến trúc **Package-by-Feature**. Mỗi module là một đơn vị độc lập chứa đầy đủ các tầng: **Domain Entity**, **Repository**, **DTO**, **Service**, và **Controller**.

```
[Client Request] ──> [Controller] ──> [Service] ──> [Repository] ──> [MySQL Entity]
                          │               │
                     (Validates DTO)  (Business Logic & Transactions)
```

### Module 1: `auth` (Xác Thực & Phân Quyền Bảo Mật)
- **Đường dẫn:** [`com/company/hrms/modules/auth`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/auth)
- **Các thành phần chính:**
  - `User.java`, `Role.java`: Thực thể tài khoản người dùng, bảng liên kết `user_roles`.
  - `AuthService.java`: Xử lý đăng nhập, đối soát mật khẩu BCrypt, kiểm tra trạng thái khóa tài khoản (`locked_until`), cấp phát cặp Access Token (sống 24 giờ) và Refresh Token (sống 7 ngày).
  - `AuthController.java`: Cung cấp các endpoint:
    - `POST /api/v1/auth/login`: Xác thực và trả về Token cùng thông tin User.
    - `POST /api/v1/auth/refresh`: Cấp mới Access Token bằng Refresh Token.
    - `GET /api/v1/auth/me`: Lấy thông tin tài khoản đang đăng nhập kèm quyền hạn.

### Module 2: `department` (Quản Lý Phòng Ban & Cơ Cấu Tổ Chức)
- **Đường dẫn:** [`com/company/hrms/modules/department`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/department)
- **Nghiệp vụ cốt lõi:**
  - `Department.java`: Mô hình hóa phòng ban hỗ trợ cấu trúc cây phân cấp (`parent_department_id`) và chỉ định Trưởng phòng (`manager_id`).
  - Hỗ trợ kiểm tra tránh xóa phòng ban đang có nhân viên trực thuộc.

### Module 3: `position` (Danh Mục Chức Danh & Vị Trí Công Việc)
- **Đường dẫn:** [`com/company/hrms/modules/position`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/position)
- **Nghiệp vụ cốt lõi:**
  - `Position.java`: Quản lý các chức danh chuẩn trong doanh nghiệp (ví dụ: *Lập trình viên Senior*, *Trưởng nhóm Kinh doanh*, *Chuyên viên Tuyển dụng*).

### Module 4: `employee` (Quản Lý Hồ Sơ Nhân Sự)
- **Đường dẫn:** [`com/company/hrms/modules/employee`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee)
- **Nghiệp vụ cốt lõi:**
  - `Employee.java`: Quản lý toàn bộ thông tin nhân viên: Mã NV (`employee_code`), Họ tên, CCCD/CMND, Ngày sinh, Giới tính, Email, SĐT, Ngày vào làm, Trạng thái làm việc (`PROBATION`, `OFFICIAL`, `ON_LEAVE`, `RESIGNED`).
  - **Khóa lạc quan (Optimistic Locking):** Áp dụng `@Version` để ngăn chặn lỗi ghi đè dữ liệu khi 2 người cùng chỉnh sửa một hồ sơ đồng thời (ném ra HTTP 409 Conflict).
  - Tích hợp tìm kiếm đa điều kiện (Search Specification), lọc theo phòng ban, phân trang chuẩn 1-based.

### Module 5: `shift` (Danh Mục Mẫu Ca Làm Việc)
- **Đường dẫn:** [`com/company/hrms/modules/shift`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/shift)
- **Nghiệp vụ cốt lõi:**
  - `WorkShift.java`: Quản lý các mẫu ca chuẩn: Ca Sáng (`06:00 - 14:00`), Ca Hành Chính (`08:00 - 17:00`), Ca Chiều (`14:00 - 22:00`), Ca Đêm (`22:00 - 06:00` - cờ `is_cross_midnight = true`).
  - Cấu hình số phút nghỉ giữa ca, định mức nhân sự tối thiểu/tối đa (`min_staffing`, `max_staffing`), và mã màu nhận diện trên lưới lịch.

### Module 6: `schedule` (Ma Trận Xếp Ca & Engine Phát Hiện Xung Đột)
- **Đường dẫn:** [`com/company/hrms/modules/schedule`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule)
- **Nghiệp vụ cốt lõi:**
  - `Schedule.java`, `ShiftAssignment.java`: Quản lý lịch tuần theo phòng ban từ Thứ 2 đến Chủ nhật.
  - **Đóng băng mẫu ca (Snapshot Isolation):** Khi ca được gán, toàn bộ thông số thời gian, tên ca và màu sắc được copy trực tiếp vào bản ghi `shift_assignments`. Nhờ đó, việc sửa mẫu ca gốc trong tương lai không làm sai lệch lịch sử làm việc trong quá khứ.
  - **Conflict Detection Engine:** Thẩm tra trực tiếp 8 quy tắc luật lao động:
    - `BR-001`: Trùng lặp ca làm việc của cùng một nhân viên trong ngày.
    - `BR-002`: Phân ca cho nhân viên đã nghỉ việc (`RESIGNED`) hoặc bị vô hiệu hóa.
    - `BR-003`: Vi phạm thời gian nghỉ giữa 2 ca liên tiếp (nghỉ < 11 giờ theo Luật Lao Động 2019).
    - `BR-004`: Vượt quá trần 48 giờ làm việc theo kế hoạch trong tuần.
    - `BR-005`: Vượt quá trần 12 giờ làm việc trong một ngày.
    - `BR-006`: Phân ca trùng vào ngày đã được duyệt Nghỉ phép năm.
    - `BR-007`: Cảnh báo làm việc vào ngày Lễ, Tết của công ty.
    - `BR-008`: Cảnh báo thiếu hụt định mức nhân sự tối thiểu (`min_staffing`).
  - **Nhật ký thay đổi (`ScheduleChangeHistory`):** Tự động ghi lại lịch sử thêm/sửa/xóa ca sau khi lịch đã được Công bố (`PUBLISHED`).

### Module 7: `attendance` (Chấm Công & Giải Trình Giờ Công)
- **Đường dẫn:** [`com/company/hrms/modules/attendance`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/attendance)
- **Nghiệp vụ cốt lõi:**
  - `AttendanceRecord.java`: Ghi nhận dữ liệu check-in, check-out thời gian thực.
  - `AttendanceCalculationService.java`: Tự động tính toán số phút đi muộn (áp dụng thời gian ân hạn 5 phút), về sớm, tách bạch số giờ làm việc ban ngày và số giờ làm việc ban đêm trong khung giờ `22:00 - 06:00` (hưởng phụ cấp ca đêm).
  - `AttendanceCorrection.java`: Cho phép nhân viên nộp đơn giải trình quên quẹt thẻ, đính kèm lý do để cấp trên xem xét phê duyệt.

### Module 8: `leave` (Quản Lý Nghỉ Phép & Quỹ Phép Năm)
- **Đường dẫn:** [`com/company/hrms/modules/leave`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/leave)
- **Nghiệp vụ cốt lõi:**
  - `LeaveType.java`: Danh mục các loại nghỉ phép (Phép năm hưởng lương, Việc riêng, Ốm đau/BHXH, Nghỉ không lương).
  - `LeaveBalance.java`: Sổ cái quản lý quỹ phép theo năm: Số ngày được cấp, Số ngày đã dùng, Số ngày đang chờ duyệt, Số ngày còn lại.
  - `LeaveRequest.java`: Xử lý nộp đơn xin nghỉ, quy tắc `BR-009` ngăn chặn nộp trùng khoảng thời gian, và quy trình phê duyệt phân cấp của Quản lý.

### Module 9: `setting` (Cấu Hình Tham Số Hệ Thống)
- **Đường dẫn:** [`com/company/hrms/modules/setting`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/setting)
- **Nghiệp vụ cốt lõi:**
  - `SystemSetting.java`: Lưu trữ và cho phép quản trị viên tùy biến các tham số hoạt động (ngưỡng nghỉ giữa 2 ca 11h hoặc 12h, trần giờ tuần 48h, độ nghiêm ngặt của cảnh báo trùng phép).

### Module 10: `report` (Tổng Hợp Công & Xuất File Dữ Liệu)
- **Đường dẫn:** [`com/company/hrms/modules/report`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/report)
- **Nghiệp vụ cốt lõi:**
  - `ExcelExportService.java`: Sử dụng **Apache POI** sinh file Microsoft Excel `.xlsx` nguyên bản, hỗ trợ định dạng kẻ viền bảng, căn lề, tô màu header nhận diện thương hiệu.
  - `CsvExportService.java`: Xuất file `.csv` chuẩn RFC-4180 được chèn tiền tố **UTF-8 BOM (`\uFEFF`)**, giúp Microsoft Excel mở trực tiếp file tiếng Việt mà không bao giờ bị lỗi font.

---

## 4. PHÂN TÍCH CHI TIẾT 8 PHÂN HỆ FRONTEND (`frontend/src/features`)

Giao diện được xây dựng trên nền tảng **React 19 + TypeScript + Vite**, sử dụng kiến trúc phân cụm theo tính năng (**Feature-driven structure**).

```
[UI Component / View] ──> [Zustand Store] ──> [Domain Service] ──> [apiClient (Bearer Token)]
          │                       │
     (React Hooks)           (Local State & Optimistic UI)
```

### Feature 1: `schedule` (Ma Trận Phân Ca Tuần Thông Minh - Core Feature)
- **Tập tin chính:** [`SchedulePage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/SchedulePage.tsx), [`WeeklyGrid.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/components/WeeklyGrid.tsx), [`AssignShiftDrawer.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/dialogs/AssignShiftDrawer.tsx)
- **Chức năng:**
  - Lưới ma trận 8 cột (Cột cố định Nhân viên + 7 ngày trong tuần từ Thứ 2 đến Chủ nhật).
  - Hiển thị trực quan thẻ ca làm việc, thẻ nghỉ phép `[🏖️ PHÉP NĂM]`, biểu tượng ca đêm, huy hiệu cảnh báo xung đột (chấm vàng/đỏ).
  - Thanh tiến độ giờ công tuần hiển thị cảnh báo đỏ khi nhân viên được xếp vượt quá 48h.
  - Drawer bên phải gán ca làm việc: Cho phép chọn ca, kiểm tra vi phạm thời gian thực, nhập lý do ghi đè đối với cảnh báo vàng hoặc lý do điều chỉnh khi lịch đã công bố.
  - Bộ lọc linh hoạt: Lọc theo phòng ban, lọc chỉ xem nhân viên có xung đột ca, tìm kiếm theo tên/mã NV.
  - Các hộp thoại chức năng: Phân ca hàng loạt (`BulkAssignDialog`), Sao chép lịch tuần trước (`CopyWeekDialog`), Công bố lịch (`PublishConfirmDialog`), Xem lịch sử chỉnh sửa (`ChangeHistoryDrawer`).

### Feature 2: `dashboard` (Bảng Điều Khiển Tổng Quan)
- **Tập tin chính:** [`DashboardPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/DashboardPage.tsx), [`QuickAttendanceCard.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/dashboard/components/QuickAttendanceCard.tsx)
- **Chức năng:**
  - Tổng hợp các chỉ số KPI vận hành: Tổng số nhân sự, Số người đang đi làm hôm nay, Số ca trực đêm, Tỷ lệ đi làm đúng giờ.
  - Thẻ **Điểm Danh Nhanh**: Cho phép nhân viên bấm nút *Check-in vào ca* hoặc *Check-out kết thúc ca* chỉ với 1 click, hiển thị đồng hồ đếm thời gian làm việc trong ngày.

### Feature 3: `employees` (Quản Lý Danh Sách & Chi Tiết Nhân Sự)
- **Tập tin chính:** [`EmployeeListPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeListPage.tsx), [`EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx)
- **Chức năng:**
  - Danh sách nhân sự dạng bảng trực quan: Tìm kiếm thời gian thực, lọc theo phòng ban, phân trang.
  - Modal thêm mới và chỉnh sửa thông tin nhân sự.
  - Trang chi tiết hồ sơ: Xem thông tin lý lịch cá nhân, lịch sử phân ca các tuần, bảng chấm công gần nhất và các đơn xin nghỉ phép đã nộp.

### Feature 4: `attendance` (Giám Sát Chấm Công & Điểm Danh)
- **Tập tin chính:** [`AttendanceOverviewPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/attendance/AttendanceOverviewPage.tsx), [`AttendanceCorrectionModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/attendance/components/AttendanceCorrectionModal.tsx)
- **Chức năng:**
  - Giám sát toàn bộ trạng thái quẹt thẻ của toàn bộ nhân viên theo ngày: Có mặt, Đi muộn, Về sớm, Quên quẹt thẻ ra (`MISSING_CHECKOUT`).
  - Modal nộp và duyệt đơn giải trình giờ công.

### Feature 5: `leaves` (Quản Lý & Phê Duyệt Đơn Nghỉ Phép)
- **Tập tin chính:** [`LeaveRequestsPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/leaves/LeaveRequestsPage.tsx), [`LeaveRequestModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/leaves/components/LeaveRequestModal.tsx), [`LeaveApprovalModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/leaves/components/LeaveApprovalModal.tsx)
- **Chức năng:**
  - Bảng tổng hợp quỹ phép năm của cá nhân: Định mức, Đã nghỉ, Đang chờ duyệt, Số ngày phép còn lại.
  - Nộp đơn xin nghỉ mới: Tự động tính số ngày xin nghỉ, chặn nộp nếu vượt quá quỹ phép hoặc trùng thời gian.
  - Phê duyệt phân cấp dành cho Quản lý: Chấp thuận đơn (tự động trừ quỹ phép và gán thẻ phép sang bảng xếp ca tuần) hoặc Từ chối đơn có kèm lý do.

### Feature 6: `shifts` (Quản Lý Danh Mục Mẫu Ca Làm Việc)
- **Tập tin chính:** [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx), [`ShiftTemplateModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/components/ShiftTemplateModal.tsx)
- **Chức năng:**
  - Quản lý các mẫu ca chuẩn: Tên ca, Giờ bắt đầu, Giờ kết thúc, Thời gian nghỉ, Định mức quân số, Bảng chọn màu sắc trực quan (Color Picker).

### Feature 7: `reports` (Trung Tâm Xuất Báo Cáo & Dữ Liệu)
- **Tập tin chính:** [`ReportsPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/reports/ReportsPage.tsx), [`MonthlyAttendanceReport.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/reports/components/MonthlyAttendanceReport.tsx)
- **Chức năng:**
  - Xem bảng tổng hợp công tháng theo phòng ban.
  - Bấm nút **"Xuất file Excel (.xlsx)"**: Tải trực tiếp file Excel kẻ bảng đẹp mắt sinh từ Apache POI backend.
  - Bấm nút **"Xuất file CSV (.csv)"**: Tải file CSV định dạng UTF-8 BOM hiển thị chuẩn tiếng Việt trên máy tính người dùng.

### Feature 8: `settings` (Cấu Hình Quy Tắc & Luật Lao Động)
- **Tập tin chính:** [`SettingsPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/settings/SettingsPage.tsx)
- **Chức năng:**
  - Điều chỉnh các thông số vận hành: Chuyển đổi thời gian nghỉ tối thiểu giữa 2 ca liên tiếp (11h hoặc 12h), thay đổi thời gian ân hạn điểm danh, cấu hình mức độ cảnh báo vi phạm.

---

## 5. CƠ CHẾ QUẢN LÝ TRẠNG THÁI & DỊCH VỤ (STORE & SERVICE LAYER)

### 1. Quản lý trạng thái (Zustand Stores)
Frontend sử dụng **Zustand** làm kho lưu trữ trạng thái tập trung thay vì Redux cồng kềnh, mang lại hiệu năng tối đa và mã nguồn ngắn gọn:
- [`useAuthStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/store/useAuthStore.ts): Tự động cấp Token ban đầu qua Auto-Auth Bootstrap, lưu `access_token` vào `localStorage`, quản lý vai trò hiện tại và tự động đăng nhập khi đổi vai trò qua `RoleSwitcher`.
- [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/store/useScheduleStore.ts): Quản lý toàn bộ vòng đời của lịch tuần, đồng bộ `scheduleId` và version JPA từ MySQL, quản lý bản đồ ca `assignmentsMap`, lưu trữ ca trực tiếp vào CSDL.
- [`useAttendanceStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/store/useAttendanceStore.ts): Lưu trữ danh sách chấm công, phát lệnh Check-in / Check-out đến máy chủ.
- [`useLeaveStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/store/useLeaveStore.ts): Quản lý sổ cái nghỉ phép, duyệt đơn và kích hoạt đồng bộ thẻ phép sang ma trận lịch.
- [`useUIStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/store/useUIStore.ts): Quản lý danh sách thông báo Toast (thành công, cảnh báo, lỗi) hiển thị góc màn hình.

### 2. Tầng Dịch vụ (Service Layer & apiClient)
- [`apiClient.ts`](file:///D:/Project/Employee%20Management/frontend/src/services/apiClient.ts):
  - Tự động lấy JWT token từ `localStorage` và tiêm vào header `Authorization: Bearer <token>`.
  - Làm phẳng phong bì dữ liệu chuẩn (`ApiResponse<T>` -> trả về trực tiếp `data`).
  - Tự động nhận diện `Content-Type` nhị phân (`spreadsheetml`, `text/csv`) để chuyển thành `Blob` và kích hoạt trình tải file của trình duyệt.
- **7 Dịch vụ miền:** [`authService`](file:///D:/Project/Employee%20Management/frontend/src/services/authService.ts), [`departmentService`](file:///D:/Project/Employee%20Management/frontend/src/services/departmentService.ts), [`employeeService`](file:///D:/Project/Employee%20Management/frontend/src/services/employeeService.ts), [`scheduleService`](file:///D:/Project/Employee%20Management/frontend/src/services/scheduleService.ts), [`attendanceService`](file:///D:/Project/Employee%20Management/frontend/src/services/attendanceService.ts), [`leaveService`](file:///D:/Project/Employee%20Management/frontend/src/services/leaveService.ts), [`reportService`](file:///D:/Project/Employee%20Management/frontend/src/services/reportService.ts).

---

## 6. MÔ HÌNH CƠ SỞ DỮ LIỆU MYSQL (`hrms_db`)

Hệ thống cơ sở dữ liệu được quản lý tự động bằng **Flyway Migrations** qua 3 tệp kịch bản:

```
[V1__init_schema.sql] ──> [V2__seed_master_data.sql] ──> [V3__seed_admin_user.sql]
   (Tạo 17 bảng)               (Dữ liệu mẫu ca, phòng ban)       (Tài khoản & phân quyền)
```

| Tên Bảng (Table) | Mô tả Nghiệp Vụ | Quan Hệ Khóa Ngoại (Foreign Keys) |
| :--- | :--- | :--- |
| `users` | Tài khoản đăng nhập hệ thống, mật khẩu hash BCrypt | - |
| `roles` | Danh mục vai trò: ADMIN, HR_MANAGER, DEPT_MANAGER, EMPLOYEE | - |
| `user_roles` | Bảng liên kết đa-đa giữa Người dùng và Vai trò | `user_id -> users`, `role_id -> roles` |
| `departments` | Danh mục phòng ban, hỗ trợ cây phân cấp | `parent_department_id -> departments`, `manager_id -> employees` |
| `positions` | Danh mục chức danh, vị trí việc làm | - |
| `employees` | Hồ sơ nhân sự, trạng thái hợp đồng, khóa `@Version` | `department_id -> departments`, `position_id -> positions`, `manager_id -> employees`, `user_id -> users` |
| `work_shifts` | Danh mục mẫu ca làm việc, cờ qua đêm, màu sắc | - |
| `schedules` | Quản lý kỳ lịch theo tuần và phòng ban, trạng thái DRAFT/PUBLISHED | `department_id -> departments` |
| `shift_assignments` | Bản ghi phân ca cụ thể của nhân viên, chứa dữ liệu đóng băng Snapshot | `schedule_id -> schedules`, `employee_id -> employees`, `work_shift_id -> work_shifts` |
| `schedule_change_history` | Nhật ký kiểm toán các thay đổi ca sau khi lịch đã công bố | `schedule_id -> schedules`, `shift_assignment_id -> shift_assignments`, `employee_id -> employees` |
| `attendance_records` | Bản ghi chấm công quẹt thẻ vào/ra, số phút muộn, giờ đêm, giờ OT | `employee_id -> employees`, `shift_assignment_id -> shift_assignments` |
| `attendance_corrections` | Đơn giải trình giờ công của nhân viên và lịch sử phê duyệt | `attendance_record_id -> attendance_records`, `employee_id -> employees`, `reviewed_by -> users` |
| `leave_types` | Danh mục loại nghỉ phép (phép năm, việc riêng, ốm đau, không lương) | - |
| `leave_balances` | Sổ cái quỹ phép năm của từng nhân viên theo từng năm | `employee_id -> employees`, `leave_type_id -> leave_types` |
| `leave_requests` | Đơn xin nghỉ phép và trạng thái phê duyệt | `employee_id -> employees`, `leave_type_id -> leave_types`, `tier1_reviewed_by -> users` |
| `company_holidays` | Lịch nghỉ Lễ, Tết chính thức của công ty | - |
| `system_settings` | Bảng cấu hình các tham số động theo Luật Lao Động 2019 | - |

---

## 7. HƯỚNG DẪN VẬN HÀNH DÀNH CHO DEVELOPER

### 1. Khởi động CSDL MySQL & Phân hệ Backend
Yêu cầu: Đã cài MySQL 8.0 lắng nghe cổng 3306 (database `hrms_db`, user `root`, password `123456`).
```powershell
cd "D:\Project\Employee Management\backend"
mvn spring-boot:run
```
- Máy chủ Spring Boot sẽ chạy tại: `http://localhost:8080`.
- Tài liệu API tương tác trực tiếp Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 2. Khởi động Phân hệ Frontend
```powershell
cd "D:\Project\Employee Management\frontend"
npm run dev
```
- Ứng dụng web mở tại: `http://localhost:5173`.
- Tự động gọi API thực tế tới Backend qua Reverse Proxy mà không gặp bất kỳ lỗi CORS nào.

### 3. Kiểm tra chất lượng & Chạy tự động kiểm thử
```powershell
# Kiểm thử Frontend (35 tests):
cd "D:\Project\Employee Management\frontend"
npm test -- --run

# Biên dịch Production Frontend:
npm run build

# Kiểm thử Backend (36 tests):
cd "D:\Project\Employee Management\backend"
mvn test
```

### 4. Tài khoản Đăng nhập & Thử nghiệm Mẫu
| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) | Nhân viên đại diện | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | **ROLE_ADMIN** | Đinh Thị Uyên (EMP-021) | Toàn quyền quản trị, cấu hình, xuất báo cáo, duyệt lịch |
| `manager` | `Admin@123` | **ROLE_DEPT_MANAGER** | Nguyễn Văn An (EMP-001) | Quản lý phòng ban, xếp ca tuần, duyệt đơn phép |
| `employee` | `Admin@123` | **ROLE_EMPLOYEE** | Trần Thị Bích (EMP-002) | Xem lịch làm việc cá nhân, chấm công, nộp đơn nghỉ |
