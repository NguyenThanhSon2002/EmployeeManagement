---
title: "Kế Hoạch Dọn Dẹp File Thừa & Chuẩn Hóa Cấu Hình Repository"
description: "Kế hoạch loại bỏ các file assets không sử dụng, làm sạch git tracking cho build cache TypeScript, sửa lỗi link favicon 404, loại bỏ tài liệu nháp tạm thời và đảm bảo 100% kiểm thử không bị ảnh hưởng."
status: completed
priority: P2
effort: 1h
branch: main
tags: [cleanup, assets, gitignore, docs, repository-hygiene]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Dọn Dẹp File Thừa & Chuẩn Hóa Cấu Hình Repository

## 1. Bối Cảnh & Vấn Đề

Dự án HRMS đã hoàn thiện việc tích hợp Full-Stack (Spring Boot 3.3.4 + MySQL 8.0 + React 19 Dual-Mode). Tuy nhiên trong kho mã nguồn hiện còn tồn đọng một số tệp thừa phát sinh từ lúc khởi tạo dự án và quá trình biên soạn ban đầu:
1. **Assets mẫu từ template Vite:** `hero.png`, `react.svg`, `vite.svg` nằm trong `frontend/src/assets/` không được import hay render ở bất kỳ component nào.
2. **Lỗi liên kết Favicon 404:** Thẻ `<link rel="icon">` trong `frontend/index.html` đang trỏ `/vite.svg` (file này không tồn tại trong thư mục `public/`, thực tế có sẵn `favicon.svg`).
3. **Build Cache làm bẩn Git Status:** File `frontend/tsconfig.app.tsbuildinfo` sinh ra sau mỗi lần build TypeScript đang bị Git track, chưa được khai báo bỏ qua trong `.gitignore`.
4. **Tài liệu nháp tạm thời (Draft docs):** 3 file `docs/_progress.md`, `docs/_frontend_plan_progress.md`, `docs/_frontend_plan_review.md` là các bảng theo dõi nháp từ giai đoạn ban đầu (13/10), nay đã được chuẩn hóa và thay thế hoàn toàn bởi `docs/18-project-structure-and-modules-guide.md`.

---

## 2. Mục Tiêu Kế Hoạch

- **Loại bỏ 100% assets và files thừa:** Xóa sạch các file không có mục đích sử dụng.
- **Sạch sẽ Git Status:** Bỏ theo dõi `*.tsbuildinfo`, bổ sung vào `.gitignore` ở cả thư mục gốc và `frontend/`.
- **Khắc phục lỗi 404 Favicon:** Đảm bảo tải trang trên trình duyệt không còn lỗi console tìm kiếm `/vite.svg`.
- **Bảo toàn nguyên vẹn (Zero-Regression):**
  - Giữ nguyên 100% mock data trong `frontend/src/data/mock/`.
  - Giữ nguyên 100% các file kế hoạch kiểm toán trong `plans/`.
  - Giữ nguyên 100% 19 tài liệu chính thức trong `docs/`.
  - `npm run build` đạt 0 lỗi TypeScript; `npm run test` vượt qua 35/35 frontend tests.

---

## 3. Các Giai Đoạn Thực Hiện

| Giai đoạn | Tên Giai Đoạn & Nội Dung Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Dọn Dẹp Assets & Chuẩn Hóa Cấu Hình Frontend](./phase-01-cleanup-unused-assets-and-config.md) | Completed ✅ | 20m | Xóa 3 assets thừa, sửa favicon index.html, cấu hình .gitignore bỏ qua *.tsbuildinfo |
| **Phase 2** | [Dọn Dẹp Tài Liệu Nháp Tạm Thời Trong docs/](./phase-02-cleanup-draft-docs.md) | Completed ✅ | 15m | Xóa 3 file _progress.md, _frontend_plan_progress.md, _frontend_plan_review.md |
| **Phase 3** | [Kiểm Thử Toàn Diện & Nghiệm Thu Không Lỗi](./phase-03-validation-and-zero-regression.md) | Completed ✅ | 25m | Chạy kiểm thử tự động, build bundle, kiểm tra git status sạch |

---

## 4. Danh Sách Tệp Tác Động

```text
XÓA (Delete):
- frontend/src/assets/hero.png
- frontend/src/assets/react.svg
- frontend/src/assets/vite.svg
- docs/_progress.md
- docs/_frontend_plan_progress.md
- docs/_frontend_plan_review.md

SỬA ĐỔI (Modify):
- frontend/index.html (sửa favicon path sang /favicon.svg)
- frontend/.gitignore (thêm *.tsbuildinfo)
- .gitignore (thêm *.tsbuildinfo)
- frontend/tsconfig.app.tsbuildinfo (git rm --cached)
```
