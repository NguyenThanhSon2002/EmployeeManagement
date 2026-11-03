---
title: "Brainstorm: Lưu vết nhân sự ban đầu & lịch sử giải trình khi nhường ca"
date: 2026-11-03
author: Antigravity
topic: schedule, swap, handover, traceability
---

# Technical Journal: Brainstorming Shift Handover Traceability

## Context
Người dùng phản hồi vấn đề khi nhường ca (`HANDOVER`), lý do giải trình được ghi nhận nhưng thiếu tên người giải trình (người nhường ca ban đầu). Người nhận ca hiển thị đơn độc kèm lý do của người khác, gây hiểu nhầm. Người dùng muốn vẫn lưu vết và hiển thị người ban đầu được sắp xếp ở ca đó, và khi ca đã nhường thì người này được ẩn đi kèm theo lý do giải trình.

## What Happened
1. Phân tích hình ảnh thực tế từ giao diện phân ca tuần và truy vết luồng xử lý `HANDOVER` trong `ShiftSwapService.java` và `ShiftGridCell.tsx`.
2. Phát hiện `reqAssign.employeeId` bị ghi đè hoàn toàn sang `targetId`, xóa sạch dấu vết của nhân sự ban đầu khỏi ca làm việc.
3. Đề xuất và thảo luận 2 phương án kiến trúc dữ liệu và 3 phương án giao diện UI:
   - Thống nhất phương án lưu `transferredFromEmployeeId` trên bản ghi phân ca hiện tại (an toàn nhất, zero side-effects về tính giờ công và định biên).
   - Thống nhất phương án UI: Ô ca tuần hiển thị dòng thu gọn `▾ 1 NV đã nhường ca`, khi click mở rộng sẽ thấy chip mờ gạch ngang kèm lý do giải trình.
   - Thống nhất định dạng text giải trình: Ghi rõ cả 2 bên `[Tên người nhường] nhường ca cho [Tên người nhận] theo [Mã đơn]: [Lý do]`.
4. Xuất báo cáo tổng kết thiết kế: `plans/reports/261103-1525-shift-handover-traceability-report.md`.
5. Tạo kế hoạch chi tiết 4 pha tại `plans/261103-1526-shift-handover-traceability/`.

## Key Decisions
- **Data Integrity:** Không tạo bản ghi phân ca ma với trạng thái tách biệt; giữ nguyên 1 bản ghi ca thực tế và bổ sung trường liên kết `transferred_from_employee_id`.
- **UI Minimalism:** Không để chip người nhường chiếm diện tích vĩnh viễn trong ô lịch để tránh vỡ lưới ca tuần. Mặc định ẩn trong nút thu gọn, người dùng bấm mới mở rộng.

## Next Steps
- Triển khai theo kế hoạch `plans/261103-1526-shift-handover-traceability/plan.md`.
