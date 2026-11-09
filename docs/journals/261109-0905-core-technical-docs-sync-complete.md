# Journal Entry: Hoàn tất Đồng Bộ Hóa Toàn Diện Bộ Tài Liệu Kỹ Thuật Cốt Lõi (Core Technical Docs Suite)

- **Thời gian:** 09/11/2026 09:05:00
- **Kế hoạch liên quan:** [plans/261109-0847-core-technical-docs-sync/plan.md](../../plans/261109-0847-core-technical-docs-sync/plan.md)
- **Tác giả:** Antigravity AI Assistant

---

## 1. Mục Tiêu & Bối Cảnh
Sau chuỗi các sprint phát triển tính năng lớn gần đây (V1 -> V27 migrations, 14 modules Backend, 11 features Frontend, phân hệ In-app Notifications, Shift Handover Traceability, Open Shift Claiming, Multi-branch RBAC), hệ thống tài liệu kỹ thuật cốt lõi tồn tại các mâu thuẫn số liệu và tài liệu kiến trúc còn lưu giữ các thông tin lỗi thời (Ant Design, TanStack Query, Day.js, phòng ban cũ).

Nhiệm vụ: Đồng bộ hóa toàn diện, dứt điểm và nhất quán 100% giữa mã nguồn thực tế và 6 tài liệu kỹ thuật nền tảng của dự án.

---

## 2. Các Đầu Mục Đã Thực Hiện

### 2.1. `README.md`
- Cập nhật số lượng tính năng chính lên 9 phân hệ (bổ sung Trung tâm Thông báo nội bộ in-app `2.9`).
- Cập nhật hiện trạng dữ liệu: 27 Flyway migrations, 14 Backend modules, 11 Frontend features, 22 bảng thực thể JPA domain (25 bảng vật lý MySQL).
- Ghi nhận chi tiết tính năng Nhận ca trống (`POST /api/v1/schedules/assignments/claim`, `source = 'SELF_CLAIM'`) và Truy vết nhường ca (`transferred_from_employee_id`, giao diện `▾ 1 NV đã nhường ca`).
- Cập nhật ngăn xếp công nghệ: React 19, Zustand 5, Vanilla CSS Tokens, native `apiClient.ts`.

### 2.2. `docs/18-project-structure-and-modules-guide.md` (`DOC-18`)
- Nâng cấp lên Phiên bản 4.0.0.
- Liệt kê đầy đủ 14 Backend modules (chi tiết hóa `modules/notification/` với Entity, DTO, Repository, Service, Controller).
- Liệt kê đầy đủ 11 Frontend features (chi tiết hóa `features/notification/` với NotificationBell, Popover, Zustand store).
- Bổ sung bảng đối soát toàn bộ 27 Flyway migrations (`V1` $\rightarrow$ `V27`).
- Bổ sung bảng ánh xạ 22 thực thể JPA domain và bảng CSDL tương ứng.

### 2.3. `docs/database/DATA_DICTIONARY.md`
- Tái cấu trúc hoàn chỉnh theo chuẩn MySQL 8.0 và Flyway V1-V27.
- Ghi nhận đầy đủ 25 bảng vật lý (22 bảng thực thể JPA).
- Cập nhật biểu đồ Mermaid ERD bao quát toàn bộ liên kết giữa các bảng.
- Bổ sung đặc tả trường chi tiết cho các bảng mới: `employee_availabilities` (V8), `employee_secondary_branches` (V9, V10), `employee_preferred_shifts` (V11), `shift_swap_requests` (V17), `notifications` (V26, V27) và các trường mở rộng (`transferred_from_employee_id`, `source`, `opened_date`, `avatar_url`, `branch_id`).

### 2.4. `docs/03-database-design.md` (`DOC-03`)
- Nâng cấp lên Phiên bản 3.0.0.
- Loại bỏ hoàn toàn mô hình phòng ban cũ (`departments`), thay thế bằng cơ cấu đa cơ sở / chi nhánh (`branches`, `employee_secondary_branches`).
- Làm rõ nguyên tắc Snapshot Isolation bảo toàn tính bất biến ca làm việc (`work_shifts` $\rightarrow$ `shift_assignments`).
- Mô tả chi tiết cơ chế lưu vết hoán đổi & nhường ca trực (`transferred_from_employee_id`) và khóa lạc quan (`@Version`).

### 2.5. `docs/04-api-specification.md` (`DOC-04`)
- Nâng cấp lên Phiên bản 3.0.0.
- Quy chuẩn 77 RESTful endpoints tương thích với 14 Backend Controllers.
- Bổ sung đặc tả đầy đủ request/response payloads cho:
  - Phân hệ In-app Notifications (`/api/v1/notifications`).
  - Phân hệ Shift Swaps & Handovers (`/api/v1/shift-swaps`, simulate, peer-respond, manager-review, my-requests, branch-history).
  - Open Shift Claiming (`POST /api/v1/schedules/assignments/claim`).
  - Employee Avatars & Secondary Branches (`/api/v1/employees/{id}/avatar`, `secondary_branches`).
  - Employee Availabilities & Preferred Shifts (`/api/v1/employees/{id}/availability`).
- Chuẩn hóa 4 vai trò RBAC: `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`, `ROLE_ADMIN`.

### 2.6. `docs/05-architecture-and-tech-stack.md` (`DOC-05`)
- Nâng cấp lên Phiên bản 3.0.0.
- **Thanh lọc toàn diện Frontend:** Xóa bỏ hoàn toàn Ant Design, TanStack Query, React Hook Form, Zod, Day.js, `@ant-design/icons`.
- Ghi nhận ngăn xếp thực tế: React 19.2.8, TypeScript ~6.0.2, Vite ^8.3.0, Zustand ^5.0.15, Vanilla CSS Design Tokens, Date-fns ^4.4.0, Lucide React ^1.55.0, Oxlint ^1.81.0, native `apiClient.ts`.
- Bổ sung sơ đồ tuần tự Mermaid mô tả luồng phát sinh và phân phối thông báo nội bộ (Notification Event Pipeline).
- Giữ nguyên các phân tích kiến trúc giá trị: Biện hộ Modular Monolith và cơ chế Vite Dev Proxy IPv4 trên Windows.

---

## 3. Kết Quả Nghiệm Thu
- Toàn bộ 5 Phase trong Kế hoạch đã hoàn thành 100%.
- Không còn bất kỳ xung đột dữ liệu nào giữa 6 tài liệu.
- Mọi sơ đồ Mermaid đều biên dịch mượt mà không lỗi cú pháp.
