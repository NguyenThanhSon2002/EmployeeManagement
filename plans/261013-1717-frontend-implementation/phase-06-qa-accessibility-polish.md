# GIAI ĐOẠN 06: TIẾP CẬN A11Y, MOBILE RESPONSIVE & ĐÓNG GÓI (PHASE 06 - POLISH)

## Context Links
- Kế hoạch tổng thể: [plan.md](./plan.md)
- Giai đoạn trước: [phase-05-attendance-leaves-reports.md](./phase-05-attendance-leaves-reports.md)
- Kế hoạch Kiểm thử & QA: [`docs/14-frontend-test-and-quality-plan.md`](../../docs/14-frontend-test-and-quality-plan.md)
- Lộ trình chi tiết: [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md) (Stage E)

---

## Overview
- **Mã giai đoạn:** Phase 06 (Stage E - ĐÁNH BÓNG & NGHIỆM THU)
- **Mức độ ưu tiên:** P2 (Đảm bảo chất lượng xuất xưởng)
- **Trạng thái:** Completed
- **Thời lượng ước tính:** 8 giờ làm việc
- **Mô tả vắn tắt:** Kiểm thử và hoàn thiện trải nghiệm đáp ứng đa thiết bị, đặc biệt là chế độ xem di động (< 768px: Day Tabs Slider dạng danh sách) và máy tính bảng (768px - 1024px: Sidebar thu gọn 80px); thực thi kiểm toán chuẩn tiếp cận người khuyết tật (WCAG 2.1 AA: Focus Trap trên toàn bộ Dialog/Drawer, kiểm tra tỷ lệ tương phản màu sắc, bổ sung `aria-label` cho trình đọc màn hình); thực thi 100% checklist QA thủ công trên cả 17 màn hình; tối ưu hóa kích thước gói đóng gói (Build Optimization); và soạn thảo tài liệu hướng dẫn vận hành `frontend/README.md`.

---

## Key Insights
1. **Fallback mượt mà trên Di động:** Ma trận 8 cột là giải pháp tuyệt vời cho Desktop, nhưng trên màn hình điện thoại 375px - 430px, việc ép cuộn ngang làm giảm nghiêm trọng trải nghiệm. Chế độ **Bộ chọn thứ dạng Tab trượt ngang (Day Tabs Slider)** kết hợp **Danh sách ca theo ngày (Day-by-Day List)** giúp người quản lý vẫn có thể xem ca và đổi ca bằng một tay trên điện thoại một cách tự nhiên.
2. **Khóa Tiêu Điểm An Toàn (Accessible Focus Trap):** Mọi Dialog và Drawer khi mở ra bắt buộc phải giam giữ phím `Tab` bên trong phần tử đó, không để lọt con trỏ ra ngoài trang nền, đồng thời hỗ trợ phím `Escape` đóng nhanh.
3. **Hiệu năng Render & Bundle:** Đảm bảo bundle sau khi build có kích thước nén Gzip $< 180$ KB, loại bỏ code thừa qua Tree-shaking của Vite và Rollup.

---

## Requirements
- **WCAG 2.1 AA:** Toàn bộ văn bản đạt tỷ lệ tương phản $\ge 4.5:1$, thành phần đồ họa $\ge 3.0:1$.
- **Responsive Matrix:** Hoạt động hoàn hảo trên 4 kích thước: Mobile (< 768px), Tablet (768px - 1024px), Desktop (1024px - 1440px), Large Desktop (> 1440px).
- **Browser Matrix:** Tương thích tốt trên Google Chrome, Microsoft Edge, Mozilla Firefox và Apple Safari.
- **Performance SLA:** Màn hình Lịch tuần tải dưới 200ms cho 25 nhân sự và dưới 2.5 giây cho 300 nhân sự.

---

