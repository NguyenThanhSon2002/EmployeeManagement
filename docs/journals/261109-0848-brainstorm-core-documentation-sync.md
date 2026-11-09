---
title: "Brainstorm: Đồng bộ hóa toàn diện bộ tài liệu kỹ thuật cốt lõi dự án HRMS"
date: 2026-11-09
author: Antigravity
topic: documentation, architecture, database, api, sync
---

# Technical Journal: Brainstorming Core Documentation Synchronization

## Context
Người dùng yêu cầu đọc và cập nhật lại tài liệu dự án. Sau khi khảo sát toàn diện source code Backend (Spring Boot 3.3.4, Java 21 LTS), Frontend (React 19, TypeScript, Vite), Flyway migrations và các tài liệu trong `docs/`, phát hiện sự sai lệch lớn giữa tài liệu cũ và source code thực tế sau chuỗi sprint phát triển gần đây:
- CSDL đã chạy đến Flyway V27 và có 22 bảng quan hệ (trong khi `DOC-03` và `DATA_DICTIONARY` còn ghi V1-V5 và 20 bảng).
- Frontend trong `DOC-05` ghi sai Tech Stack (nhầm lẫn Ant Design 5.x, TanStack Query v5, Day.js; trong khi thực tế dùng React 19, Zustand 5, Date-fns 4, Lucide React, Oxlint, Vanilla CSS Design Tokens).
- Hoàn toàn thiếu tài liệu về phân hệ Notification, Shift Swap & Handover Traceability, Open Shift Claiming, và RBAC điều chuyển chi nhánh.

## What Happened
1. **Khảo sát & Đối soát Mã nguồn (Scout Phase):**
   - Rà soát lịch sử git commits, Flyway scripts V1 -> V27, 14 module backend và 11 feature frontend.
   - Định vị chính xác các sai lệch trọng yếu trong 6 tài liệu kỹ thuật nền tảng: `README.md`, `DOC-18`, `DATA_DICTIONARY.md`, `DOC-03`, `DOC-04`, `DOC-05`.
2. **Làm rõ yêu cầu & Thống nhất Phạm vi (Discovery Phase):**
   - Đặt câu hỏi làm rõ phạm vi và độ sâu kỹ thuật.
   - Người dùng phê duyệt tập trung cập nhật bộ tài liệu kỹ thuật cốt lõi (6 tài liệu) ở mức độ chi tiết cao nhất (đồng bộ toàn bộ 27 Migrations, 22 bảng, chi tiết payload API và sửa dứt điểm sai lệch Tech Stack).
3. **Thiết kế Giải pháp (Solution Design & Hard-Gate Approval):**
   - Trình bày chẩn đoán thực trạng và bản thiết kế kỹ thuật chi tiết từng file.
   - Người dùng chính thức xác nhận phê duyệt thiết kế ("có").
4. **Tài liệu hóa & Lập kế hoạch (Documentation & Planning Phase):**
   - Xuất báo cáo tóm tắt Brainstorm: `plans/reports/261109-0846-core-documentation-sync-report.md`.
   - Khởi tạo kế hoạch triển khai chi tiết 5 pha: `plans/261109-0847-core-technical-docs-sync/plan.md`.

## Key Decisions
- **Source of Truth Alignment:** Không phân mảnh tài liệu thành các file phụ lục rời rạc; cập nhật trực tiếp vào 6 tài liệu nền tảng để biến chúng thành nguồn tham chiếu chuẩn xác 100% cho toàn bộ đội ngũ.
- **Tech Stack Purification:** Loại bỏ hoàn toàn mọi tàn dư của Ant Design / TanStack Query trong tài liệu kiến trúc, khẳng định chuẩn kiến trúc nhẹ, tốc độ cao của React 19 + Zustand 5 + Vanilla CSS Tokens.
- **Full Schema & API Enrichment:** Bổ sung đầy đủ 5 bảng mới vào Data Dictionary và toàn bộ các endpoint Notifications, Shift Swaps, Claim ca vào API Specification kèm payload mẫu.

## Next Steps
- Kích hoạt thực thi các pha trong kế hoạch `plans/261109-0847-core-technical-docs-sync/plan.md` (khuyên dùng lệnh `/aikit-core:xd:cook`).
