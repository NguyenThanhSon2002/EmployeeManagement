# GIAI ĐOẠN 05: CHẤM CÔNG, MẪU CA, NGHỈ PHÉP & BÁO CÁO (PHASE 05)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Giai đoạn trước: [phase-04-dashboard-and-employees.md](./phase-04-dashboard-and-employees.md)
- Đặc tả màn hình phụ: [`docs/12-frontend-design-system-and-screens.md`](../../docs/12-frontend-design-system-and-screens.md) (Mục 3)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage D)

---

## Overview
- **Mã giai đoạn:** Phase 05 (Stage D)
- **Mức độ ưu tiên:** P2 (Phân hệ vận hành & đối soát)
- **Trạng thái:** Completed
- **Thời lượng ước tính:** 16 giờ làm việc
- **Mô tả vắn tắt:** Triển khai 4 phân hệ phụ trợ quan trọng: (1) Quản lý mẫu ca làm việc (SCR-10); (2) Bảng tổng quan chấm công hàng ngày (SCR-08) và Modal giải trình quên quét thẻ (SCR-09); (3) Quản lý danh sách đơn xin nghỉ phép (SCR-13) và quy trình phê duyệt phân cấp đồng bộ hiển thị thẻ phép sang Bảng lịch tuần (SCR-14); (4) Trung tâm báo cáo & thống kê (SCR-15) với 3 tab báo cáo (Tổng hợp công tháng, Scheduled vs Actual, Đi muộn/về sớm) kèm tính năng xuất file CSV tiếng Việt chuẩn UTF-8 BOM.

---

## Key Insights
1. **Đồng bộ chéo giữa Nghỉ phép và Lịch tuần (Cross-feature sync):** Khi người quản lý bấm "Chấp thuận (Approve)" trên một đơn xin nghỉ phép ở màn hình SCR-13/SCR-14, action trong store tự động kích hoạt cập nhật trạng thái ô của nhân viên đó trên Bảng Lịch tuần SCR-11 thành Thẻ nghỉ phép màu xanh lá `[🏖️ PHÉP NĂM]`, đồng thời chạy lại Conflict Engine để cảnh báo nếu trước đó đã vô tình xếp ca vào ngày nghỉ phép đó.
2. **Snapshotting bảo vệ mẫu ca:** Khi sửa giờ của Mẫu ca Sáng trong SCR-10 từ 08:00 thành 08:30, các ca đã gán trên lịch tuần trong quá khứ hoặc tuần hiện tại hoàn toàn không bị ảnh hưởng hồi tố nhờ kiến trúc lưu snapshot.
3. **Báo cáo đối chiếu Scheduled vs Actual:** Tính toán tự động số giờ kế hoạch và số giờ thực tế, hiển thị tỷ lệ hoàn thành (%) và tô đỏ các trường hợp nhân viên thiếu giờ làm hoặc vượt trần tăng ca.

---

## Requirements
- **FR-012 & FR-013:** Giám sát thời gian làm việc thực tế, tính số phút đi muộn, về sớm, giờ làm đêm.
- **FR-014 & FR-015:** Xử lý bản ghi thiếu check-out và luồng phê duyệt đơn giải trình điều chỉnh giờ công.
- **FR-016:** CRUD danh mục mẫu ca làm việc chuẩn hóa, định biên tối thiểu/tối đa, cờ ca qua đêm.
- **FR-021..FR-024:** Quản lý loại phép, số dư quỹ phép năm, nộp đơn xin nghỉ và luồng duyệt 2 cấp.
- **FR-026..FR-029:** Báo cáo điểm danh ngày, tổng hợp công tháng, đối chiếu Kế hoạch vs Thực tế, xuất file CSV UTF-8 BOM.

---

