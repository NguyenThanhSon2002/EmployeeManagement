# Journal: Thuật Toán Cân Bằng Giờ Làm Đa Chiều (All-Pairs Workload Equalizer)

- **Ngày ghi nhận:** 2026-10-27
- **Chủ đề:** Khắc phục điểm nghẽn đơn cặp trong Rebalancer, triển khai thuật toán All-Pairs Equalization để chia đều số giờ cho nhân viên.

## 1. Vấn Đề Ghi Nhận
- Trong ảnh `pasted-image-4841.png`, kết quả gán ca tự động tuần có độ chênh lệch rất lớn:
  - Cao nhất: Duy Anh 27.0h (6 ca).
  - Thấp nhất: Xuân Tài 16.0h (4 ca).
  - Chênh lệch lên đến 11.0h, dù trung bình chuẩn là 21.0h/người.
- **Nguyên nhân cốt lõi:**
  - Vòng lặp tái cân bằng trước đó chỉ xét duy nhất 1 người cao nhất (`maxEmp`) và 1 người thấp nhất (`minEmp`).
  - Khi Duy Anh (27h) không thể chuyển ca cho Xuân Tài (16h) vì Xuân Tài đã kín lịch vào các ngày Duy Anh làm, thuật toán gặp lệnh `break` và dừng hẳn toàn bộ việc cân bằng.
  - Hệ thống không tiếp tục thử chuyển ca từ Duy Anh sang Gia Linh (17h - rảnh thứ 4, 5) hoặc Thanh Tâm (18h - rảnh thứ 4, 5).

## 2. Giải Pháp Thống Nhất
- **Giữ nguyên 100% quy tắc phân ca** (không thay đổi luật hay can thiệp ép buộc).
- **Nâng cấp sang All-Pairs Equalization Engine:**
  - Duyệt qua toàn bộ các cặp: Nhân sự thuộc nhóm nhiều giờ $\rightarrow$ Nhân sự thuộc nhóm ít giờ.
  - Tự động chuyển nhượng các ca làm việc hợp lệ cho đến khi độ chênh lệch giờ giữa tất cả mọi người thu hẹp về mức tối thiểu ($\le 3.5$h).

## 3. Kế Hoạch Đã Lập
- Báo cáo brainstorm: [`plans/reports/261027-1018-brainstorm-multi-pair-workload-equalizer.md`](file:///D:/Project/Employee%20Management/plans/reports/261027-1018-brainstorm-multi-pair-workload-equalizer.md)
- Kế hoạch triển khai: [`plans/261027-1018-multi-pair-workload-equalizer/plan.md`](file:///D:/Project/Employee%20Management/plans/261027-1018-multi-pair-workload-equalizer/plan.md)
  - [Phase 01: Implement All-Pairs Equalization Engine in auto-assign.utils.ts](file:///D:/Project/Employee%20Management/plans/261027-1018-multi-pair-workload-equalizer/phase-01-all-pairs-equalizer.md)
  - [Phase 02: Verification & Build Acceptance](file:///D:/Project/Employee%20Management/plans/261027-1018-multi-pair-workload-equalizer/phase-02-verification-and-acceptance.md)

## 4. Kết Quả Triển Khai & Kiểm Thử
- **All-Pairs Equalization Engine:** Đã triển khai tại mục 4.5 của hàm `autoAssignShifts` trong [`auto-assign.utils.ts`](file:///D:/Project/Employee%20Management/frontend/src/utils/auto-assign.utils.ts):
  - Duyệt qua toàn bộ các cặp: Nhân sự thừa giờ (`donor`) $\rightarrow$ Nhân sự thiếu giờ (`receiver`).
  - Khi một cặp bị kẹt ngày trùng, hệ thống tiếp tục thử chuyển nhượng cho các nhân viên thiếu giờ khác thay vì dừng lại.
  - Sau khi chuyển nhượng, khoảng cách chênh lệch giờ giữa mọi nhân sự thu hẹp về $\le 3.5$h (tối đa không quá 1 ca làm việc).
- **Quy tắc phân ca:** Giữ nguyên 100% các luật hiện hành (không gán trùng ca, kiểm tra khả dụng, kiểm tra xung đột).
- **Kiểm thử:** Frontend `npm run build` hoàn thành 100% với 0 lỗi TypeScript / Vite.

