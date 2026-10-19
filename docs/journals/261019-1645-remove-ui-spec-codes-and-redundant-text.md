# Nhật Ký Kỹ Thuật: Hoàn Thành Brainstorming & Lập Kế Hoạch Làm Sạch Mã Đặc Tả (SCR/BR) & Thuật Ngữ Kỹ Thuật

- **Thời gian:** 19/10/2026 - 16:45
- **Tác giả:** Solution Brainstormer & Planner Agent
- **Kế hoạch liên quan:** [plans/261019-1645-remove-ui-spec-codes-and-redundant-text/plan.md](../../plans/261019-1645-remove-ui-spec-codes-and-redundant-text/plan.md)
- **Báo cáo phân tích:** [plans/reports/261019-1645-remove-ui-spec-codes-and-redundant-text.md](../../plans/reports/261019-1645-remove-ui-spec-codes-and-redundant-text.md)

---

## 1. Bối Cảnh & Vấn Đề
Sau khi tối ưu hóa thành công việc ẩn nhân viên đã nghỉ việc và dọn dẹp các mã định danh chi nhánh/mẫu ca, người dùng tiếp tục yêu cầu kiểm tra toàn bộ 11 màn hình của hệ thống để loại bỏ triệt để các thông tin kỹ thuật, mã thừa phục vụ lập trình viên.
Người dùng cung cấp 2 ảnh chụp thực tế:
- Ảnh 1 (`pasted-image-21732.png`): Chữ `(DRAFT)` trong huy hiệu `• BẢN NHÁP (DRAFT)` trên thanh công cụ Lịch tuần.
- Ảnh 2 (`pasted-image-14500.png`): Khối chân trang Sidebar hiển thị `EMS Suite v2.0 / WCAG 2.1 AA Compliant` và chấm xanh.

## 2. Phát Hiện & Quyết Định Kỹ Thuật
1. **Mã Đặc Tả (SCR-XX / BR-XXX):** Được copy từ tài liệu SRS trong quá trình dựng ban đầu, xuất hiện tại 9 tiêu đề trang/modal (`SCR-08`, `SCR-09`, `SCR-10`, `SCR-11`, `SCR-13`, `SCR-14`, `SCR-15`), thông báo lỗi trùng phép (`BR-009`) và cài đặt phân ca (`BR-001` đến `BR-007`). Cần loại bỏ hoàn toàn.
2. **Nút Reset Demo Trên Toolbar:** Nút `<RotateCcw />` khôi phục dữ liệu mẫu nằm ngay cạnh nút "Công bố lịch", dễ gây rủi ro mất mát dữ liệu do người dùng bấm nhầm. Quyết định: gỡ bỏ khỏi toolbar chính.
3. **Thuật Ngữ Kỹ Thuật & Mã Hóa:** Cụm từ `CSDL MySQL`, `(UTF-8 BOM)`, `Chuẩn WCAG AA`, `(Conflict Engine)` và `Mặc định theo đề bài (Prompt standard)` sẽ được thay thế bằng văn bản nghiệp vụ doanh nghiệp thân thiện và chuyên nghiệp.

## 3. Kết Quả Thực Thi & Kiểm Thử
- **Phase 1:** Đã sửa huy hiệu `BẢN NHÁP (DRAFT)` thành `BẢN NHÁP`, gỡ nút Reset Demo nguy hiểm khỏi thanh công cụ Lịch, và xóa sạch toàn bộ mã `SCR-XX` và `BR-XXX` khỏi tiêu đề trang, modal và thông báo lỗi.
- **Phase 2:** Đã gỡ bỏ khối chân trang Sidebar `EMS Suite v2.0 / WCAG 2.1 AA Compliant`, làm sạch các nhãn nút `(UTF-8 BOM)`, xóa bỏ từ `CSDL MySQL` khỏi Toast/Modal, và chuẩn hóa trang Cài đặt (bỏ `Prompt standard`, `Conflict Engine`).
- **Phase 3:** 
  - `npm run build` (tsc -b && vite build) hoàn tất thành công (exit code 0).
  - `npm run lint` đạt 0 lỗi (0 errors).
  - Backend Maven test-compile đạt `BUILD SUCCESS`.
  - Toàn bộ giao diện 11 màn hình sạch sẽ, không còn văn bản thừa hay thông tin dev.
