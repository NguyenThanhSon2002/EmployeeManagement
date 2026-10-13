# GIAI ĐOẠN 04: DASHBOARD, HỒ SƠ NHÂN SỰ & CÀI ĐẶT (PHASE 04)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Giai đoạn trước: [phase-03-core-schedule-roster.md](./phase-03-core-schedule-roster.md)
- Đặc tả màn hình phụ: [`docs/12-frontend-design-system-and-screens.md`](../../docs/12-frontend-design-system-and-screens.md) (Mục 3)
- Dữ liệu mẫu nhân sự: [`docs/13-frontend-mock-data-plan.md`](../../docs/13-frontend-mock-data-plan.md)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage C)

---

## Overview
- **Mã giai đoạn:** Phase 04 (Stage C)
- **Mức độ ưu tiên:** P2 (Mở rộng nghiệp vụ quản trị)
- **Trạng thái:** Completed
- **Thời lượng ước tính:** 12 giờ làm việc
- **Mô tả vắn tắt:** Triển khai Bảng điều khiển tổng quan (SCR-02) đổi view theo vai trò với 4 thẻ KPI quân số, biểu đồ cột SVG xu hướng 7 ngày, widget điểm danh nhanh và duyệt nhanh; Danh sách nhân viên phân trang (SCR-03), Modal thêm/sửa hồ sơ (SCR-04), Trang chi tiết nhân sự 4 tabs (SCR-05: Lý lịch, Lịch ca, Bảng công, Nghỉ phép); và Màn hình Cài đặt hệ thống (SCR-16) cho phép tinh chỉnh ngưỡng cảnh báo nghỉ ngơi 11h/12h và nút Reset Demo Data.

---

## Key Insights
1. **Biểu đồ SVG thuần túy không dùng thư viện nặng:** `<TrendBarChart />` hiển thị tỷ lệ đi làm 7 ngày bằng thẻ `<svg>` và các thẻ `<rect>` tính toán kích thước động qua `viewBox`, tải tức thì, nhẹ hơn 100 lần so với Recharts/Chart.js.
2. **Chi tiết hồ sơ 360 độ:** Trang `<EmployeeDetailPage />` liên kết dữ liệu từ 3 phân hệ: Lịch ca tháng (từ ScheduleStore), Dữ liệu chấm công thực tế (từ AttendanceStore) và Quỹ phép năm (từ LeaveStore).
3. **Cài đặt Tham số Động:** Khi người dùng thay đổi ngưỡng nghỉ tối thiểu từ 11.0h sang 12.0h trên SCR-16, trạng thái trong `useSettingsStore` cập nhật ngay lập tức và tự động kích hoạt tính toán lại các cờ cảnh báo trên Bảng Lịch tuần SCR-11.

---

## Requirements
- **FR-001:** Dashboard tự động chuyển hướng và đổi view theo vai trò (Admin/HR, Dept Manager, Employee).
- **FR-002:** Biểu đồ SVG xu hướng tỷ lệ đúng giờ / đi muộn / vắng mặt trong 7 ngày gần nhất.
- **FR-003:** Widget duyệt hoặc từ chối nhanh đơn nghỉ phép và đơn giải trình ngay tại Dashboard.
- **FR-004:** Danh sách nhân viên phân trang 10 dòng/trang, tìm kiếm tức thời theo họ tên/mã NV, lọc phòng ban.
- **FR-005 & FR-006:** Thêm mới/chỉnh sửa hồ sơ nhân viên, xóa mềm (khóa tài khoản).
- **FR-007:** Chi tiết hồ sơ nhân viên với 4 tabs liên kết dữ liệu.
- **FR-031..FR-033:** Quản lý tham số hệ thống, ngưỡng trần tuần 48h, ngưỡng nghỉ 11h/12h và nút khôi phục dữ liệu mẫu.

---

