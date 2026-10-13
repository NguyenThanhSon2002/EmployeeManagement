# GIAI ĐOẠN 03: LỊCH PHÂN CA TUẦN CỐT LÕI SCR-11 & SCR-12 (PHASE 03 - CORE)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Giai đoạn trước: [phase-02-app-shell-and-engine.md](./phase-02-app-shell-and-engine.md)
- Đặc tả toàn diện màn hình: [`docs/11-schedule-screen-specification.md`](../../docs/11-schedule-screen-specification.md) (Tài liệu chi tiết nhất)
- Thiết kế Tokens & Colors: [`docs/12-frontend-design-system-and-screens.md`](../../docs/12-frontend-design-system-and-screens.md)
- Dữ liệu hạt giống & Kịch bản: [`docs/13-frontend-mock-data-plan.md`](../../docs/13-frontend-mock-data-plan.md)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage B: B1..B9)

---

## Overview
- **Mã giai đoạn:** Phase 03 (Stage B - PHÂN HỆ TRỌNG TÂM DỰ ÁN)
- **Mức độ ưu tiên:** P1 (Giá trị nghiệp vụ cao nhất)
- [x] **Trạng thái:** Completed (Hoàn thành)
- **Thời lượng ước tính:** 32 giờ làm việc (chia thành 9 tiểu giai đoạn B1..B9)
- **Mô tả vắn tắt:** Xây dựng hoàn chỉnh màn hình Bảng Lịch làm việc tuần (SCR-11) và Bảng trượt gán ca (SCR-12): Ma trận 8 cột CSS Grid (Cột nhân viên cố định và 7 cột thứ), hàng tiêu đề định biên nhân sự, thẻ ca hiển thị màu sắc WCAG AA kèm icon và cờ cảnh báo ⚠️; Drawer gán ca đơn lẻ tích hợp Conflict Engine; Modal gán hàng loạt; Modal sao chép tuần có preview; Quy trình công bố lịch (Draft -> Published); Modal bắt buộc nhập lý do khi sửa lịch đã công bố và Drawer lịch sử thay đổi; Bộ lọc tìm kiếm debounce; 4 Thẻ KPI tổng hợp; Chế độ xem lịch tháng; Xuất file CSV UTF-8 BOM; và điều hướng bàn phím ARIA grid.

---

## Key Insights
1. **Hiệu năng Render ô ma trận:** Với 25 nhân viên x 7 ngày = 175 ô (hoặc 300 nhân viên x 31 ngày = 9,300 ô), mỗi component `<ScheduleCell />` bắt buộc phải được bọc trong `React.memo` và đọc dữ liệu qua Zustand Atomic Selector (`useScheduleStore(state => state.assignments[cellKey])`). Khi người dùng gán 1 ca, chỉ duy nhất ô đó render lại, giữ tốc độ mượt mà 60fps.
2. **Khóa Lỗi Chặn vs Cảnh Báo Cho Phép Ghi Đè:** Lỗi MANDATORY (trùng giờ BR-001) khóa hoàn toàn nút "Lưu phân ca" (Disabled). Cảnh báo WARNING (nghỉ $< 11$h BR-006, vượt 48h BR-004) cho phép người quản lý tích chọn "Xác nhận đặc cách" và bắt buộc nhập lý do giải trình $\ge 10$ ký tự mới được lưu.
3. **Kiểm soát Thay đổi Lịch Đã Công bố:** Khi lịch ở trạng thái `PUBLISHED`, bất kỳ thao tác sửa ca hoặc xóa ca nào đều kích hoạt `<ChangeReasonDialog />` bắt buộc nhập lý do điều chỉnh $\ge 5$ ký tự, tự động lưu vết vào `scheduleChangeHistory`.

---

## Requirements
- **FR-017:** Bảng ma trận phân ca trực quan (Nhân viên x Ngày) với Thẻ ca màu sắc chuẩn và cờ cảnh báo nhấp nháy.
- **FR-018:** Thao tác gán ca linh hoạt: click ô mở Drawer, gán hàng loạt qua Modal, sao chép lịch tuần trước.
- **FR-019:** Phát hiện và cảnh báo xung đột thời gian thực trên cả giao diện lưới và trong form Drawer.
- **FR-020:** Quản lý vòng đời lịch: Trạng thái DRAFT (soạn thảo tự do) và PUBLISHED (chính thức, nhân viên thấy lịch, sửa phải có lý do).
- **BR-001 đến BR-008, BR-011, BR-015:** Tuân thủ 100% các quy tắc nghiệp vụ xếp ca.

