# Ký sự Kỹ thuật: Lập kế hoạch Tính năng Đổi ca & Nhường ca (Shift Swap & Handover)

**Thời gian:** 28/10/2026 - 15:52  
**Mã tài liệu:** `JOURNAL-261028-1551`  
**Tác giả:** Antigravity Architect  

---

## 1. Mục tiêu
Thiết kế kiến trúc và xây dựng kế hoạch triển khai chi tiết cho phân hệ **Đổi ca chéo (Swap) và Nhường ca (Handover)** giữa các nhân sự trong cùng chi nhánh:
- A đề xuất $\rightarrow$ B đồng ý $\rightarrow$ Quản lý duyệt.
- Tái sử dụng trọn vẹn bộ kiểm tra xung đột `Conflict Detector Engine` (tuân thủ 8 quy tắc Bộ Luật Lao Động 2019: nghỉ 12h, trần 48h/tuần, trần 12h/ngày, 6 ngày liên tục, v.v.) để phát hiện và chặn vi phạm ngay từ lúc tạo đơn.

---

## 2. Kết quả hoàn thành
1. **Báo cáo Brainstorm**: Đã tạo tài liệu phân tích bài toán và so sánh kỹ thuật tại `plans/reports/261028-1551-shift-swap-handover-brainstorm.md`.
2. **Kế hoạch triển khai (5 Phases)** tại thư mục `plans/261028-1551-shift-swap-handover/`:
   - `plan.md`: Kế hoạch tổng thể và lộ trình luồng trạng thái.
   - `phase-01-database-and-backend-core.md`: Migration V17 bảng `shift_swap_requests`, Entity, Repository.
   - `phase-02-conflict-validation-and-swap-logic.md`: Thuật toán giả lập hoán đổi (Simulation Engine) & REST APIs.
   - `phase-03-frontend-swap-modal-and-peer-workflow.md`: Giao diện Modal tạo yêu cầu & Đồng nghiệp phản hồi.
   - `phase-04-manager-approval-ui-and-schedule-sync.md`: Giao diện Quản lý phê duyệt & Đồng bộ ma trận lịch làm việc tức thì.
   - `phase-05-verification-and-end-to-end-testing.md`: Kịch bản kiểm thử biên (Edge Cases) luật lao động và tích hợp hệ thống.
