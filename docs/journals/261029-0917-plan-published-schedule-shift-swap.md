# Ký sự Kỹ thuật: Lập Kế Hoạch Đổi/Nhường Ca Trên Lịch Đã Công Bố & Cảnh Báo Sát Giờ

- **Thời gian:** 2026-10-29 09:17
- **Hoạt động:** Brainstorming & Planning (`/xd:brainstorm` & `/xd:plan`)
- **Tác giả:** Antigravity AI Pair Programmer & Quản trị viên hệ thống

## 1. Tóm Tắt Nhiệm Vụ & Phân Tích
- Người dùng đặt câu hỏi về mâu thuẫn giữa việc khóa lịch tuần khi công bố (`PUBLISHED`) và quyền hạn của nhân viên (`ROLE_EMPLOYEE`) khi xin đổi/nhường ca.
- Đã phân tích bản chất nghiệp vụ Workforce Management:
  1. **Sửa lịch trực tiếp**: Nhân viên không có quyền, và lịch `PUBLISHED` phải bị khóa để bảo vệ tính toàn vẹn.
  2. **Đổi/Nhường ca theo quy trình**: Chỉ thực sự mở khi lịch đã `PUBLISHED`. Nhân viên không sửa lịch mà chỉ gửi Đơn đề xuất cho ca của chính mình. Quản lý duyệt thì hệ thống mới áp dụng thay đổi vào lịch công bố.
  3. **Đổi ca sát giờ**: Không chặn cứng để hỗ trợ xử lý việc khẩn cấp tại cửa hàng/chi nhánh, nhưng tự động tính khoảng cách thời gian (< 24 tiếng) và phát sinh cảnh báo `WARN_SHORT_NOTICE_SWAP` hiển thị trên đơn gửi Quản lý.

## 2. Tài Liệu Đã Thiết Lập
1. **Báo cáo Brainstorm:** [`plans/reports/261029-0915-published-schedule-shift-swap-brainstorm.md`](file:///D:/Project/Employee%20Management/plans/reports/261029-0915-published-schedule-shift-swap-brainstorm.md)
2. **Kế hoạch triển khai chi tiết (3 Phases):**
   - Kế hoạch tổng thể: [`plans/261029-0915-published-schedule-shift-swap/plan.md`](file:///D:/Project/Employee%20Management/plans/261029-0915-published-schedule-shift-swap/plan.md)
   - Phase 1: [`phase-01-backend-published-and-short-notice-guard.md`](file:///D:/Project/Employee%20Management/plans/261029-0915-published-schedule-shift-swap/phase-01-backend-published-and-short-notice-guard.md) (Backend ràng buộc `PUBLISHED`, chặn ca quá khứ, cảnh báo `< 24h`)
   - Phase 2: [`phase-02-frontend-permissions-and-grid-visibility.md`](file:///D:/Project/Employee%20Management/plans/261029-0915-published-schedule-shift-swap/phase-02-frontend-permissions-and-grid-visibility.md) (Frontend phân quyền hiển thị icon đổi ca cho chính chủ ca khi `PUBLISHED`)
   - Phase 3: [`phase-03-short-notice-warning-ui-and-verification.md`](file:///D:/Project/Employee%20Management/plans/261029-0915-published-schedule-shift-swap/phase-03-short-notice-warning-ui-and-verification.md) (Giao diện cảnh báo sát giờ và kiểm thử toàn diện)
