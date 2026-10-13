# GIAI ĐOẠN 02: KHUNG ỨNG DỤNG, STATE & SCHEDULING ENGINE (PHASE 02)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Giai đoạn trước: [phase-01-setup-and-foundation.md](./phase-01-setup-and-foundation.md)
- Kiến trúc & Domain Types: [`docs/10-frontend-architecture-plan.md`](../../docs/10-frontend-architecture-plan.md)
- Kế hoạch Mock Data: [`docs/13-frontend-mock-data-plan.md`](../../docs/13-frontend-mock-data-plan.md)
- Kế hoạch Kiểm thử: [`docs/14-frontend-test-and-quality-plan.md`](../../docs/14-frontend-test-and-quality-plan.md)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage A)

---

## Overview
- **Mã giai đoạn:** Phase 02 (Stage A)
- **Mức độ ưu tiên:** P1 (Cốt lõi logic)
- [x] **Trạng thái:** Completed (Hoàn thành)
- **Thời lượng ước tính:** 14 giờ làm việc
- **Mô tả vắn tắt:** Triển khai toàn bộ Domain Types TypeScript; xây dựng các hàm tiện ích thuần túy (Pure Utils) tính toán thời lượng ca (Gross/Net), xử lý ca đêm (+1 ngày), công cụ phát hiện xung đột thời gian thực (Conflict Detection Engine) kiểm tra 6 quy tắc BR-001..BR-007; viết 18 Unit Tests Vitest đạt 100% pass; nạp dữ liệu hạt giống 25 nhân sự neo theo Thứ Hai tuần hiện tại; hoàn thiện bố cục ứng dụng `<AppLayout />`, `<Sidebar />` và `<RoleSwitcher />`.

---

## Key Insights
1. **Phân tách hoàn toàn Engine khỏi React:** `conflict-detector.utils.ts` và `schedule-calc.utils.ts` là các hàm thuần túy (Pure Functions). Chúng nhận dữ liệu mảng đối tượng và trả về kết quả kiểm tra mà không gọi `useState` hay phụ thuộc React DOM. Nhờ đó, Unit Test chạy siêu tốc và thuật toán có thể tái sử dụng cho cả Web Worker hoặc Backend sau này.
2. **Neo dữ liệu mẫu động:** Dữ liệu phân ca được tính toán dựa trên `startOfWeek(new Date(), { weekStartsOn: 1 })`. Nút "Hôm nay" và "Tuần này" luôn có dữ liệu sống động ở bất kỳ thời điểm nào kiểm thử demo.
3. **Mô phỏng 3 vai trò qua Zustand:** Store `useAuthStore` cho phép chuyển đổi vai trò (Admin, Manager, Employee) với một cú nhấp chuột trên Topbar, tức thì cập nhật quyền hạn hiển thị trên toàn bộ giao diện.

---

## Requirements
- **FR-013:** Tính toán tự động thời lượng ca làm việc kế hoạch (gross hours, net hours sau trừ giờ nghỉ).
- **FR-019:** Phát hiện xung đột tức thì khi xếp ca (Trùng giờ BR-001, Nghỉ $< 11$h BR-006, Vượt trần 48h BR-004, Trùng ngày phép BR-003, Ngày lễ BR-007, Nhân viên nghỉ việc BR-002).
- **FR-029:** Tiện ích xuất file CSV client-side có chèn UTF-8 BOM (`\uFEFF`) chống lỗi font tiếng Việt.
- **FR-030 & FR-001:** Bố cục AppLayout phân vai trò, Topbar hiển thị đồng hồ thời gian thực GMT+7 và Avatar người dùng.

---

