# Nhật Ký Kỹ Thuật: Brainstorm Phát Triển Phân Hệ Tính Lương Tự Động & Đánh Giá Hiệu Suất KPI

- **Thời gian:** 09/11/2026 10:04:00
- **Tác vụ:** Đề xuất và thống nhất kế hoạch phát triển chức năng mới kết hợp: Tính lương tự động (Payroll) và Đánh giá hiệu suất KPI/Khen thưởng.
- **Tài liệu phân tích:** `plans/reports/261109-1003-payroll-and-kpi-system-report.md`

## 1. Tóm Tắt Định Hướng Phát Triển
- **Sự kết hợp chiến lược:** Tận dụng dữ liệu chấm công thực tế, bóc tách giờ ca đêm (22:00 - 06:00), đơn nghỉ phép có lương/không lương và tỷ lệ chuyên cần để chuyển hóa trực tiếp thành Bảng lương tháng minh bạch và Thưởng KPI hiệu suất.
- **Lộ trình 2 giai đoạn:**
  - **Giai đoạn 1 (Core Payroll & Chuyên cần):** Hợp đồng lương (Full-time theo tháng, Part-time theo giờ công), Động cơ tính lương tự động, phụ cấp ca đêm (+30%), thưởng chuyên cần tự động, khấu trừ đi muộn, BHXH/BHYT/BHTN, thuế TNCN, duyệt chốt bảng lương và Phiếu lương điện tử (Payslip).
  - **Giai đoạn 2 (Đánh giá KPI & Vinh danh):** Tiêu chí đánh giá định lượng/định tính, form đánh giá của Quản lý chi nhánh, xếp loại A/B/C/D quy đổi thưởng KPI vào bảng lương, bảng xếp hạng Top nhân sự xuất sắc của tháng.

## 2. Bước Kế Tiếp
- Kích hoạt `/xd:plan` để tạo kế hoạch triển khai chi tiết cho Giai đoạn 1 (Core Payroll & Thưởng Chuyên cần).