---

## Architecture & Component Breakdown
```text
src/features/schedule/
├── SchedulePage.tsx                      # Trang container chính
├── components/
│   ├── ScheduleToolbar.tsx               # Chọn tuần, phòng ban, đổi Week/Month, nút Công bố, Copy, Xuất CSV
│   ├── ScheduleFiltersBar.tsx            # Tìm kiếm tên/mã NV, lọc chức danh, lọc ca, toggle chỉ hiện cảnh báo
│   ├── ScheduleSummaryCards.tsx          # 4 Thẻ KPI: Tổng ca, Tổng giờ, Số cảnh báo, Thiếu định biên
│   ├── WeeklyGrid.tsx                    # Ma trận chính: CSS Grid 8 cột, Sticky Column nhân viên
│   ├── GridHeader.tsx                    # Tiêu đề ngày Thứ 2..CN, thanh định biên nhân sự, cờ ngày lễ
│   ├── EmployeeRow.tsx                   # Một hàng nhân viên (Avatar, Tiến độ giờ tuần / 48h, 7 ô ca)
│   ├── ScheduleCell.tsx                  # Ô ngày (ShiftCard, Nút cộng mờ, Thẻ nghỉ phép màu xanh lá)
│   ├── ShiftCard.tsx                     # Thẻ ca làm việc: màu WCAG, icon loại ca, nhãn ca, chấm than vàng ⚠️
│   ├── MonthViewGrid.tsx                 # Chế độ xem lịch tháng tổng quan
│   ├── ScheduleLegend.tsx                # Chú giải màu sắc các ca và bảng phím tắt bàn phím
│   └── dialogs/
│       ├── AssignShiftDrawer.tsx         # Drawer 450px gán/sửa ca & giải trình đặc cách (SCR-12)
│       ├── BulkAssignDialog.tsx          # Modal gán ca hàng loạt cho nhiều nhân sự
│       ├── CopyWeekDialog.tsx            # Modal xem trước và sao chép tuần (Skip occupied vs Replace)
│       ├── PublishConfirmDialog.tsx      # Modal xác nhận công bố lịch chính thức
│       ├── ChangeReasonDialog.tsx        # Modal bắt buộc nhập lý do khi sửa lịch đã Published
│       └── ChangeHistoryDrawer.tsx       # Drawer xem nhật ký thay đổi của tuần
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/src/features/schedule/SchedulePage.tsx` | Container điều phối dữ liệu lịch tuần |
| **Create** | `frontend/src/features/schedule/components/WeeklyGrid.tsx` | Ma trận 8 cột CSS Grid và quản lý focus |
| **Create** | `frontend/src/features/schedule/components/GridHeader.tsx` | Tiêu đề ngày thứ và định biên nhân sự |
| **Create** | `frontend/src/features/schedule/components/EmployeeRow.tsx`| Hàng thông tin nhân viên và thanh giờ tuần |
| **Create** | `frontend/src/features/schedule/components/ScheduleCell.tsx`| Ô ngày ma trận bọc `React.memo` |
| **Create** | `frontend/src/features/schedule/components/ShiftCard.tsx` | Thẻ ca trực quan chuẩn WCAG 2.1 AA |
| **Create** | `frontend/src/features/schedule/components/ScheduleToolbar.tsx` | Thanh công cụ tuần và các nút xuất bản |
| **Create** | `frontend/src/features/schedule/components/ScheduleFiltersBar.tsx`| Thanh tìm kiếm debounced và lọc cảnh báo |
| **Create** | `frontend/src/features/schedule/components/ScheduleSummaryCards.tsx`| 4 thẻ chỉ số thống kê trên đỉnh lưới |
| **Create** | `frontend/src/features/schedule/components/MonthViewGrid.tsx` | Lưới xem tổng quan 31 ngày dạng tháng |
| **Create** | `frontend/src/features/schedule/components/ScheduleLegend.tsx` | Chú giải mẫu ca và phím tắt bàn phím |
| **Create** | `frontend/src/features/schedule/dialogs/AssignShiftDrawer.tsx` | Drawer gán ca & giải trình ghi đè (SCR-12) |
| **Create** | `frontend/src/features/schedule/dialogs/BulkAssignDialog.tsx` | Modal gán ca đồng loạt cho nhiều người |
| **Create** | `frontend/src/features/schedule/dialogs/CopyWeekDialog.tsx` | Modal xem trước và cấu hình sao chép tuần |
| **Create** | `frontend/src/features/schedule/dialogs/PublishConfirmDialog.tsx`| Modal xác nhận xuất bản lịch tuần |
| **Create** | `frontend/src/features/schedule/dialogs/ChangeReasonDialog.tsx` | Modal bắt buộc nhập lý do sửa lịch đã công bố |
| **Create** | `frontend/src/features/schedule/dialogs/ChangeHistoryDrawer.tsx` | Drawer xem nhật ký kiểm toán thay đổi |
| **Create** | `frontend/src/features/schedule/schedule.css` | Phong cách CSS chuyên biệt cho lưới ma trận |
| **Create** | `frontend/src/hooks/useWeeklySchedule.ts` | Hook điều phối chuyển tuần và tính toán tổng hợp |

