# Nhật Ký Kỹ Thuật: Brainstorm & Lập Kế Hoạch Viết Lại Tài Liệu Dự Án (DOC-18 & README.md)

- **Ngày:** 03/11/2026
- **Nhánh:** `dev`
- **Tác giả:** Antigravity (AI Assistant) & User
- **Trạng thái:** Brainstorm và Lập kế hoạch `/xd:plan` hoàn tất; đã thống nhất định hướng Enterprise Showcase cho `README.md` và đồng bộ 100% kỹ thuật cho `DOC-18`.

---

## 1. Bối Cảnh & Yêu Cầu
- **Yêu cầu từ người dùng:** Đọc kỹ codebase thực tế của dự án và viết lại 2 tài liệu:
  1. `D:\Project\Employee Management\docs\18-project-structure-and-modules-guide.md`
  2. `D:\Project\Employee Management\README.md`
  3. Đặc biệt: `README.md` chỉ viết tổng quan, không viết chi tiết các thông tin mật ra ngoài.

## 2. Kết Quả Khảo Sát Codebase & Phát Hiện Vấn Đề
1. **Sai lệch kỹ thuật trong tài liệu cũ DOC-18:**
   - Cơ sở dữ liệu: Tài liệu ghi 17 bảng và Flyway V1->V7; thực tế có **23 Flyway migrations (`V1 -> V23`)** và **21 bảng dữ liệu** (20 JPA Entities + `user_roles`). Đã phát triển thêm các bảng `branches`, `employee_secondary_branches`, `employee_availabilities`, `employee_preferred_shifts`, `shift_swap_requests`.
   - Backend modules: Cũ ghi 10 modules (`department`...); thực tế có **13 modules nghiệp vụ** độc lập (`attendance`, `auth`, `availability`, `branch`, `dashboard`, `employee`, `leave`, `position`, `report`, `schedule`, `setting`, `shift`, `swap`).
   - Động cơ xếp ca: Cũ ghi 8 rules; thực tế có **9 rules** kiểm soát tuân thủ Luật Lao Động 2019 và luân chuyển cơ sở cùng logic Shift Handover.
   - Frontend architecture: Đã chuyển đổi hoàn toàn `department` sang `branches` (`BranchesPage.tsx`, `branchService.ts`), không còn dùng Vitest hay thư mục `__tests__` ảo.
   - Backend tests: Có 5 bộ test suites JUnit 5 (13 test cases) bao phủ các bài toán phân quyền, bàn giao ca, đổi ca, luân chuyển nhân sự.
2. **Rủi ro rò rỉ thông tin mật (Security Vulnerabilities):**
   - `README.md` và `DOC-18` cũ đang in công khai tài khoản admin và mật khẩu mặc định (`Admin@123`, `emp001@123`, `123456`).
   - Thống nhất loại bỏ 100% mật khẩu thật trong cả 2 tài liệu; chỉ mô tả kiến trúc xác thực Stateless JWT, mã hóa BCrypt, RBAC phân cấp và quy trình tự động cấp phát tài khoản `EmployeeUserProvisioningRunner`.

## 3. Quyết Định Kiến Trúc & Tài Liệu Đã Thiết Lập
- **Tài liệu Brainstorm Report:** [docs/brainstorms/261103-0851-project-documentation-rewrite.md](file:///D:/Project/Employee%20Management/docs/brainstorms/261103-0851-project-documentation-rewrite.md).
- **Kế hoạch triển khai `/xd:plan`:** [plans/261103-0853-project-documentation-rewrite/plan.md](file:///D:/Project/Employee%20Management/plans/261103-0853-project-documentation-rewrite/plan.md).
- **Định dạng tài liệu thống nhất:**
  - `README.md`: Enterprise Showcase, C4 diagram tổng quan, Key Capabilities, Tech Stack, Hướng dẫn khởi chạy an toàn qua `.env.example`, Documentation Hub liên kết `docs/`.
  - `DOC-18`: Tài liệu kỹ thuật chi tiết chuẩn mực (v3.0) đồng bộ 100% với 23 Flyway migrations, 21 bảng CSDL, 13 backend modules, 10 frontend features, 9 scheduling rules.

---

## 4. Kết Quả Thực Hiện Hoàn Tất (Implementation Results)
1. **`docs/18-project-structure-and-modules-guide.md` (DOC-18 v3.0):**
   - Cập nhật chính xác 100% theo codebase thực tế: 23 Flyway migrations, 21 bảng dữ liệu, 13 backend modules, 10 frontend features, 9 scheduling conflict rules, loại bỏ các file/thư mục ảo.
   - Loại bỏ toàn bộ mật khẩu cụ thể, chỉ giữ lại mô tả kiến trúc an ninh và cơ chế cấp phát tài khoản tự động.
2. **`README.md`:**
   - Soạn thảo chuẩn Enterprise Showcase: Trình bày tổng quan giải pháp, kiến trúc cấp cao (Mermaid), các tính năng nghiệp vụ nổi bật, RBAC 3 cấp, hướng dẫn khởi chạy an toàn dựa trên `.env.example` và bảng tra cứu `docs/`.
   - Bảo mật 100%: Che toàn bộ thông tin nhạy cảm, không có bất kỳ mật khẩu hoặc thông tin mật nào bị rò rỉ.
3. **Kiểm toán An ninh:**
   - Đã quét grep toàn bộ các chuỗi `Admin@123`, `emp001@123`, `123456`, `@123` trên cả 2 tài liệu; kết quả: 0 kết quả tìm thấy (Clean 100%).

