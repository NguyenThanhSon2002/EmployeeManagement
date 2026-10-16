---
title: "Kế Hoạch Loại Bỏ Toàn Diện Mock Data & Chuyển Sang Cơ Sở Dữ Liệu MySQL Thật"
description: "Kế hoạch toàn diện refactor 16 file frontend, nạp danh mục nhân viên/phòng ban trực tiếp từ API MySQL, khởi tạo Zustand store với state rỗng, cô lập test fixture và xóa vĩnh viễn thư mục frontend/src/mocks."
status: completed
priority: P1
effort: 6h
branch: main
tags: [refactor, database, pure-api, mock-removal, mysql, zustand, vitest]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Loại Bỏ Toàn Diện Mock Data & Chuyển Sang Cơ Sở Dữ Liệu MySQL Thật

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Người dùng yêu cầu: *"hiện tại data của tôi đang là dữ liệu mock nhưng tôi không muốn điều đó, hãy xóa folder mock đi cho tôi và lấy dữ liệu trong database thật"*.

### Thực trạng kỹ thuật hiện tại:
1. **Khởi tạo Store bằng Mock Data:** Các Zustand Store (`useScheduleStore`, `useAttendanceStore`, `useLeaveStore`, `useAuthStore`) vẫn đang khởi tạo state mặc định bằng các hàm sinh dữ liệu giả lập (`generateDeterministicSeedData`, `getMockAttendanceRecords`, `getMockLeaves`, `MOCK_EMPLOYEES[0]`).
2. **Component phụ thuộc trực tiếp vào `mocks/`:** 
   - `MonthlyAttendanceReport.tsx`, `LateEarlyReport.tsx`, `ScheduledVsActualTable.tsx` lặp trực tiếp trên mảng `MOCK_EMPLOYEES` để tính toán báo cáo.
   - `AttendanceOverviewPage.tsx`, `LeaveRequestsPage.tsx`, `LeaveApprovalModal.tsx`, `SchedulePage.tsx` dùng `MOCK_EMPLOYEES.find(...)` và `MOCK_DEPARTMENTS` để hiển thị họ tên, mã nhân viên, phòng ban.
3. **Nếu xóa ngay thư mục `frontend/src/mocks/`:** Sẽ gây lỗi biên dịch TypeScript nghiêm trọng (Build Crash) trên 16 tệp và làm hỏng bài kiểm thử Vitest.

---

## 2. Mục Tiêu Kế Hoạch

- **100% Dữ liệu hiển thị từ MySQL:** Danh sách nhân viên, phòng ban, ca làm việc, chấm công và nghỉ phép được nạp trực tiếp từ CSDL MySQL thông qua RESTful API của Spring Boot.
- **Xóa vĩnh viễn thư mục `frontend/src/mocks/`:** Không còn bất kỳ file mock nào trong mã nguồn ứng dụng frontend.
- **Bảo toàn chất lượng kiểm thử:** Di chuyển các fixture tối thiểu cho Unit Test vào `frontend/src/test/fixtures/`, đảm bảo `npm test -- --run` đạt 35/35 tests Pass.
- **Biên dịch sạch sẽ:** Lệnh `npm run build` hoàn thành với 0 lỗi TypeScript, 0 lỗi cú pháp.

---

## 3. Lộ Trình Triển Khai (3 Phases)

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Xây Dựng Directory Store & Khử Phụ Thuộc Auth Khỏi Mock](./phase-01-directory-store-and-auth-decoupling.md) | Completed ✅ | 2.0h | Tạo store nạp nhân viên/phòng ban toàn cục từ API, refactor `useAuthStore` |
| **Phase 2** | [Khử Khởi Tạo Mock Trong Schedule, Attendance & Leave Stores](./phase-02-schedule-attendance-leave-stores-decoupling.md) | Completed ✅ | 2.0h | Đưa initial state về rỗng `[]`, nạp và đồng bộ thuần túy với backend MySQL |
| **Phase 3** | [Refactor 8 Màn Hình Báo Cáo/Chấm Công, Di Chuyển Fixture & Xóa Bỏ `mocks/`](./phase-03-components-refactor-and-mocks-removal.md) | Completed ✅ | 2.0h | Sửa 8 component đọc data từ directory store, chuyển test fixture và xóa `src/mocks` |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Pure API First:** Mọi màn hình khi mount (`useEffect`) đều kích hoạt fetch dữ liệu từ Backend. Nếu CSDL chưa có dữ liệu, hiển thị Empty State sạch sẽ thay vì fallback về mock.
2. **Directory Caching Pattern:** Danh sách Nhân viên (`employees`) và Phòng ban (`departments`) được lưu trong Store tập trung (`useDirectoryStore`), nạp 1 lần khi khởi chạy ứng dụng và tự động làm mới khi có thêm/sửa/xóa nhân viên.
3. **Zero Mock Imports:** Tuyệt đối không còn bất kỳ dòng `import ... from '@/mocks/...'` nào trong toàn bộ `src/features`, `src/shared`, `src/components`.