## Architecture & Component Breakdown
```text
src/features/
├── shifts/
│   ├── ShiftTemplatesPage.tsx          # Danh sách mẫu ca trực quan dạng thẻ màu (SCR-10)
│   └── components/
│       ├── ShiftTemplateCard.tsx       # Thẻ mẫu ca hiển thị giờ, định biên, màu WCAG
│       └── ShiftTemplateFormModal.tsx  # Modal thêm/sửa mẫu ca làm việc
├── attendance/
│   ├── AttendanceOverviewPage.tsx      # Bảng tổng quan chấm công hàng ngày (SCR-08)
│   └── components/
│       ├── AttendanceTable.tsx         # Bảng điểm danh ngày (Check-in, Check-out, Đi muộn, Về sớm)
│       └── AttendanceCorrectionModal.tsx # Modal giải trình bổ sung giờ công (SCR-09)
├── leaves/
│   ├── LeaveRequestsPage.tsx           # Bảng danh sách đơn xin nghỉ phép (SCR-13)
│   └── components/
│       ├── LeaveRequestModal.tsx       # Modal tạo đơn nghỉ mới (kiểm tra quỹ phép)
│       └── LeaveApprovalModal.tsx      # Modal phê duyệt/từ chối đơn (SCR-14)
└── reports/
    ├── ReportsPage.tsx                 # Trung tâm báo cáo & thống kê (SCR-15)
    └── components/
        ├── MonthlyAttendanceReport.tsx # Tab 1: Báo cáo tổng hợp công tháng
        ├── ScheduledVsActualTable.tsx  # Tab 2: Đối chiếu Kế hoạch vs Thực tế
        └── LateEarlyReport.tsx         # Tab 3: Báo cáo đi muộn, về sớm, thiếu checkout
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/src/features/shifts/ShiftTemplatesPage.tsx` | Trang quản lý mẫu ca làm việc (SCR-10) |
| **Create** | `frontend/src/features/shifts/components/ShiftTemplateFormModal.tsx` | Form thêm/sửa mẫu ca |
| **Create** | `frontend/src/features/attendance/AttendanceOverviewPage.tsx` | Trang giám sát chấm công ngày (SCR-08) |
| **Create** | `frontend/src/features/attendance/components/AttendanceCorrectionModal.tsx`| Modal xử lý đơn giải trình (SCR-09) |
| **Create** | `frontend/src/features/leaves/LeaveRequestsPage.tsx` | Trang quản lý đơn nghỉ phép (SCR-13) |
| **Create** | `frontend/src/features/leaves/components/LeaveRequestModal.tsx` | Form nộp đơn xin nghỉ phép mới |
| **Create** | `frontend/src/features/reports/ReportsPage.tsx` | Trung tâm báo cáo xuất dữ liệu (SCR-15) |
| **Create** | `frontend/src/features/reports/components/ScheduledVsActualTable.tsx`| Bảng đối chiếu Kế hoạch vs Thực tế |
| **Create** | `frontend/src/store/useAttendanceStore.ts` | Store quản lý dữ liệu chấm công và giải trình |
| **Create** | `frontend/src/store/useLeaveStore.ts` | Store quản lý đơn phép và quỹ phép năm |

---

## Implementation Steps

### Bước 1: Xây dựng Quản lý Mẫu Ca Làm Việc SCR-10 (TSK-D01)
- Hiển thị danh sách 4 thẻ ca chuẩn (Sáng, Sáng sớm, Chiều, Đêm) với màu sắc nhận diện đặc trưng.
- Modal `<ShiftTemplateFormModal />`: Ô nhập tên ca, mã ca, giờ bắt đầu, giờ kết thúc, thời gian nghỉ (phút), bộ chọn màu (Color picker), định biên tối thiểu và tối đa.
- Cờ ca qua đêm tự động bật nếu giờ kết thúc nhỏ hơn giờ bắt đầu.

### Bước 2: Xây dựng Bảng Tổng Quan Chấm Công SCR-08 & Giải Trình SCR-09 (TSK-D02, TSK-D03)
- Trang `<AttendanceOverviewPage />`:
  - Bộ chọn ngày chấm công (mặc định hôm nay) và Dropdown lọc theo phòng ban.
  - Bảng dữ liệu: Mã NV, Tên NV, Ca quy định, Giờ check-in, Giờ check-out, Đi muộn (phút), Về sớm (phút), Tổng giờ thực tế (`actual_hours`), Giờ đêm, Trạng thái (Đúng giờ, Đi muộn, Về sớm, Thiếu checkout, Nghỉ phép).
  - Nút "Xuất CSV điểm danh ngày".
- Modal `<AttendanceCorrectionModal />` (SCR-09):
  - Hiển thị giờ vào/ra cũ bị thiếu hoặc sai.
  - Cho phép nhập giờ vào/ra mới đề xuất và lý do giải trình bắt buộc.
  - Nút "Chấp thuận" (Green) và "Từ chối" (Red kèm lý do từ chối). Duyệt đơn cập nhật ngay giờ công thực tế.

