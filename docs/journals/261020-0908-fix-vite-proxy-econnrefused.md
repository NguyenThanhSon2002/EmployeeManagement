# Nhật Ký Kỹ Thuật: Brainstorm & Lập Kế Hoạch Fix Lỗi Vite Proxy ECONNREFUSED

- **Thời gian:** 20/10/2026 - 09:08 (GMT+7)
- **Tác giả:** Solution Brainstormer Agent
- **Báo cáo liên quan:** [plans/reports/261020-0906-fix-vite-proxy-econnrefused.md](../../plans/reports/261020-0906-fix-vite-proxy-econnrefused.md)
- **Kế hoạch liên quan:** [plans/261020-0908-fix-vite-proxy-econnrefused/plan.md](../../plans/261020-0908-fix-vite-proxy-econnrefused/plan.md)

---

## 1. Yêu Cầu Người Dùng & Hiện Tượng
Người dùng gặp lỗi proxy từ Vite dev server:
`[vite] http proxy error: /api/v1/auth/me`
`AggregateError [ECONNREFUSED]: at internalConnectMultiple (node:net:1194:18)`
khi mở trang web Frontend.

## 2. Kết Quả Khảo Sát & Phân Tích
- Tiến trình Java Spring Boot (PID `4084`) khởi động lúc `08:53:30 AM`.
- Lỗi xuất hiện lúc `08:53:33 AM` (chỉ 3 giây sau), khi Spring Boot chưa kết nối xong DB và Tomcat port 8080 chưa mở.
- Ngoài ra, Node 18+ với `target: 'http://localhost:8080'` ưu tiên phân giải `::1` (IPv6), dễ sinh ra lỗi `ECONNREFUSED` trên Windows.
- Hiện tại backend đã chạy ổn định và cổng 8080 phản hồi bình thường.

## 3. Quyết Định & Thống Nhất
- Người dùng đã lựa chọn **Phương án 1**:
  - Chuyển `target` proxy trong `frontend/vite.config.ts` sang `http://127.0.0.1:8080`.
  - Bổ sung cấu hình `configure(proxy)` để bắt sự kiện lỗi, ghi log cảnh báo thân thiện thay vì ném stacktrace thô.
  - Cập nhật tài liệu quy trình chuẩn: Bật MySQL -> Chờ Spring Boot khởi động hoàn tất -> Mở/reload Frontend.
- Đã khởi tạo hoàn tất báo cáo kỹ thuật và triển khai bộ hồ sơ kế hoạch (`plan.md`, `phase-01`, `phase-02`).