## Architecture & Component Breakdown
```text
src/features/
├── dashboard/
│   ├── DashboardPage.tsx               # Container Dashboard đổi view theo Role
│   └── components/
│       ├── KpiMetricsRow.tsx           # 4 thẻ chỉ số quân số hôm nay
│       ├── QuickAttendanceCard.tsx     # Widget điểm danh Web Check-in/out
│       ├── ShiftScheduleWidget.tsx     # Widget ca trực hôm nay của bộ phận
│       └── PendingApprovalsWidget.tsx  # Widget duyệt đơn nghỉ/giải trình nhanh
├── employees/
│   ├── EmployeeListPage.tsx            # Bảng danh sách nhân sự phân trang
│   ├── EmployeeDetailPage.tsx          # Trang chi tiết hồ sơ 4 tabs
│   └── components/
│       ├── EmployeeTable.tsx           # Bảng nhân viên có badge trạng thái
│       ├── EmployeeFilters.tsx         # Ô tìm kiếm debounced và lọc phòng ban
│       ├── EmployeeFormModal.tsx       # Modal thêm mới/sửa nhân viên 2 cột
│       └── tabs/                       # 4 Tabs chi tiết hồ sơ
│           ├── ProfileTab.tsx          # Tab 1: Lý lịch & hợp đồng
│           ├── ScheduleTab.tsx         # Tab 2: Lịch ca tháng
│           ├── AttendanceTab.tsx       # Tab 3: Bảng công tháng
│           └── LeaveTab.tsx            # Tab 4: Quỹ phép & lịch sử nghỉ
└── settings/
    ├── SettingsPage.tsx                # Trang cấu hình tham số hệ thống
    └── components/
        ├── PolicyThresholdsForm.tsx    # Cấu hình ngưỡng nghỉ 11h/12h, trần 48h
        └── ResetDemoSection.tsx        # Nút khôi phục dữ liệu mẫu ban đầu
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/src/features/dashboard/DashboardPage.tsx` | Trang Dashboard đa vai trò (SCR-02) |
| **Create** | `frontend/src/features/dashboard/components/QuickAttendanceCard.tsx` | Thao tác Check-in / Check-out nhanh |
| **Create** | `frontend/src/features/dashboard/components/PendingApprovalsWidget.tsx` | Duyệt đơn nhanh 1 click |
| **Create** | `frontend/src/components/charts/TrendBarChart.tsx` | Biểu đồ cột SVG xu hướng 7 ngày |
| **Create** | `frontend/src/features/employees/EmployeeListPage.tsx` | Trang danh sách nhân sự (SCR-03) |
| **Create** | `frontend/src/features/employees/EmployeeDetailPage.tsx` | Trang chi tiết hồ sơ 4 tabs (SCR-05) |
| **Create** | `frontend/src/features/employees/components/EmployeeFormModal.tsx` | Modal thêm/sửa nhân viên (SCR-04) |
| **Create** | `frontend/src/features/settings/SettingsPage.tsx` | Trang Cài đặt tham số hệ thống (SCR-16) |
| **Create** | `frontend/src/features/settings/components/PolicyThresholdsForm.tsx` | Form điều chỉnh ngưỡng 11h/12h |

---

## Implementation Steps

### Bước 1: Xây dựng Dashboard Tổng quan SCR-02 (TSK-C01)
- Lưới 4 thẻ KPI quân số: Tổng nhân sự (45), Đang có mặt (38), Đi muộn/về sớm (2), Nghỉ phép (3).
- Component `<TrendBarChart />`: Vẽ trục và các cột SVG đại diện tỷ lệ đúng giờ / muộn / vắng trong 7 ngày.
- Widget `<QuickAttendanceCard />`:
  - Chưa check-in: Nút xanh `[ Check-in vào ca ]`.
  - Đã check-in: Đổi nút sang cam `[ Check-out kết thúc ca ]`, hiển thị đồng hồ đếm thời gian làm việc thực tế.
- Widget `<PendingApprovalsWidget />`: Hiển thị danh sách 3 đơn chờ duyệt, bấm "Chấp thuận" hoặc "Từ chối" xử lý ngay lập tức.

### Bước 2: Xây dựng Danh sách Nhân viên SCR-03 (TSK-C02)
- Hiển thị bảng dữ liệu nhân sự với phân trang 10 dòng/trang.
- Cột thông tin: Checkbox chọn, Mã NV, Họ tên, Avatar, Phòng ban, Chức danh, Loại hợp đồng, Badge trạng thái (Xanh: Chính thức, Vàng: Thử việc, Đỏ: Đã thôi việc).
- Bộ lọc: Ô tìm kiếm (Debounce 300ms theo họ tên, mã NV, email, SĐT) và Dropdown chọn phòng ban.
- Nút bấm xem chi tiết `[👁️]` chuyển hướng sang `/employees/:id`.

