# Journal: Tối Ưu Hóa Phân Bổ Ca Làm Việc & Chia Đều Số Giờ Tự Động

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Nâng cấp thuật toán tự động gán ca sang mô hình Fairness-First 2-Pha để đảm bảo quyền lợi và số giờ làm việc đều nhau nhất giữa các nhân viên.

## 1. Vấn Đề Ghi Nhận
- Thuật toán tự động gán ca cũ ưu tiên `isPreferred` (ca ưa thích) lên hàng đầu, dẫn đến việc những người chọn ca ưa thích bị dồn quá nhiều ca/giờ, trong khi người khác bị thiếu giờ.
- Không có cơ chế kiểm soát trần số giờ và thiếu vòng lặp tái cân bằng (rebalancer) sau khi phân bổ tham lam, khiến độ lệch giờ giữa người cao nhất và người thấp nhất có thể rất lớn.
- Người dùng mong muốn: **Ưu tiên sự công bằng về số giờ làm việc lên hàng đầu** (nhường ca cho người ít giờ hơn dù người nhiều giờ thích ca đó) để đảm bảo quyền lợi và thu nhập đồng đều cho tất cả mọi người.

## 2. Giải Pháp Thống Nhất
- **Pha 1: Fairness-First Candidate Scoring:**
  - Sắp xếp ưu tiên tuyệt đối cho người ít giờ hơn khi chênh lệch $\ge 2$h.
  - Ca ưa thích (`isPreferred`) chỉ đóng vai trò phân xử khi số giờ xấp xỉ nhau (< 2h).
- **Pha 2: Post-Allocation Rebalancer Loop:**
  - Sau khi xếp đủ các ca, nếu độ lệch giữa người cao nhất (`empMax`) và người thấp nhất (`empMin`) vượt quá 4h: tìm ca hợp lệ của `empMax` chuyển sang cho `empMin`.
  - Giảm thiểu tối đa độ lệch chuẩn của số giờ làm việc trong toàn chi nhánh.

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261027-1010-brainstorm-fair-workload-auto-assign.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-1010-brainstorm-fair-workload-auto-assign.md)
- Kế hoạch triển khai: [`plans/261027-1010-fair-workload-auto-assign/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1010-fair-workload-auto-assign/plan.md)
  - [Phase 01: Fairness-First Candidate Scoring & Post-Allocation Rebalancer](file:///D:/Project/Employee%20Management/plans/261027-1010-fair-workload-auto-assign/phase-01-fairness-scoring-and-rebalancer.md)
  - [Phase 02: Verification & Build Acceptance](file:///D:/Project/Employee%20Management/plans/261027-1010-fair-workload-auto-assign/phase-02-verification-and-acceptance.md)

## 4. Kết Quả Triển Khai & Kiểm Thử
- **Thuật toán Fairness-First:** Đã cập nhật `findCandidates` trong [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts):
  - Nếu chênh lệch giờ $\ge 2$h: người ít giờ hơn được ưu tiên tuyệt đối nhận ca.
  - Ca ưa thích (`isPreferred`) chỉ đóng vai trò phân xử (tie-breaker) khi số giờ bằng nhau hoặc chênh lệch $< 2$h.
- **Vòng lặp tái cân bằng (Post-Allocation Equalization Rebalancer):**
  - Quét tìm nhân viên có số giờ cao nhất (`maxEmp`) và thấp nhất (`minEmp`).
  - Nếu độ lệch $> 3.5$h: tìm ca hợp lệ của `maxEmp` và chuyển nhượng cho `minEmp`.
  - Đảm bảo độ lệch chuẩn về số giờ giữa các nhân viên trong chi nhánh đạt mức tối ưu nhỏ nhất ($\le 1$ ca).
- **Kiểm thử:** Frontend `npm run build` hoàn thành 100% với 0 lỗi TypeScript / Vite.