## Architecture & Design
```text
src/
├── types/
│   ├── domain.types.ts           # 14 Interfaces: Employee, ShiftTemplate, Assignment...
│   └── schedule.types.ts         # CellState, MatrixFilter, HistoryEntry...
├── utils/
│   ├── date.utils.ts             # Thao tác dải ngày tuần, offset Thứ Hai
│   ├── schedule-calc.utils.ts    # Gross, Net, Night hours, Weekly sum
│   ├── conflict-detector.utils.ts# Kiểm tra 6 quy tắc BR-001..BR-007
│   ├── csv-exporter.utils.ts     # Xuất CSV chuẩn UTF-8 BOM
│   └── __tests__/                # 4 Bộ kiểm thử đơn vị Vitest
├── data/
│   └── mock/                     # Dữ liệu hạt giống (25 NV, 4 ca, seed tuần)
├── store/
│   ├── useAuthStore.ts           # Quản lý phiên đăng nhập & Role Switcher
│   ├── useScheduleStore.ts       # Store chính của Lịch phân ca tuần
│   └── useSettingsStore.ts       # Cấu hình ngưỡng nghỉ 11h/12h
└── components/
    └── layout/
        ├── AppLayout.tsx         # Khung bao Sidebar + Topbar + Content
        ├── Sidebar.tsx           # Menu điều hướng (co giãn 250px/80px)
        ├── Topbar.tsx            # Breadcrumbs, Real-time Clock, User Menu
        └── RoleSwitcher.tsx      # Dropdown chuyển đổi 3 vai trò
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/src/types/domain.types.ts` | Khai báo 14 domain interfaces chuẩn theo Tài liệu 10 |
| **Create** | `frontend/src/utils/date.utils.ts` | Hàm lấy Thứ Hai tuần này, format dd/MM/yyyy, dải ngày tuần |
| **Create** | `frontend/src/utils/schedule-calc.utils.ts`| Hàm tính Gross/Net hours, ca đêm, tách giờ, cộng dồn tuần |
| **Create** | `frontend/src/utils/conflict-detector.utils.ts`| Engine kiểm tra trùng ca (BR-001), nghỉ $< 11$h, trần 48h... |
| **Create** | `frontend/src/utils/csv-exporter.utils.ts` | Tiện ích xuất CSV client-side UTF-8 BOM |
| **Create** | `frontend/src/utils/__tests__/schedule-calc.test.ts`| 5 Unit Tests tính thời lượng ca theo Tài liệu 14 |
| **Create** | `frontend/src/utils/__tests__/overlap-detector.test.ts`| 6 Unit Tests kiểm tra trùng ca theo Tài liệu 14 |
| **Create** | `frontend/src/utils/__tests__/rest-time.test.ts`| 4 Unit Tests kiểm tra khoảng nghỉ giữa 2 ca |
| **Create** | `frontend/src/utils/__tests__/copy-merge.test.ts`| 4 Unit Tests thuật toán trộn ca sao chép tuần |
| **Create** | `frontend/src/data/mock/*.ts` | Seed data: departments, positions, shifts, employees, seed |
| **Create** | `frontend/src/store/useAuthStore.ts` | Store vai trò và người dùng hiện tại |
| **Create** | `frontend/src/store/useSettingsStore.ts`| Store tham số hệ thống (ngưỡng 11h/12h) |
| **Create** | `frontend/src/components/layout/AppLayout.tsx` | Layout chuẩn Enterprise Dashboard |
| **Create** | `frontend/src/components/layout/Sidebar.tsx` | Menu điều hướng bên trái responsive |
| **Create** | `frontend/src/components/layout/Topbar.tsx` | Thanh tiêu đề trên cùng kèm đồng hồ thực tế |
| **Create** | `frontend/src/components/layout/RoleSwitcher.tsx`| Nút chuyển đổi vai trò trực quan |

---

## Implementation Steps

### Bước 1: Khai báo Domain Types TypeScript (TSK-A01)
Tạo `src/types/domain.types.ts` với đầy đủ: `RoleType`, `Department`, `Position`, `Employee`, `ShiftTemplate`, `ScheduleWeek`, `ShiftAssignment` (chứa 6 trường snapshot), `ScheduleConflict`, `AttendanceRecord`, `LeaveRequest`, `CompanyHoliday`, `ChangeHistoryEntry`, `DemoSettings`.

### Bước 2: Xây dựng Pure Utils Tính toán Thời lượng & Ngày giờ (TSK-A02)
- `date.utils.ts`:
  - `getCurrentMonday(): Date`
  - `getWeekDays(baseMonday: Date): Date[]` (Mảng 7 ngày T2..CN)
  - `formatDateVi(date: Date | string): string` (`dd/MM/yyyy`)
  - `formatTimeVi(timeStr: string): string` (`HH:mm`)
- `schedule-calc.utils.ts`:
  - `calculateShiftDurations(startTime, endTime, breakMinutes, isCrossMidnight)`
  - `calculateNightWindowMinutes(startMin, endMin)`
  - `sumWeeklyScheduledHours(assignments: ShiftAssignment[]): number`

