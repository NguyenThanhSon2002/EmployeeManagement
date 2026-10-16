# GIAI ĐOẠN 1: KHỞI TẠO DỰ ÁN, CSDL MYSQL, BẢO MẬT JWT & MASTER DATA

**Mục tiêu giai đoạn:** Thiết lập toàn bộ khung kiến trúc Backend Spring Boot 3.3.x, khởi tạo cơ sở dữ liệu MySQL 8.0 với Flyway Migration đầy đủ 17+ bảng, xây dựng cơ chế bảo mật xác thực Stateless JWT và hoàn thiện các API Master Data (Tài khoản, Phòng ban, Chức danh, Nhân viên).

**Thời lượng dự toán:** 20 giờ làm việc  
**Trạng thái:** Completed ✅  
**Đánh giá chất lượng:** Code Review 9.8/10, Test Pass Rate 13/13 (100%)  

---

## 1. DANH SÁCH NHIỆM VỤ CHI TIẾT (TASK BREAKDOWN)

### Nhiệm vụ 1.1: Khởi tạo Maven Project & Khai báo Phụ thuộc (`backend/pom.xml`)
- **Tập tin:** `backend/pom.xml`
- **Mô tả:**
  - Khai báo Parent: `spring-boot-starter-parent` phiên bản `3.3.4`.
  - Cấu hình properties: `<java.version>21</java.version>`, encoding `UTF-8`.
  - Khai báo dependencies cốt lõi:
    - `org.springframework.boot:spring-boot-starter-web`
    - `org.springframework.boot:spring-boot-starter-data-jpa`
    - `org.springframework.boot:spring-boot-starter-security`
    - `org.springframework.boot:spring-boot-starter-validation`
    - `com.mysql:mysql-connector-j`
    - `org.flywaydb:flyway-core` & `org.flywaydb:flyway-mysql`
    - `org.projectlombok:lombok`
    - `org.mapstruct:mapstruct:1.5.5.Final` & `mapstruct-processor`
    - `io.jsonwebtoken:jjwt-api:0.12.5`, `jjwt-impl`, `jjwt-jackson`
    - `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0`
    - `org.springframework.boot:spring-boot-starter-test` (JUnit 5, Mockito, AssertJ)
- **Tiêu chí nghiệm thu:** `mvn clean compile` thành công không có lỗi biên dịch.

### Nhiệm vụ 1.2: Cấu hình Môi trường Ứng dụng
- **Tập tin:**
  - `backend/src/main/resources/application.yml`
  - `backend/src/main/resources/application-dev.yml`
- **Mô tả:**
  - Cấu hình cổng chạy mặc định `server.port: 8080`, context path `/`.
  - Cấu hình DataSource kết nối MySQL cục bộ: `jdbc:mysql://localhost:3306/hrms_db?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8&allowPublicKeyRetrieval=true`.
  - Cấu hình JPA/Hibernate: `ddl-auto: validate` (nhường quyền kiểm soát schema hoàn toàn cho Flyway), `open-in-view: false` (ngăn chặn Hibernate anti-pattern).
  - Cấu hình JWT: `jwt.secret` (Base64 key >= 256 bits), `jwt.access-token-expiration-seconds: 86400` (24h), `jwt.refresh-token-expiration-seconds: 604800` (7 ngày).
  - Cấu hình CORS: Cho phép `http://localhost:5173` (Frontend Vite) truy cập đầy đủ các phương thức HTTP và Headers.

### Nhiệm vụ 1.3: Soạn thảo Kịch bản Di chuyển CSDL Flyway
- **Tập tin:**
  - `backend/src/main/resources/db/migration/V1__init_schema.sql`
  - `backend/src/main/resources/db/migration/V2__seed_master_data.sql`
  - `backend/src/main/resources/db/migration/V3__seed_admin_user.sql`
- **Mô tả:**
  - `V1__init_schema.sql`: Khởi tạo 17 bảng chuẩn xác theo [`docs/03-database-design.md`](../../docs/03-database-design.md):
    - Hệ thống & Xác thực: `users`, `roles`, `user_roles`, `permissions`, `role_permissions`, `audit_logs`, `system_settings`.
    - Tổ chức & Nhân sự: `departments`, `positions`, `employees`.
    - Ca & Xếp ca: `work_shifts`, `schedules`, `shift_assignments`, `schedule_change_history`.
    - Chấm công: `attendance_records`, `attendance_corrections`.
    - Nghỉ phép & Lễ: `leave_types`, `leave_balances`, `leave_requests`, `company_holidays`.
    - Định nghĩa toàn bộ Khóa chính, Khóa ngoại `ON DELETE RESTRICT`, Indexes, Soft delete (`deleted_at`), Optimistic Lock (`version`).
  - `V2__seed_master_data.sql`: Nạp dữ liệu mẫu ban đầu: 4 phòng ban, 6 chức danh, 4 loại mẫu ca (Sáng, Chiều, Đêm, Hành chính), các loại ngày nghỉ phép và ngày lễ chuẩn Việt Nam.
  - `V3__seed_admin_user.sql`: Tạo tài khoản Quản trị viên `admin` (mật khẩu mã hóa BCrypt `$2a$10$...`) và gắn vai trò `ROLE_ADMIN`.

