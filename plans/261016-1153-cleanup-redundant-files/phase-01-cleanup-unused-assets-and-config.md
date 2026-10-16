# Phase 1: Dọn Dẹp Assets & Chuẩn Hóa Cấu Hình Frontend

**Thời lượng ước tính:** 20 phút  
**Trạng thái:** Completed ✅  

---

## 1. Mục Tiêu

1. Xóa bỏ 3 file tài nguyên mẫu thừa trong `frontend/src/assets/`.
2. Sửa đường dẫn icon trong `frontend/index.html` trỏ về file `/favicon.svg` hợp lệ trong `public/`.
3. Bổ sung `*.tsbuildinfo` vào `.gitignore` (thư mục gốc và `frontend/`).
4. Bỏ git tracking cho file `frontend/tsconfig.app.tsbuildinfo`.

---

## 2. Chi Tiết Thực Hiện

### Nhiệm Vụ 1.1: Xóa Assets Không Dùng
- Xóa `frontend/src/assets/hero.png`
- Xóa `frontend/src/assets/react.svg`
- Xóa `frontend/src/assets/vite.svg`

### Nhiệm Vụ 1.2: Chuẩn Hóa Favicon trong `index.html`
- Mở `frontend/index.html`:
  - Tìm: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`
  - Đổi thành: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

### Nhiệm Vụ 1.3: Cập Nhật `.gitignore` & Bỏ Track `tsbuildinfo`
- Cập nhật `.gitignore` (gốc): Thêm `*.tsbuildinfo` vào mục Frontend.
- Cập nhật `frontend/.gitignore`: Thêm `*.tsbuildinfo`.
- Chạy lệnh:
  ```powershell
  git rm --cached frontend/tsconfig.app.tsbuildinfo
  ```

---

## 3. Tiêu Chí Hoàn Thành (DoD)

- [ ] 3 file trong `frontend/src/assets/` đã được xóa sạch.
- [ ] `frontend/index.html` trỏ tới `/favicon.svg`.
- [ ] `*.tsbuildinfo` xuất hiện trong cả 2 file `.gitignore`.
- [ ] `git status` không còn track `frontend/tsconfig.app.tsbuildinfo`.