---

## Implementation Steps

### Bước 1: Xây dựng Khung Ma trận `<WeeklyGrid />` & Header (TSK-B01, TSK-B02)
- Cấu trúc CSS Grid: `grid-template-columns: 240px repeat(7, minmax(130px, 1fr))`.
- Cột nhân viên (Sticky Column): `position: sticky; left: 0; z-index: 10; background: var(--color-surface)`.
- `<GridHeader />`: Hiển thị ngày tháng (`formatDateVi`), icon cờ đỏ `[🚩 LỄ]` cho ngày lễ, số đếm định biên nhân sự của ca (ví dụ: `ĐB: 4/4 người` hoặc `ĐB: 3/4 ⚠️`).

### Bước 2: Xây dựng `<ScheduleCell />` & `<ShiftCard />` (TSK-B01)
- Hiển thị ô trống: Khi hover chuột hiển thị nút mờ `[ + ]`.
- Hiển thị ca đã gán: `<ShiftCard />` mang bộ màu WCAG (`bg`, `border`, `text`), icon loại ca (☀️, 🌤️, 🌙), giờ bắt đầu - kết thúc, số giờ net.
- Hiển thị ca đêm: Nhãn `Ca Đêm (+1 ngày)`.
- Hiển thị nghỉ phép: Thẻ nền xanh lá nhạt `[🏖️ PHÉP NĂM]`.
- Hiển thị cờ cảnh báo: Icon chấm than vàng ⚠️ nhấp nháy góc phải thẻ ca, hover hiển thị Tooltip mô tả vi phạm.

### Bước 3: Bảng trượt Gán Ca `<AssignShiftDrawer />` (SCR-12) (TSK-B03, TSK-B05)
- Chiều rộng 450px trượt từ cạnh phải, khóa cuộn trang nền (`FocusTrap`).
- Danh sách Radio chọn mẫu ca.
- Khi người dùng chọn ca, chạy ngay `conflict-detector.utils.ts`:
  - Nếu vi phạm `MANDATORY` (trùng giờ BR-001): Hiển thị Banner đỏ, nút "Lưu phân ca" bị disabled.
  - Nếu vi phạm `WARNING` (nghỉ $< 11$h BR-006, vượt 48h BR-004): Hiển thị Banner vàng, checkbox "Tôi xác nhận đặc cách" và ô nhập lý do giải trình $\ge 10$ ký tự. Chỉ khi nhập đủ ký tự nút Lưu mới được kích hoạt.

### Bước 4: Modal Gán Ca Hàng Loạt `<BulkAssignDialog />` (TSK-B04)
- Chọn danh sách nhân viên qua Checkbox (hoặc nút "Chọn cả phòng ban").
- Chọn mẫu ca và các thứ trong tuần (T2 đến T6).
- Bấm thực thi: Gán đồng loạt ca, tự động bỏ qua các ngày nhân viên đã có đơn nghỉ phép đã duyệt.

### Bước 5: Modal Sao chép Lịch Tuần `<CopyWeekDialog />` (TSK-B05)
- Hiển thị thống kê: Tổng số ca tuần trước ($N_{src}$), số ô trống tuần này ($N_{empty}$), số ô đã có ca ($N_{occ}$).
- Lựa chọn chế độ sao chép:
  - `Bỏ qua các ô đã có ca (Mặc định)`: Giữ nguyên ca và đơn phép hiện tại, chỉ điền vào ô trống.
  - `Ghi đè toàn bộ`: Thay thế toàn bộ bằng ca tuần trước (bảo lưu đơn phép).

