# Journal: Brainstorm & Thiết Kế Hiển Thị Toàn Bộ Đơn Nhường Ca & Phê Duyệt Trực Tiếp Cho Admin / Quản Lý

**Thời gian:** 2026-10-28 17:35  
**Ngữ cảnh:** Người dùng phát hiện đơn vừa tạo ở vai trò Admin không xuất hiện trong modal Quản lý và không thể tự duyệt.

## 1. Vấn đề cốt lõi phát hiện
- **Vùng mù danh sách:** Đơn vừa tạo có trạng thái ban đầu `PENDING_PEER` (Chờ đồng nghiệp đồng ý). Tab Quản lý trước đây lại gọi `getPendingManagerRequests` (chỉ lấy `PEER_ACCEPTED`), trong khi các tab cá nhân khác chỉ lọc theo `targetId` hoặc `requesterId` của chính user đang login. Vì vậy đơn bị "vô hình" trước Admin.
- **Quy trình 2 bước cứng nhắc khi điều động:** Khi Admin / Quản lý chủ động sắp xếp hoặc test, việc phải đăng nhập vào tài khoản người nhận để ấn "Đồng ý" rồi mới quay lại Quản lý để "Phê duyệt" là quá rườm rà.

## 2. Giải pháp thống nhất (Phương án 1)
- Tab Quản lý chuyển sang gọi `getAllBranchRequests` để lấy toàn bộ đơn của chi nhánh, kèm bộ lọc trạng thái nhanh (Tất cả, Chờ xử lý, Đã duyệt, Đã từ chối).
- Thêm nút **"Duyệt trực tiếp"** (`CheckCheck`) cho Admin / Quản lý ngay tại trạng thái `PENDING_PEER`. Backend cập nhật `managerReview` để hỗ trợ duyệt thẳng 1 chiều.

## 3. Artifacts đã tạo
- Báo cáo brainstorm: `plans/reports/261028-1733-shift-handover-admin-approval-brainstorm.md`
- Kế hoạch triển khai: `plans/261028-1735-handover-admin-direct-approval/plan.md`
