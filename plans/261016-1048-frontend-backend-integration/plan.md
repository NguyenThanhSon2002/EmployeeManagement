---
title: "Kế Hoạch Đấu Nối Toàn Diện Frontend React Với Backend Spring Boot (Dual-Mode)"
description: "Kế hoạch chi tiết 3 giai đoạn kết nối dữ liệu từ MySQL & Spring Boot REST API lên giao diện React 19 theo mô hình Dual-Mode (Hybrid API/Mock Fallback)."
status: completed
priority: P1
effort: 16h
branch: main
tags: [integration, frontend, backend, dual-mode, zustand, react19, spring-boot, mysql]
blockedBy: [261016-0945-backend-implementation]
blocks: []
created: 2026-10-16
---

# Kế Hoạch Đấu Nối Toàn Diện Frontend React Với Backend Spring Boot (Dual-Mode)

## Overview

Kế hoạch này hướng dẫn chi tiết quy trình chuyển đổi toàn bộ giao diện Frontend React từ việc tiêu thụ dữ liệu giả lập cục bộ (Mock Data) sang kết nối trực tiếp với phân hệ máy chủ Backend Spring Boot 3.3.4 và CSDL MySQL 8.0 (`hrms_db`).

Hệ thống được thiết kế theo mô hình **Dual-Mode (Hybrid API / Mock Fallback)**:
- Mặc định ở môi trường phát triển & sản xuất: Sử dụng 100% dữ liệu thực từ Backend REST API (`VITE_USE_MOCK=false`).
- Khi chạy kiểm thử tự động (Vitest) hoặc khi Backend không khả dụng: Tự động hoặc chủ động chuyển sang Mock Data (`VITE_USE_MOCK=true`), bảo đảm 35 bài test Vitest hiện có không bị gián đoạn.
- Đồng thời khắc phục 2 cảnh báo kiến trúc được phát hiện trong quá trình Code Review: Ánh xạ chuẩn `employeeId` từ `UserPrincipal` và làm phẳng phong bì dữ liệu phân trang `PageResponse`.

Tổng thời lượng dự toán: **16 giờ làm việc**, chia thành 3 giai đoạn rõ ràng.

---

## Cross-Plan Dependencies

| Quan Hệ | Thư Mục Kế Hoạch | Trạng Thái | Ghi Chú |
|:---|:---|:---:|:---|
| Predecessor | [`plans/261016-0945-backend-implementation`](../261016-0945-backend-implementation/plan.md) | `completed` | Phân hệ Backend Spring Boot & MySQL 36/36 tests pass |
| Predecessor | [`plans/261013-1717-frontend-implementation`](../261013-1717-frontend-implementation/plan.md) | `completed` | Phân hệ Frontend React 35/35 tests pass |

---

## Phases

| Phase | Tên Giai Đoạn & Nhiệm Vụ | Trạng Thái | Thời Lượng | File Đặc Tả Chi Tiết |
|:---:|:---|:---:|:---:|:---|
| 1 | [Cấu Hình Dual-Mode, Xác Thực JWT & Danh Mục Nhân Sự, Phòng Ban](./phase-01-auth-employee-integration.md) | Completed ✅ | 5h | [phase-01-auth-employee-integration.md](./phase-01-auth-employee-integration.md) |
| 2 | [Đấu Nối Ma Trận Xếp Ca Tuần & Conflict Detection Engine](./phase-02-schedule-matrix-conflict-integration.md) | Completed ✅ | 6h | [phase-02-schedule-matrix-conflict-integration.md](./phase-02-schedule-matrix-conflict-integration.md) |
| 3 | [Đấu Nối Chấm Công, Nghỉ Phép & Xuất Báo Cáo Excel/CSV](./phase-03-attendance-leave-report-integration.md) | Completed ✅ | 5h | [phase-03-attendance-leave-report-integration.md](./phase-03-attendance-leave-report-integration.md) |

---

## Architecture & Integration Standards

1. **Adapter Pattern:** Mọi hàm gọi API trong `frontend/src/services/*` đều chuyển đổi linh hoạt qua biến `VITE_USE_MOCK`.
2. **Token Lifecycle:** Quản lý `access_token` tự động chèn vào header `Authorization: Bearer <token>` qua `apiClient.ts`.
3. **Optimistic Locking:** Xử lý lỗi HTTP 409 khi có xung đột phiên bản lịch bằng cách tải lại dữ liệu mới nhất kèm thông báo người dùng trực quan.
