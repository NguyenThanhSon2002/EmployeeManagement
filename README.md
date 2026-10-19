# Employee Management & Shift Scheduling System (HRMS)

Hệ thống Quản lý Nhân sự, Ma trận Phân ca Thông minh & Chấm công tuân thủ **Bộ luật Lao động Việt Nam 2019**.

---

## 1. Công Nghệ & Kiến Trúc Tổng Thể

- **Backend:** Spring Boot 3.3.4, Java 21 LTS, Spring Security, JWT (Stateless), Spring Data JPA, Hibernate 6, Flyway Migration, Apache POI (Excel .xlsx), Swagger OpenAPI 3.
- **Frontend:** React 19, TypeScript, Vite, Zustand Store, Lucide Icons, WCAG 2.1 AA Design Tokens.
- **Kiến trúc Dual-Mode:** Hỗ trợ kết nối trực tiếp MySQL qua RESTful API trên trình duyệt (`VITE_USE_MOCK=false`) và cách ly hoàn toàn qua Mock Data khi chạy Unit Test (`MODE === 'test'`).
- **Cơ sở dữ liệu:** MySQL 8.0 với 17 bảng quan hệ có ràng buộc toàn vẹn, Optimistic Locking (`@Version`) và Audit Trail (`created_by`, `updated_by`).
- **DevOps:** Hỗ trợ multi-stage `Dockerfile` cho Backend & Frontend và `docker-compose.yml` điều phối toàn bộ hệ thống.

---

## 2. Cấu Trúc Thư Mục

```text
.
├── backend/            # Spring Boot 3.3.4 Server (Port 8080)
│   ├── Dockerfile      # Multi-stage Maven + Eclipse Temurin 21 JRE
│   ├── pom.xml
│   └── src/
├── frontend/           # React 19 Client (Port 5173 / Nginx Port 80)
│   ├── Dockerfile      # Multi-stage Node 20 + Nginx Alpine
│   ├── nginx.conf      # Cấu hình reverse proxy /api/ và SPA fallback
│   ├── package.json
│   └── src/
├── docs/               # 17 tài liệu kiến trúc, đặc tả nghiệp vụ & hướng dẫn
├── plans/              # Kế hoạch phát triển và kiểm toán qua các phase
├── docker-compose.yml  # Docker Compose điều phối MySQL + Backend + Frontend
└── .env.example        # Mẫu biến môi trường cho toàn bộ hệ thống
```

---

## 3. Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Sử dụng Docker Compose (Khuyên dùng)

1. Sao chép file cấu hình môi trường:
   ```bash
   cp .env.example .env
   ```
2. Khởi động toàn bộ cụm dịch vụ (MySQL, Backend, Frontend):
   ```bash
   docker compose up -d --build
   ```
3. Truy cập ứng dụng:
   - **Frontend UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API Docs (Swagger UI):** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Cách 2: Chạy Thủ Công Từng Phân Hệ (Local Dev)

#### Yêu cầu hệ thống:
- Java JDK 21+ & Apache Maven 3.9+
- Node.js 20+ & npm
- MySQL Server 8.0 đang chạy tại port 3306 (CSDL: `hrms_db`)

#### Bước 1: Khởi chạy Backend
```bash
cd backend
mvn clean spring-boot:run
```
*(Flyway sẽ tự động chạy migration V1, V2, V3 khởi tạo bảng và nạp dữ liệu mẫu ban đầu)*

#### Bước 2: Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
Trình duyệt sẽ mở tại [http://localhost:5173](http://localhost:5173).

---

## 4. Tài Khoản Khởi Tạo Mẫu (Seed Accounts)

| Tên Đăng Nhập | Vai Trò (Role) | Mật Khẩu Mặc Định | Quyền Hạn |
| :--- | :--- | :---: | :--- |
| `admin` | `ROLE_DIRECTOR` | `Admin@123` | Giám đốc: Toàn quyền điều hành, quản trị tài khoản, cài đặt hệ thống |
| `manager` | `ROLE_MANAGER` | `Admin@123` | Quản lý cơ sở: Xếp ca tuần cho chi nhánh, quản lý nhân sự tại cơ sở, duyệt công/phép |
| `employee` | `ROLE_EMPLOYEE` | `Admin@123` | Nhân viên: Điểm danh check-in/out, đăng ký lịch khả dụng, nộp đơn phép, xem ca cá nhân |

*(Mật khẩu có thể tùy biến qua biến môi trường `VITE_DEFAULT_AUTH_PASSWORD` và Flyway migration)*

---

## 5. Kiểm Thử Hệ Thống (Automated Testing)

- **Frontend Unit & Component Tests (Vitest):**
  ```bash
  cd frontend
  npm test -- --run
  npm run build
  ```
- **Backend Integration Tests (Maven Surefire):**
  ```bash
  cd backend
  mvn test
  ```
