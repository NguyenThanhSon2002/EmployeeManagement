# TÀI LIỆU 17: BÁO CÁO BRAINSTORMING & ĐỊNH HƯỚNG PHÁT TRIỂN BACKEND
**Dự án:** Employee Management System (HRMS & Shift Scheduling)  
**Ngày thực hiện:** 16/10/2026  
**Trạng thái:** Confirmed / Baseline  
**Kiến trúc:** Modular Monolith (Package-by-Feature)  
**Công nghệ:** Java 21 LTS, Spring Boot 3.3.x, Apache Maven, MySQL 8.0, Flyway, MapStruct  

---

## 1. BỐI CẢNH & PHẠM VI (CONTEXT & SCOPE)

1. **Frontend:**
   - Đã xây dựng hoàn chỉnh giao diện bằng React 18/19, TypeScript, Ant Design 5.x, Tailwind CSS, Lucide icons.
   - Giao diện đáp ứng đầy đủ các màn hình: Tổng quan (Dashboard), Hồ sơ nhân sự (Employees), Ma trận xếp ca tuần (Schedule Matrix Grid), Chấm công (Attendance), Đơn từ & Nghỉ phép (Leaves), Báo cáo (Reports), Cài đặt hệ thống (Settings).
   - Kiểm thử Unit Test 35/35 test cases pass, build production sạch sẽ.

2. **Backend:**
   - Cần xây dựng mới hoàn toàn trong thư mục `backend/`.
   - Môi trường máy chủ phát triển đã xác thực:
     - **Java:** OpenJDK 26.0.2 (tương thích hoàn hảo với Java 21 LTS syntax & bytecodes).
     - **Maven:** Apache Maven 3.9.16.
     - **Database:** Dịch vụ MySQL 8.0 (`MySQL80`) đang hoạt động sẵn sàng.

---

## 2. KẾT QUẢ ĐÁNH GIÁ CÁC PHƯƠNG ÁN KIẾN TRÚC

| Tiêu chí | Phương án 1: Modular Monolith (Spring Boot 3.3 + JPA + Flyway) *(ĐÃ CHỌN)* | Phương án 2: Spring Boot 3.3 + jOOQ / MyBatis | Phương án 3: Hexagonal / Clean Architecture |
|---|---|---|---|
| **Mô tả** | Đóng gói theo Bounded Context (`Package-by-Feature`), Spring Data JPA, Hibernate 6, MapStruct, Flyway migration. | Thay thế JPA bằng jOOQ / MyBatis để kiểm soát 100% câu lệnh SQL thuần. | Tách biệt hoàn toàn Domain Core (Pure Java) với các Ports & Adapters bên ngoài. |
| **Ưu điểm** | - Khớp 100% với tài liệu thiết kế có sẵn (`docs/05`, `docs/03`, `docs/04`).<br>- Tốc độ phát triển nhanh, giảm mã lặp thừa nhờ JPA & MapStruct.<br>- Đảm bảo toàn vẹn giao dịch ACID cho nghiệp vụ xếp ca.<br>- Quản lý phiên bản CSDL chặt chẽ qua Flyway. | - Kiểm soát tối ưu các câu truy vấn phức tạp của ma trận ca làm việc tuần.<br>- Tránh hoàn toàn lỗi Hibernate N+1. | - Độc lập tuyệt đối với framework.<br>- Dễ dàng cô lập để unit test Conflict Engine mà không cần Spring context. |
| **Nhược điểm** | - Cần tối ưu Fetch Plan (`@EntityGraph`, DTO projection) để tránh N+1 khi load ma trận ca. | - Tốn nhiều thời gian viết SQL thủ công cho các bảng CRUD cơ bản (Phòng ban, Chức danh, Cài đặt).<br>- Tăng chi phí bảo trì. | - Quá phức tạp (vi phạm YAGNI/KISS) đối với hệ thống SME quy mô 50–300 nhân sự.<br>- Phát sinh gấp 3 lần DTO và Mapper trung gian. |
| **Kết luận** | **LỰA CHỌN TỐI ƯU NHẤT (Score: 9.5/10)** | Đánh giá: 7.0/10 | Đánh giá: 6.0/10 (Over-engineering) |

---

## 3. THIẾT KẾ KIẾN TRÚC CHI TIẾT

