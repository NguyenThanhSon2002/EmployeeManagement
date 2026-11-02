# Session Journal - 2026-11-02 08:55

## Task Completed
- Chuẩn hoá cấu hình Docker Compose và triển khai toàn bộ ứng dụng (Database, Backend, Frontend).
- Khắc phục triệt để lỗi 403 Forbidden và lỗi phân quyền CORS / JWT khi deploy qua Docker.

## Implementation Details
1. **Environment Configuration**:
   - Tạo file [.env](file:///D:/Project/Employee%20Management/.env) với các cổng `FRONTEND_PORT=8082`, `SERVER_PORT=8081`, `DB_PORT=3308`, `JWT_SECRET`, và `CORS_ALLOWED_ORIGINS`.
   - Cập nhật [docker-compose.yml](file:///D:/Project/Employee%20Management/docker-compose.yml) với giá trị fallback an toàn cho tất cả các biến môi trường.
2. **Backend CORS Optimization**:
   - Cập nhật [application.yml](file:///D:/Project/Employee%20Management/backend/src/main/resources/application.yml) ánh xạ `cors.allowed-origins` linh hoạt qua biến môi trường `CORS_ALLOWED_ORIGINS`.
3. **Frontend Session & Redirect Fix**:
   - Cập nhật [apiClient.ts](file:///D:/Project/Employee%20Management/frontend/src/shared/api/apiClient.ts) để tự động xóa token và điều hướng về `/login` khi gặp lỗi xác thực `401` hoặc `403` thay vì treo lỗi trên Dashboard.
4. **Verification**:
   - `npm run build` trên Frontend thành công 100% (TypeScript và Vite bundle hoàn tất).
   - `mvn clean test-compile` trên Backend thành công 100% với 150 source files Java 21.