## Architecture & Responsive Strategy
```text
CƠ CHẾ CO GIÃN THEO ĐIỂM NGẮT (RESPONSIVE BEHAVIOR)
┌────────────────────────────────────────────────────────────────────────┐
│ DESKTOP (> 1024px)                                                     │
│ [Sidebar: 250px] [Topbar]                                              │
│ [Ma trận tuần: 8 cột (Sticky Cột Nhân viên 240px + 7 Cột Thứ)]          │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (Thu hẹp màn hình)
┌────────────────────────────────────────────────────────────────────────┐
│ TABLET (768px - 1024px)                                                │
│ [Sidebar: 80px Icon-only] [Topbar thu gọn]                             │
│ [Ma trận tuần: Co gọn padding, Cột nhân viên sticky 180px]             │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (Màn hình điện thoại)
┌────────────────────────────────────────────────────────────────────────┐
│ MOBILE (< 768px)                                                       │
│ [Header Hamburger Menu]                                                │
│ [Day Tabs Slider: < [T2] [T3] [•T4•] [T5] [T6] [T7] [CN] > ]           │
│ [Danh sách ca ngày đang chọn: Thẻ nhân viên xếp dọc dạng thẻ List]      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Related Code Files
| Thao Tác | Đường Dẫn File | Mô Tả Trách Nhiệm |
|:---:|:---|:---|
| **Create** | `frontend/src/features/schedule/components/MobileDayView.tsx` | Chế độ xem theo ngày trên điện thoại (< 768px) |
| **Create** | `frontend/src/hooks/useModalFocusTrap.ts` | Hook kiểm soát tiêu điểm bàn phím cho Dialog/Drawer |
| **Create** | `frontend/src/test/a11y-audit.test.ts` | Bài kiểm tra độ tương phản màu sắc và nhãn ARIA |
| **Create** | `frontend/README.md` | Tài liệu hướng dẫn cài đặt, chạy dev, test, build và kịch bản demo |

---

## Implementation Steps

### Bước 1: Kiểm thử Responsive & Chế độ Mobile (TSK-E01)
- Xây dựng component `<MobileDayView />` trong `src/features/schedule/components/`:
  - Bộ chọn thứ dạng Tab trượt ngang: `[ T2 (12/10) ] [ T3 (13/10) ] [• T4 (14/10) •]...`.
  - Bên dưới hiển thị danh sách nhân sự của phòng ban vào ngày đó: Avatar, Tên, Ca phân công, Nút đổi ca, Nút xóa ca.
- Cấu hình Media Queries trong `schedule.css`:
  - Khi `@media (max-width: 767px)`: Ẩn `<WeeklyGrid />`, hiển thị `<MobileDayView />`.
  - Khi `@media (max-width: 1023px)`: Tự động thu gọn Sidebar sang chế độ 80px icon-only.

### Bước 2: Kiểm định Tiếp cận Accessibility WCAG 2.1 AA (TSK-E02)
- Tích hợp hook `useModalFocusTrap` vào: `AssignShiftDrawer`, `BulkAssignDialog`, `CopyWeekDialog`, `PublishConfirmDialog`, `ChangeReasonDialog`, `EmployeeFormModal`.
- Bổ sung thuộc tính `aria-label` chi tiết cho từng thẻ ca:
  - *"Nhân viên [Tên], [Thứ], [Tên ca], từ [Giờ vào] đến [Giờ ra], [Số giờ] giờ. Cảnh báo: [Nội dung vi phạm nếu có]"*.
- Kiểm tra điều hướng bàn phím:
  - Phím mũi tên (Arrow Keys) di chuyển giữa các ô ma trận tuần.
  - Phím `Enter` mở Drawer.
  - Phím `Escape` đóng popup an toàn.

### Bước 3: Rà soát Toàn diện QA Checklist (TSK-E03)
- Thực thi toàn bộ checklist kiểm thử thủ công từ Tài liệu 14:
  - Kiểm tra SCR-02 (Dashboard): 4 KPI, Check-in/out, biểu đồ SVG.
  - Kiểm tra SCR-03/04/05 (Nhân sự): Phân trang, tìm kiếm, form 2 cột, 4 tabs chi tiết.
  - Kiểm tra SCR-08/09 (Chấm công): Bảng điểm danh, duyệt giải trình.
  - Kiểm tra SCR-10 (Ca làm việc): Mẫu ca trực quan.
  - Kiểm tra SCR-11/12 (Lịch tuần): Đầy đủ 10 worked examples, gán ca, xuất CSV UTF-8 BOM, sửa lịch Published có lý do.
  - Kiểm tra SCR-13/14 (Nghỉ phép): Nộp đơn, duyệt đơn đồng bộ sang Lịch tuần.
  - Kiểm tra SCR-15 (Báo cáo): 3 tabs báo cáo, xuất CSV.
  - Kiểm tra SCR-16 (Cài đặt): Toggle ngưỡng nghỉ 11h/12h, nút Reset Demo Data.

### Bước 4: Tối ưu hóa Build & Viết Tài Liệu Vận Hành (TSK-E04)
- Chạy kiểm tra chất lượng mã nguồn:
  ```bash
  npm run build
  npx vitest run
  ```
- Tạo file `frontend/README.md` cung cấp:
  1. Hướng dẫn khởi động nhanh dev server: `npm install && npm run dev`.
  2. Hướng dẫn chạy kiểm thử: `npm test`.
  3. Hướng dẫn xuất bản build: `npm run build`.
  4. Hướng dẫn kịch bản demo cho Giám đốc / Khách hàng (các nút đổi vai trò, các ca vi phạm mẫu, nút reset dữ liệu).

---

## Todo List
- [x] Xây dựng `MobileDayView.tsx` cho thiết bị di động.
- [x] Cấu hình CSS Responsive Media Queries cho ma trận lịch tuần.
- [x] Xây dựng hook `useModalFocusTrap.ts` và bọc toàn bộ Dialogs.
- [x] Bổ sung đầy đủ thuộc tính `aria-label` cho các thẻ ca.
- [x] Thực thi 100% checklist QA thủ công trên toàn bộ 17 màn hình.
- [x] Kiểm tra nút Reset Demo Data khôi phục dữ liệu ban đầu hoàn hảo.
- [x] Viết tài liệu hướng dẫn vận hành chi tiết `frontend/README.md`.
- [x] Chạy `npm run build` và `npx vitest run` xác nhận 100% thành công.

---

## Success Criteria (Definition of Done)
1. Ứng dụng co giãn hoàn hảo trên cả 3 kích thước: Di động (iPhone/Android), Máy tính bảng (iPad), và Máy tính để bàn (Desktop).
2. Toàn bộ các Dialog và Drawer giam giữ tiêu điểm bàn phím an toàn (Focus Trap) và đóng bằng phím `Escape`.
3. 100% các bài test Vitest chạy xanh (Pass).
4. Lệnh `npm run build` tạo thư mục `dist/` tối ưu mà không có lỗi TypeScript hay cảnh báo nào.
5. Tài liệu `frontend/README.md` đầy đủ, rõ ràng, sẵn sàng chuyển giao.

---

## Next Steps / Delivery
Toàn bộ kế hoạch triển khai đã hoàn thiện. Bắt đầu thi công dự án bằng cách chạy lệnh:
`/xd:cook D:\Project\Employee Management\plans\261013-1717-frontend-implementation\plan.md`