### Bước 3: Xây dựng Quản lý Nghỉ Phép SCR-13 & Phê Duyệt SCR-14 (TSK-D04)
- Trang `<LeaveRequestsPage />`:
  - Bảng danh sách đơn nghỉ: Mã đơn, Nhân viên, Loại phép, Từ ngày, Đến ngày, Số ngày, Trạng thái (`SUBMITTED`, `APPROVED`, `REJECTED`), Người duyệt.
  - Modal nộp đơn `<LeaveRequestModal />`: Chọn loại phép, chọn dải ngày, kiểm tra số dư phép còn lại; chặn nộp nếu dải ngày trùng đơn cũ (BR-009).
  - Modal phê duyệt `<LeaveApprovalModal />`: Nút bấm duyệt đơn. **Kích hoạt đồng bộ sang Lịch tuần:** ô lịch tương ứng của nhân viên đổi ngay sang thẻ nghỉ phép màu xanh lá `[🏖️ PHÉP NĂM]`.

### Bước 4: Xây dựng Trung Tâm Báo Cáo & Xuất CSV SCR-15 (TSK-D05)
- Trang `<ReportsPage />` gồm 3 tabs:
  - **Tab 1: Báo cáo Tổng hợp Công tháng:** Hiển thị ma trận nhân viên với các cột: Số ca chuẩn, Tổng giờ thực tế, Giờ làm thêm (OT), Giờ làm việc ban đêm, Số lần đi muộn/về sớm.
  - **Tab 2: Báo cáo Đối chiếu Kế hoạch vs Thực tế:** Cột Số giờ được xếp lịch (Scheduled), Số giờ thực tế có mặt (Actual), Chênh lệch (Hours Diff), Tỷ lệ hoàn thành (%).
  - **Tab 3: Báo cáo Vi phạm Đi muộn / Về sớm:** Danh sách chi tiết các lần vi phạm kỷ luật lao động trong tháng.
- Nút "Xuất file CSV báo cáo (UTF-8 BOM)": Tải file dữ liệu tức thì về máy tính.

---

## Todo List
- [x] Xây dựng `ShiftTemplatesPage.tsx` và `ShiftTemplateFormModal.tsx`.
- [x] Xây dựng `useAttendanceStore.ts` và `AttendanceOverviewPage.tsx`.
- [x] Xây dựng `AttendanceCorrectionModal.tsx` duyệt giải trình công.
- [x] Xây dựng `useLeaveStore.ts` và `LeaveRequestsPage.tsx`.
- [x] Xây dựng `LeaveRequestModal.tsx` và `LeaveApprovalModal.tsx`.
- [x] Tích hợp đồng bộ: Duyệt đơn phép tự động cập nhật thẻ phép trên Lịch tuần SCR-11.
- [x] Xây dựng `ReportsPage.tsx` với đầy đủ 3 tabs báo cáo.
- [x] Xây dựng `ScheduledVsActualTable.tsx` tính toán % chênh lệch.
- [x] Tích hợp nút xuất CSV cho tất cả các bảng báo cáo.
- [x] Chạy `npm run build` xác nhận zero build errors.

---

## Success Criteria (Definition of Done)
1. Thêm một mẫu ca mới trên SCR-10 $\rightarrow$ Mẫu ca xuất hiện ngay trong danh sách chọn ca của Lịch tuần SCR-11.
2. Duyệt một đơn xin nghỉ phép trên SCR-13 $\rightarrow$ Lịch tuần SCR-11 tự động cập nhật thẻ nghỉ phép `[🏖️ PHÉP NĂM]` vào ô ngày tương ứng.
3. Tab Báo cáo Đối chiếu Kế hoạch vs Thực tế (SCR-15) tính toán chính xác số liệu chênh lệch giờ công.
4. Nút "Xuất file CSV" tải về file có chứa Byte Order Mark UTF-8 (`\uFEFF`), mở bằng Microsoft Excel hiển thị hoàn hảo dấu tiếng Việt.
5. Lệnh `npm run build` biên dịch thành công.

---

## Next Steps
Sau khi toàn bộ các phân hệ chức năng hoàn thành, chuyển sang giai đoạn cuối cùng: [Phase 06: Tiếp Cận A11y, Mobile Responsive & Đóng Gói](./phase-06-qa-accessibility-polish.md).
