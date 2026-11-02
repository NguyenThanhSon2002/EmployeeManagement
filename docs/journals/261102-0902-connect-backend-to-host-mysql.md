# Session Journal - 2026-11-02 09:02

## Task Completed
- Cấu hình Backend Docker kết nối trực tiếp vào MySQL thật trên Windows host (cơ sở dữ liệu đang mở trên DataGrip tại port 3306).

## Key Changes
1. **[.env](file:///D:/Project/Employee%20Management/.env)**:
   - Đặt `DB_HOST=host.docker.internal`
   - Đặt `DB_PORT=3306` (port MySQL máy Windows)
2. **[docker-compose.yml](file:///D:/Project/Employee%20Management/docker-compose.yml)**:
   - Thêm `extra_hosts: ["host.docker.internal:host-gateway"]` vào `hrms-backend` để container có thể gọi ra IP máy host một cách tin cậy.
   - Trỏ `DB_HOST` về `${DB_HOST:-host.docker.internal}` và `DB_PORT` về `${DB_PORT:-3306}`.
   - Tháo gỡ ràng buộc phụ thuộc `depends_on: mysql` để backend kết nối thẳng tới MySQL máy thật mà không cần đợi container mysql.
