---
title: "Kế Hoạch Triển Khai Kỹ Thuật Backend - Employee Management System"
description: "Kế hoạch thi công chi tiết toàn diện 3 giai đoạn (64 giờ) cho Backend Spring Boot 3.3.x, Java 21, Maven và MySQL 8.0 theo kiến trúc Modular Monolith (Package-by-Feature)."
status: completed
priority: P1
effort: 64h
branch: main
tags: [backend, java21, spring-boot, maven, mysql, flyway, modular-monolith, hrms, conflict-engine]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Triển Khai Kỹ Thuật Backend - Employee Management System

## Overview

Kế hoạch này hướng dẫn chi tiết từng bước xây dựng phân hệ máy chủ (Backend) cho Hệ thống Quản lý Nhân sự, Ca làm việc & Chấm công (Employee Management System). Backend được phát triển hoàn toàn bằng **Java 21 LTS**, framework **Spring Boot 3.3.x**, quản lý phụ thuộc bằng **Apache Maven**, lưu trữ dữ liệu trên hệ quản trị **MySQL 8.0+** với cơ chế di chuyển lược đồ tự động **Flyway Migration**.

Hệ thống tuân thủ nghiêm ngặt mô hình kiến trúc **Modular Monolith (Package-by-Feature)**, đảm bảo toàn vẹn giao dịch ACID cho các nghiệp vụ nhạy cảm (xếp ca tuần, trừ ngày phép), ngăn chặn xung đột dữ liệu đồng thời bằng **Optimistic Locking (@Version)**, duy trì tính bất biến của lịch sử bằng **Snapshot Fields**, và bảo đảm an toàn dữ liệu qua cơ chế xóa mềm **Soft Delete**.

Tổng thời lượng dự toán: **64 giờ làm việc (~8 ngày công)**, chia thành 3 giai đoạn rõ ràng với tiêu chí nghiệm thu chặt chẽ và tương thích 100% với Frontend React đã hoàn thiện.

---

## Cross-Plan Dependencies

| Quan Hệ | Thư Mục Kế Hoạch | Trạng Thái | Ghi Chú |
|:---|:---|:---:|:---|
| Predecessor | [`plans/261013-1717-frontend-implementation`](../261013-1717-frontend-implementation/plan.md) | `completed` | Phân hệ Frontend Prototype (35 tests pass) làm cơ sở ký kết giao ước API |

---

## Phases

| Phase | Tên Giai Đoạn & Nhiệm Vụ | Trạng Thái | Thời Lượng | File Đặc Tả Chi Tiết |
|:---:|:---|:---:|:---:|:---|
| 1 | [Khởi Tạo Dự Án, CSDL MySQL, Bảo Mật JWT & Master Data](./phase-01-setup-database-security-master-data.md) | Completed ✅ | 20h | [phase-01-setup-database-security-master-data.md](./phase-01-setup-database-security-master-data.md) |
| 2 | [Mẫu Ca, Ma Trận Xếp Ca Tuần & Core Conflict Detection Engine](./phase-02-shift-templates-schedule-roster-engine.md) | Completed ✅ | 24h | [phase-02-shift-templates-schedule-roster-engine.md](./phase-02-shift-templates-schedule-roster-engine.md) |
| 3 | [Chấm Công, Quản Lý Nghỉ Phép, Báo Cáo & Tích Hợp Frontend](./phase-03-attendance-leaves-reports-integration.md) | Completed ✅ | 20h | [phase-03-attendance-leaves-reports-integration.md](./phase-03-attendance-leaves-reports-integration.md) |

---

## Dependencies & Architecture Alignment

### 1. Tài liệu Nguồn Chân Lý (Source of Truth)
- [`docs/03-database-design.md`](../../docs/03-database-design.md): Lược đồ 17+ bảng CSDL MySQL, ràng buộc khóa ngoại, indexes và kiểm toán.
- [`docs/04-api-specification.md`](../../docs/04-api-specification.md): Đặc tả RESTful API, phong bì dữ liệu (`ApiResponse`, `PageResponse`, `ErrorResponse`), mã lỗi nghiệp vụ.
- [`docs/05-architecture-and-tech-stack.md`](../../docs/05-architecture-and-tech-stack.md): Cấu trúc Package-by-Feature, danh mục thư viện Maven, nguyên tắc giao tiếp giữa các module.
- [`docs/07-scheduling-business-rules.md`](../../docs/07-scheduling-business-rules.md): Quy tắc nghiệp vụ BR-001 -> BR-010 cho thuật toán xếp ca và kiểm tra xung đột.
- [`docs/17-backend-brainstorm-and-plan-summary.md`](../../docs/17-backend-brainstorm-and-plan-summary.md): Báo cáo thống nhất các quyết định kỹ thuật và lộ trình triển khai.

### 2. Ngăn Xếp Công Nghệ Backend
- **Ngôn ngữ:** Java 21 LTS (Chạy trên môi trường OpenJDK 26 của máy chủ phát triển).
- **Build Tool:** Apache Maven 3.9.16.
- **Framework cốt lõi:** Spring Boot 3.3.4 (Spring Framework 6.1.x, namespace `jakarta.*`).
- **Data Access:** Spring Data JPA, Hibernate 6.x.
- **Cơ sở dữ liệu:** MySQL 8.0 (Service `MySQL80` cục bộ, InnoDB, `utf8mb4_unicode_ci`).
- **Database Migration:** Flyway Core 10.x + `flyway-mysql`.
- **Bảo mật:** Spring Security 6, JJWT 0.12.x (Stateless Bearer JWT, BCryptPasswordEncoder).
- **Mapping & Utilities:** MapStruct 1.5.5.Final, Lombok, Jakarta Bean Validation.
- **Tài liệu API:** Springdoc OpenAPI 2.5.0 (Swagger UI tại `http://localhost:8080/swagger-ui.html`).
- **Kiểm thử:** JUnit 5, Mockito, AssertJ.

### 3. Nguyên Tắc Thiết Kế Trọng Yếu
1. **Bất biến Dữ liệu Lịch sử Phân ca (Audit Snapshot Integrity):** Bảng `shift_assignments` luôn snapshot `snapshot_start_time`, `snapshot_end_time`, `snapshot_shift_name`, `snapshot_color_code` tại thời điểm gán để không bị sai lệch dữ liệu lịch sử khi quản lý chỉnh sửa mẫu ca trong tương lai.
2. **Khóa Lạc Quan Chống Ghi Đè (Optimistic Concurrency Control):** `schedules` và `shift_assignments` bắt buộc có `@Version` kiểm soát xung đột khi 2 quản lý cùng chỉnh sửa lịch tuần cùng lúc.
3. **Engine Phát Hiện Xung Đột Thời Gian Thực (Real-time Conflict Engine):** Thực hiện kiểm tra toàn bộ 7 quy tắc BR-001 đến BR-007 trong bộ nhớ trước khi commit giao dịch, cung cấp endpoint dry-run `POST /api/v1/schedules/{id}/validate`.