### 3.1. Ngăn xếp Công nghệ
- **Ngôn ngữ:** Java 21 LTS (sử dụng Record, Pattern Matching, Sealed Classes, Virtual Threads).
- **Framework:** Spring Boot 3.3.x (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-security`).
- **Database & Migration:** MySQL 8.0, Flyway Migration (`V1__init_schema.sql`, `V2__seed_master_data.sql`).
- **Bảo mật:** Spring Security 6 với Stateless JWT Authentication, bcrypt password hashing.
- **Mapping & Utilities:** MapStruct 1.5.x, Lombok, Springdoc OpenAPI 2.5 (Swagger UI).
- **Testing:** JUnit 5, Mockito, AssertJ.

### 3.2. Cấu trúc Gói Nghiệp vụ (Package-by-Feature)
```text
backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/company/hrms/
    │   │   ├── HrmsApplication.java
    │   │   ├── common/              # BaseEntity, ApiResponse, GlobalExceptionHandler, DateTimeUtils
    │   │   ├── security/            # SecurityConfig, JwtTokenProvider, JwtFilter, UserPrincipal
    │   │   └── modules/             # Bounded Contexts
    │   │       ├── auth/            # Login, RefreshToken, Password Change
    │   │       ├── employee/        # Employee, Department, Position
    │   │       ├── shift/           # ShiftTemplate (Mẫu ca)
    │   │       ├── schedule/        # Schedule, ShiftAssignment, ConflictDetectionEngine
    │   │       ├── attendance/      # AttendanceRecord, AttendanceCorrection
    │   │       ├── leave/           # LeaveRequest, LeaveBalance, Holiday
    │   │       ├── report/          # Attendance & Schedule Exporters
    │   │       └── setting/         # SystemSettings
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/migration/        # Flyway SQL scripts
```

### 3.3. Xử lý Nghiệp vụ Cốt lõi
1. **Snapshots Bất biến trong Phân ca (`shift_assignments`):**
   - Lưu trữ các trường snapshot: `snapshot_start_time`, `snapshot_end_time`, `snapshot_shift_name`, `snapshot_color_code` khi gán ca để đảm bảo lịch sử và đối chiếu chấm công không bị biến dạng khi chỉnh sửa mẫu ca gốc.
2. **Conflict Detection Engine (BR-001 đến BR-007):**
   - Kiểm tra trùng ca (`ERR_SHIFT_OVERLAP`), vượt quá thời lượng tối đa/ngày, vi phạm khoảng nghỉ tối thiểu (11-12h giữa 2 ca), trùng ngày phép đã duyệt (`ERR_LEAVE_OVERLAP`).
   - Cung cấp endpoint mô phỏng kiểm tra (Dry-run Validation): `POST /api/v1/schedules/{id}/validate`.
3. **Kiểm soát Khóa lạc quan (Optimistic Locking):**
   - Cột `version` trên `schedules` và `shift_assignments` ngăn chặn ghi đè lịch xếp ca khi hai quản lý cùng thao tác tại một thời điểm (`OPTIMISTIC_LOCK_CONFLICT`).

---

## 4. KẾ HOẠCH TRIỂN KHAI 3 GIAI ĐOẠN

```mermaid
flowchart LR
    P1["Giai đoạn 1: Nền tảng, DB & Master Data"] --> P2["Giai đoạn 2: Xếp ca & Core Conflict Engine"]
    P2 --> P3["Giai đoạn 3: Chấm công, Phép & Báo cáo"]
```

### Giai đoạn 1: Khung kiến trúc, Cơ sở dữ liệu & Master Data
- Thiết lập thư mục `backend/` với `pom.xml` chuẩn Maven (Java 21, Spring Boot 3.3.x).
- Thiết lập kết nối MySQL và cấu hình Flyway migration (khởi tạo 17+ bảng schema chuẩn UTF8MB4).
- Xây dựng Module `security` (JWT token generator, Auth filter, Login/Profile API).
- Xây dựng Module `employee`, `department`, `position` (CRUD, phân trang, tìm kiếm, soft delete).

### Giai đoạn 2: Quản lý Ca, Ma trận Xếp ca & Conflict Engine
- Xây dựng Module `shift` (Quản lý các mẫu ca làm việc: Ca sáng, Ca chiều, Ca đêm qua ngày).
- Xây dựng Module `schedule`:
  - Quản lý tuần làm việc (`schedules`), gán ca (`shift_assignments`) với snapshots bất biến.
  - Xây dựng `ConflictDetectionEngine` kiểm tra 7 quy tắc BR-001 -> BR-007.
  - Hỗ trợ Publish, Draft, Archive và ghi nhận lịch sử thay đổi (`schedule_change_history`).

### Giai đoạn 3: Chấm công, Quản lý Nghỉ phép, Báo cáo & Hoàn thiện
- Xây dựng Module `attendance`: Chấm công Web, tự động tính giờ công/giờ làm đêm/đi muộn về sớm, giải trình chấm công.
- Xây dựng Module `leave`: Nộp đơn xin nghỉ, phê duyệt cấp 1/cấp 2, tính trừ quỹ phép.
- Xây dựng Module `report`: Tổng hợp bảng công tháng, xuất file Excel/CSV.
- Tích hợp End-to-End giữa Frontend và Backend, kiểm thử toàn diện.

---

## 5. RỦI RO & BIỆN PHÁP PHÒNG NGỪA

| Rủi ro kỹ thuật | Mức độ | Biện pháp phòng ngừa |
|---|:---:|---|
| Hibernate N+1 khi load ma trận ca tuần cho nhiều nhân viên | Cao | Dùng `@EntityGraph` hoặc viết JPQL Query chuyên dụng JOIN FETCH `shift_assignments` trong tuần. |
| Lệch múi giờ giữa Frontend và Backend khi xử lý ca qua đêm | Trung bình | Lưu trữ tuyệt đối `planned_start_time` và `planned_end_time` dạng ISO-8601 UTC trong CSDL; ngày lịch nghiệp vụ dùng kiểu `DATE`. |
| Tranh chấp cập nhật đồng thời khi xếp ca | Trung bình | Kích hoạt `@Version` trên Entity JPA và xử lý bắt ngoại lệ `OptimisticLockException` trả về mã lỗi `OPTIMISTIC_LOCK_CONFLICT`. |