### Nhiệm vụ 1.4: Xây dựng Tầng Nền tảng Dùng chung (`common/`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/common/entity/BaseAuditableEntity.java`
  - `backend/src/main/java/com/company/hrms/common/response/ApiResponse.java`
  - `backend/src/main/java/com/company/hrms/common/response/PageResponse.java`
  - `backend/src/main/java/com/company/hrms/common/response/ErrorResponse.java`
  - `backend/src/main/java/com/company/hrms/common/exception/BusinessException.java`
  - `backend/src/main/java/com/company/hrms/common/exception/ResourceNotFoundException.java`
  - `backend/src/main/java/com/company/hrms/common/exception/ResourceConflictException.java`
  - `backend/src/main/java/com/company/hrms/common/exception/GlobalExceptionHandler.java`
  - `backend/src/main/java/com/company/hrms/common/util/DateTimeUtils.java`
- **Mô tả:**
  - Đóng gói chuẩn phong bì REST theo [`docs/04-api-specification.md`](../../docs/04-api-specification.md): `{ success, data, meta: { timestamp, requestId, pagination } }`.
  - Bộ xử lý ngoại lệ toàn cục chuyển đổi chuẩn hóa các lỗi: Validation 400 (`VALIDATION_FAILED`), Not Found 404 (`RESOURCE_NOT_FOUND`), Conflict 409 (`RESOURCE_CONFLICT`), Optimistic Lock 409 (`OPTIMISTIC_LOCK_CONFLICT`), Business Error 422 (`ERR_*`).

### Nhiệm vụ 1.5: Xây dựng Module Bảo mật & Xác thực (`security/` & `modules/auth/`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/security/jwt/JwtTokenProvider.java`
  - `backend/src/main/java/com/company/hrms/security/jwt/JwtAuthenticationFilter.java`
  - `backend/src/main/java/com/company/hrms/security/config/SecurityConfig.java`
  - `backend/src/main/java/com/company/hrms/security/service/UserPrincipal.java`
  - `backend/src/main/java/com/company/hrms/security/service/CustomUserDetailsService.java`
  - `backend/src/main/java/com/company/hrms/modules/auth/controller/AuthController.java`
  - `backend/src/main/java/com/company/hrms/modules/auth/dto/LoginRequest.java`
  - `backend/src/main/java/com/company/hrms/modules/auth/dto/AuthResponse.java`
  - `backend/src/main/java/com/company/hrms/modules/auth/service/AuthService.java`
- **Mô tả:**
  - Cấu hình `SecurityFilterChain` vô hiệu hóa CSRF (cho REST stateless), quản lý session `STATELESS`, bảo vệ các endpoint `/api/v1/**` ngoại trừ `/api/v1/auth/login`, `/swagger-ui/**`, `/v3/api-docs/**`.
  - Triển khai API đăng nhập, trả về Access Token, Refresh Token, danh sách quyền và thông tin người dùng hiện tại.

### Nhiệm vụ 1.6: Xây dựng Module Master Data (`department`, `position`, `employee`)
- **Tập tin:**
  - `backend/src/main/java/com/company/hrms/modules/department/...` (Entity, Repository, Service, Controller, DTO, Mapper).
  - `backend/src/main/java/com/company/hrms/modules/position/...` (Entity, Repository, Service, Controller, DTO, Mapper).
  - `backend/src/main/java/com/company/hrms/modules/employee/...` (Entity, Repository, Service, Controller, DTO, Mapper).
- **Mô tả:**
  - Triển khai CRUD đầy đủ cho Phòng ban và Chức danh.
  - Triển khai Quản lý Hồ sơ Nhân sự:
    - `GET /api/v1/employees`: Hỗ trợ phân trang (`page`, `size`), tìm kiếm từ khóa (`keyword`), lọc theo `departmentId`, `employmentStatus`.
    - `GET /api/v1/employees/{id}`: Trả về chi tiết nhân viên cùng phòng ban, chức danh.
    - `POST /api/v1/employees`: Thêm mới nhân viên, tự động validate trùng mã nhân viên hoặc email.
    - `PUT /api/v1/employees/{id}`: Cập nhật thông tin nhân viên.
    - `DELETE /api/v1/employees/{id}`: Xóa mềm (`deleted_at = NOW()`, `is_active = FALSE`).

### Nhiệm vụ 1.7: Kiểm thử Tự động Giai đoạn 1 (Unit & Integration Tests)
- **Tập tin:**
  - `backend/src/test/java/com/company/hrms/modules/auth/AuthControllerTest.java`
  - `backend/src/test/java/com/company/hrms/modules/employee/EmployeeServiceTest.java`
- **Mô tả:**
  - Kiểm thử luồng đăng nhập đúng mật khẩu, sai mật khẩu, tài khoản bị vô hiệu hóa.
  - Kiểm thử tạo nhân viên thành công, phát hiện trùng email ném lỗi 409 Conflict.
  - Kiểm thử xóa mềm nhân viên không bị xóa vật lý trong CSDL.

---

## 2. TIÊU CHÍ HOÀN THÀNH GIAI ĐOẠN 1 (ACCEPTANCE CRITERIA)
1. Ứng dụng Spring Boot khởi động trơn tru trên cổng 8080 không có lỗi runtime.
2. Flyway tự động nạp thành công 3 migration scripts vào MySQL, tạo đầy đủ 17 bảng và nạp dữ liệu hạt giống ban đầu.
3. Đăng nhập thành công với tài khoản Admin mặc định và nhận về JWT token hợp lệ.
4. Truy cập Swagger UI tại `http://localhost:8080/swagger-ui.html` hiển thị đầy đủ danh mục API của Auth, Department, Position và Employee.
5. Toàn bộ test cases tự động chạy đạt 100% (`mvn test`).