### Bước 3: Xây dựng Modal Thêm mới / Sửa Nhân viên SCR-04 (TSK-C03)
- Bố cục Form 2 cột:
  - Cột 1: Thông tin cá nhân (Mã NV `EMP-xxxxx`, Họ và tên, Email, Số ĐT 10 số, Ngày sinh, CCCD/CMND, Địa chỉ).
  - Cột 2: Thông tin công việc (Phòng ban, Chức danh, Quản lý trực tiếp, Ngày vào làm, Loại hợp đồng, Trạng thái).
- Validation: Kiểm tra email chuẩn doanh nghiệp, số điện thoại di động Việt Nam.

### Bước 4: Xây dựng Trang Chi tiết Hồ sơ 4 Tabs SCR-05 (TSK-C04)
- Header hồ sơ: Avatar tròn, Họ tên, Mã NV, Chức vụ, Nút sửa nhanh.
- Tab 1 (Lý lịch & Hợp đồng): Chi tiết thông tin cá nhân và tổ chức.
- Tab 2 (Lịch phân ca): Hiển thị lưới tháng các ca làm việc của nhân viên này trong tháng 10/2026.
- Tab 3 (Bảng chấm công): Bảng chi tiết giờ vào, giờ ra, số giờ làm việc thực tế trong tháng.
- Tab 4 (Nghỉ phép): Thẻ quỹ phép năm (ví dụ: `8.5 / 12.0 ngày còn lại`) và danh sách các đơn nghỉ phép của nhân viên.

### Bước 5: Xây dựng Màn hình Cài đặt Tham số SCR-16 (TSK-C05)
- Tab Cài đặt tham số:
  - Radio toggle "Ngưỡng nghỉ ngơi tối thiểu giữa 2 ca": `(•) 11.0 giờ (Prompt)  ( ) 12.0 giờ (BLLĐ 2019)`.
  - Ô chỉnh "Trần giờ làm việc tối đa trong tuần": `48.0 giờ`.
  - Ô chỉnh "Thời gian ân hạn đi muộn": `5 phút`.
- Khu vực Demo Reset: Nút đỏ `[ 🔄 Khôi phục dữ liệu mẫu ban đầu ]` xóa localStorage và nạp lại seed data gốc.

---

## Todo List
- [x] Xây dựng `DashboardPage.tsx` và 4 thẻ KPI.
- [x] Xây dựng `TrendBarChart.tsx` đồ họa SVG thuần túy.
- [x] Xây dựng `QuickAttendanceCard.tsx` (Web check-in/out).
- [x] Xây dựng `PendingApprovalsWidget.tsx` (Duyệt đơn nhanh).
- [x] Xây dựng `EmployeeListPage.tsx` và phân trang bảng dữ liệu.
- [x] Xây dựng `EmployeeFormModal.tsx` với validation regex Việt Nam.
- [x] Xây dựng `EmployeeDetailPage.tsx` với đầy đủ 4 tabs liên kết dữ liệu.
- [x] Xây dựng `SettingsPage.tsx` và toggle chuyển đổi ngưỡng 11h/12h.
- [x] Tích hợp tính năng Reset Demo Data vào trang Cài đặt.
- [x] Chạy `npm run build` xác nhận zero build errors.

---

## Success Criteria (Definition of Done)
1. Dashboard hiển thị đúng số liệu KPI quân số (45 tổng, 38 có mặt, 2 muộn, 3 nghỉ).
2. Thao tác Check-in / Check-out cập nhật trạng thái chấm công tức thì.
3. Bấm xem chi tiết nhân viên chuyển sang SCR-05 hiển thị đầy đủ thông tin cả 4 tabs.
4. Đổi toggle ngưỡng nghỉ từ 11h sang 12h trên SCR-16 $\rightarrow$ Bảng lịch tuần SCR-11 cập nhật cảnh báo mới tương ứng.
5. Lệnh `npm run build` biên dịch thành công.

---

## Next Steps
Tiếp tục triển khai các phân hệ vận hành tiếp theo: [Phase 05: Chấm Công, Mẫu Ca, Nghỉ Phép & Báo Cáo](./phase-05-attendance-leaves-reports.md).