### Bước 6: Quy trình Công bố Lịch & Nhật ký Thay đổi (TSK-B10, TSK-B11)
- `<PublishConfirmDialog />`: Kiểm tra toàn bộ lưới. Nếu có lỗi Mandatory thì chặn không cho công bố. Bấm xác nhận chuyển trạng thái sang `PUBLISHED`.
- Khi lịch đã `PUBLISHED`: Sửa/xóa ca kích hoạt `<ChangeReasonDialog />` bắt buộc nhập lý do $\ge 5$ ký tự. Lưu bản ghi vào mảng `scheduleChangeHistory` trong Zustand.
- `<ChangeHistoryDrawer />`: Mở xem danh sách các lần chỉnh sửa có kiểm toán.

### Bước 7: Bộ Lọc, Thẻ KPI, Lịch Tháng, Xuất CSV & Tiếp Cận (TSK-B07..TSK-B13)
- `<ScheduleFiltersBar />`: Ô tìm kiếm (Debounce 300ms), Dropdown chức danh, Toggle "Chỉ hiện cảnh báo".
- `<ScheduleSummaryCards />`: 4 Thẻ KPI trên đỉnh lưới (Tổng ca, Tổng giờ, Cảnh báo, Thiếu người). Bấm thẻ cảnh báo tự động lọc lưới.
- `<MonthViewGrid />`: Chế độ xem lịch tháng tổng quan 31 ngày khi đổi toggle trên Toolbar.
- Nút "Xuất lịch (CSV)": Gọi `exportToCsv` xuất file tiếng Việt chuẩn UTF-8 BOM.
- Phím tắt: Phím mũi tên di chuyển giữa các ô, `Enter` mở Drawer, `Del` xóa ca, `Escape` đóng popup.

---

## Todo List
- [x] Xây dựng `WeeklyGrid.tsx`, `GridHeader.tsx`, `EmployeeRow.tsx`, `ScheduleCell.tsx`, `ShiftCard.tsx`.
- [x] Xây dựng `schedule.css` chia lưới CSS Grid 8 cột và Sticky column nhân viên.
- [x] Xây dựng `AssignShiftDrawer.tsx` (SCR-12) tích hợp kiểm tra xung đột thời gian thực.
- [x] Xây dựng `BulkAssignDialog.tsx` gán ca hàng loạt.
- [x] Xây dựng `CopyWeekDialog.tsx` với preview số ô trống và 2 chế độ sao chép.
- [x] Xây dựng `PublishConfirmDialog.tsx` và quy trình đổi trạng thái Draft $\rightarrow$ Published.
- [x] Xây dựng `ChangeReasonDialog.tsx` và `ChangeHistoryDrawer.tsx` ghi vết kiểm toán.
- [x] Xây dựng `ScheduleToolbar.tsx` và `ScheduleFiltersBar.tsx` (debounced search).
- [x] Xây dựng `ScheduleSummaryCards.tsx` (4 thẻ KPI liên kết bộ lọc).
- [x] Xây dựng `MonthViewGrid.tsx` chế độ xem lịch tháng.
- [x] Xây dựng `ScheduleLegend.tsx` chú giải mẫu ca và phím tắt.
- [x] Tích hợp tính năng Xuất CSV UTF-8 BOM vào nút xuất lịch.
- [x] Cài đặt điều hướng phím mũi tên và thuộc tính ARIA gridcell.
- [x] Kiểm thử thành công toàn bộ 10 worked examples tại Tài liệu 11.

---

## Success Criteria (Definition of Done)
1. Thử nghiệm thành công 100% cả 10 worked examples từ EX-01 đến EX-10:
   - EX-01 (Ca đêm): Hiển thị `Ca Đêm (+1 ngày)`, giờ tính 1 lần vào ngày bắt đầu.
   - EX-03 (Trùng ca): Banner đỏ chặn lưu, nút disabled.
   - EX-06 (Nghỉ $< 11$h): Banner vàng, bắt buộc nhập lý do $\ge 10$ ký tự mới được lưu.
   - EX-08 (Sao chép tuần): Chế độ bỏ qua ô đã có ca không làm mất ca cũ.
   - EX-09 (Sửa lịch Published): Modal bắt buộc lý do xuất hiện, lưu vết vào lịch sử.
2. Nút "Xuất lịch" tải file CSV UTF-8 BOM mở bằng Excel tiếng Việt không lỗi font.
3. Điều hướng bàn phím phím mũi tên và phím `Enter` hoạt động mượt mà.
4. Lệnh `npm run build` biên dịch thành công không có cảnh báo nào.

---

## Next Steps
Sau khi hoàn thành phân hệ Lịch phân ca cốt lõi, tiếp tục triển khai: [Phase 04: Dashboard, Hồ Sơ Nhân Sự & Cài Đặt](./phase-04-dashboard-and-employees.md).
