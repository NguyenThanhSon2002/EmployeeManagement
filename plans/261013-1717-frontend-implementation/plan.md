---
title: "Kế Hoạch Triển Khai Kỹ Thuật Frontend - Employee Management System"
description: "Kế hoạch thi công chi tiết toàn diện 6 giai đoạn (88 giờ) cho ứng dụng React + TypeScript Frontend Prototype, tập trung vào Lịch phân ca tuần (SCR-11), Dashboard, Quản lý Nhân sự, Chấm công, Nghỉ phép và Báo cáo."
status: completed
priority: P1
effort: 88h
branch: main
tags: [frontend, react, typescript, vite, zustand, schedule, hrms, enterprise]
blockedBy: []
blocks: []
created: 2026-10-13
---

# Kế Hoạch Triển Khai Kỹ Thuật Frontend - Employee Management System

## Overview

Kế hoạch này hướng dẫn chi tiết từng bước xây dựng phân hệ giao diện người dùng (Frontend Prototype) cho Hệ thống Quản lý Nhân sự, Ca làm việc & Chấm công (Employee Management System). Phân hệ được xây dựng hoàn toàn độc lập phía máy khách (Client-side) với dữ liệu mẫu xác định (Deterministic Mock Data), công cụ phát hiện xung đột thời gian thực (Conflict Engine), hệ thống Design Tokens CSS Variables chuẩn WCAG 2.1 AA và kiến trúc tầng Service sẵn sàng kết nối Backend Spring Boot REST API mà không cần sửa đổi components.

Tổng thời lượng dự án: **88 giờ làm việc (~11 ngày công)**, chia thành 6 giai đoạn rõ ràng với tiêu chí nghiệm thu chặt chẽ.

## Cross-Plan Dependencies

| Quan Hệ | Thư Mục Kế Hoạch | Trạng Thái | Ghi Chú |
|:---|:---|:---:|:---|
| None | Không có kế hoạch khác đang chạy | - | Kế hoạch khởi tạo đầu tiên |

## Phases

| Phase | Tên Giai Đoạn & Nhiệm Vụ | Trạng Thái | Thời Lượng | File Đặc Tả Chi Tiết |
|:---:|:---|:---:|:---:|:---|
| 1 | [Khởi Tạo Dự Án & Nền Tảng Kỹ Thuật (Stage 0)](./phase-01-setup-and-foundation.md) | Completed | 6h | [phase-01-setup-and-foundation.md](./phase-01-setup-and-foundation.md) |
| 2 | [Khung Ứng Dụng, State & Scheduling Engine (Stage A)](./phase-02-app-shell-and-engine.md) | Completed | 14h | [phase-02-app-shell-and-engine.md](./phase-02-app-shell-and-engine.md) |
| 3 | [Lịch Phân Ca Tuần Cốt Lõi SCR-11 & SCR-12 (Stage B)](./phase-03-core-schedule-roster.md) | Completed | 32h | [phase-03-core-schedule-roster.md](./phase-03-core-schedule-roster.md) |
| 4 | [Dashboard, Hồ Sơ Nhân Sự & Cài Đặt (Stage C)](./phase-04-dashboard-and-employees.md) | Completed | 12h | [phase-04-dashboard-and-employees.md](./phase-04-dashboard-and-employees.md) |
| 5 | [Chấm Công, Mẫu Ca, Nghỉ Phép & Báo Cáo (Stage D)](./phase-05-attendance-leaves-reports.md) | Completed | 16h | [phase-05-attendance-leaves-reports.md](./phase-05-attendance-leaves-reports.md) |
| 6 | [Tiếp Cận A11y, Mobile Responsive & Đóng Gói (Stage E)](./phase-06-qa-accessibility-polish.md) | Completed | 8h | [phase-06-qa-accessibility-polish.md](./phase-06-qa-accessibility-polish.md) |

## Dependencies

- **Tài liệu nguồn chân lý (Source of Truth):**
  - [`docs/09-frontend-decisions.md`](../../docs/09-frontend-decisions.md): Sổ bộ quyết định kiến trúc FDEC-001..014.
  - [`docs/10-frontend-architecture-plan.md`](../../docs/10-frontend-architecture-plan.md): Cây thư mục, Domain Types, giải mã thuật toán.
  - [`docs/11-schedule-screen-specification.md`](../../docs/11-schedule-screen-specification.md): Đặc tả chi tiết SCR-11/12, wireframes ASCII, 10 worked examples.
  - [`docs/12-frontend-design-system-and-screens.md`](../../docs/12-frontend-design-system-and-screens.md): Tokens, WCAG contrast, đặc tả 7 màn hình phụ.
  - [`docs/13-frontend-mock-data-plan.md`](../../docs/13-frontend-mock-data-plan.md): Dữ liệu mẫu neo Thứ Hai tuần này, seed table 25 nhân sự.
  - [`docs/14-frontend-test-and-quality-plan.md`](../../docs/14-frontend-test-and-quality-plan.md): Kế hoạch kiểm thử Vitest, manual QA checklist.
  - [`docs/15-frontend-implementation-roadmap.md`](../../docs/15-frontend-implementation-roadmap.md): Chi tiết WBS và prompts thi công.
  - [`docs/16-frontend-traceability.md`](../../docs/16-frontend-traceability.md): Ma trận truy xuất nguồn gốc.
- **Ngăn xếp công nghệ sử dụng:**
  - `Node.js >= 18.0.0`
  - `React 18.3+` / `React 19` + `TypeScript 5.4+` (Strict Mode 100%)
  - `Vite 5.x` (Build tool & Dev Server)
  - `React Router DOM v6` (Client routing)
  - `Zustand v4+` (State Management với Atomic Selectors)
  - `date-fns v3` (Xử lý ngày giờ bất biến)
  - `@fontsource/be-vietnam-pro`, `@fontsource/inter` (Phông chữ ngoại tuyến)
  - `lucide-react` (Biểu tượng UI)
  - `Vitest` + `@testing-library/react` + `jsdom` (Kiểm thử đơn vị)

## Key Decisions & Architecture Alignment

- **FDEC-001 (Styling):** Plain CSS Variables với Design Tokens, không dùng component library nặng để tối ưu tuyệt đối CSS Grid 8 cột ma trận tuần.
- **FDEC-002 (Date Library):** Sử dụng `date-fns v3` (pure functions, tree-shakable).
- **FDEC-003 (State):** Sử dụng `Zustand v4+` tránh re-render cả cây bảng 25 nhân viên x 7 ngày = 175 ô khi sửa 1 ca.
- **FDEC-004 (Roster Grid):** Tự xây dựng Custom CSS Grid thay vì FullCalendar thương mại ($480+) hay React Big Calendar.
- **FDEC-007 (Rest Threshold):** Ngưỡng nghỉ mặc định giữa 2 ca là 11.0 giờ, hỗ trợ toggle sang 12.0 giờ (BLLĐ 2019).
- **FDEC-010 (CSV Export):** Client-side CSV download với UTF-8 BOM (`\uFEFF`) chống lỗi font tiếng Việt trên Excel.
- **FDEC-012 (Dynamic Anchor):** Dữ liệu mẫu neo động theo `startOfWeek(new Date(), { weekStartsOn: 1 })`.