### Bước 3: Xây dựng Conflict Detection Engine (TSK-A03)
Tạo `src/utils/conflict-detector.utils.ts` cài đặt 6 quy tắc:
1. `checkShiftOverlap(newShift, existingShifts)` $\rightarrow$ `BR-001` (MANDATORY).
2. `checkEmployeeActiveForShift(employee, workDate)` $\rightarrow$ `BR-002` (MANDATORY).
3. `checkLeaveConflict(employeeId, workDate, approvedLeaves)` $\rightarrow$ `BR-003` (WARNING).
4. `checkWeeklyHoursLimit(employeeId, newShiftHours, existingHours, maxWeeklyHours)` $\rightarrow$ `BR-004` (WARNING).
5. `checkDailyHoursLimit(employeeId, workDate, totalDailyHours, maxDailyHours)` $\rightarrow$ `BR-005` (WARNING).
6. `checkRestTimeBetweenShifts(currentShift, allShifts, minRestHours)` $\rightarrow$ `BR-006` (WARNING).

### Bước 4: Viết và Chạy Bộ Kiểm Thử Vitest (TSK-A04)
Tạo các file test trong `src/utils/__tests__/`. Chạy `npx vitest run`:
- Đạt 100% pass cho toàn bộ 18 test cases đã đặc tả trong Tài liệu 14.

### Bước 5: Nạp Mock Seed Data Động (TSK-A05)
Tạo thư mục `src/data/mock/` với 25 nhân viên, 5 phòng ban, 4 mẫu ca chuẩn. Bản ghi ca tuần này ($W0$) chứa sẵn các kịch bản kiểm thử:
- EMP-001: Lịch chuẩn hành chính.
- EMP-002: Ca chiều T2 $\rightarrow$ Ca sáng sớm T3 vi phạm nghỉ 8.0h (< 11.0h); Nghỉ phép năm T5.
- EMP-003: Ca qua đêm 22:00 - 06:00 T3, T5, T7.
- EMP-004: Làm 7 ngày (56h/48h) và ca Chủ Nhật rơi vào Ngày lễ công ty.
- EMP-023: Nhân viên đã thôi việc (khóa ô).

### Bước 6: Xây dựng Khung Giao Diện AppLayout & RoleSwitcher (TSK-A06)
- Xây dựng `<Sidebar />`: Menu 7 phân hệ, hỗ trợ thu gọn 80px (icon-only) hoặc mở rộng 250px.
- Xây dựng `<Topbar />`: Breadcrumb phân cấp, Đồng hồ thời gian thực nhảy giây chuẩn GMT+7, `<RoleSwitcher />` dropdown, Avatar menu.
- Xây dựng `<AppLayout />`: Khung co giãn tự động theo kích thước màn hình.

---

## Todo List
- [x] Khai báo 100% Domain Interfaces trong `src/types/domain.types.ts`.
- [x] Hoàn thành `date.utils.ts` và `schedule-calc.utils.ts`.
- [x] Hoàn thành `conflict-detector.utils.ts` với 6 quy tắc BR.
- [x] Hoàn thành `csv-exporter.utils.ts` với ký tự UTF-8 BOM.
- [x] Viết 4 file unit test Vitest trong `src/utils/__tests__/`.
- [x] Chạy `npx vitest run` xác nhận 100% test cases pass.
- [x] Tạo đầy đủ các file dữ liệu mẫu trong `src/data/mock/`.
- [x] Xây dựng các store Zustand: `useAuthStore`, `useSettingsStore`.
- [x] Xây dựng các layout components: `<AppLayout />`, `<Sidebar />`, `<Topbar />`, `<RoleSwitcher />`.
- [x] Chạy `npm run build` xác nhận zero type errors.

---

## Success Criteria (Definition of Done)
1. Lệnh `npx vitest run` chạy qua 18 bài test với kết quả xanh (100% pass).
2. Lệnh `npm run build` biên dịch thành công.
3. Chạy `npm run dev` hiển thị giao diện Shell hoàn chỉnh; đổi vai trò trên Topbar cập nhật state tức thì mà không giật lag.

---

## Next Steps
Sau khi Phase 02 hoàn tất, chuyển tiếp sang trọng tâm cốt lõi của dự án: [Phase 03: Lịch Phân Ca Tuần Cốt Lõi SCR-11 & SCR-12](./phase-03-core-schedule-roster.md).
