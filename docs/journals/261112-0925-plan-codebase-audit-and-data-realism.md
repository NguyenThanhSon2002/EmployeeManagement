# Journal: Kế Hoạch Chuẩn Hóa Dữ Liệu Thực Tế & Khắc Phục Lỗi Mã Nguồn

- **Thời gian**: 2026-11-12 09:25 (GMT+7)
- **Kế hoạch triển khai**: [`plans/261112-0925-codebase-audit-and-data-realism/plan.md`](file:///D:/Project/Employee%20Management/plans/261112-0925-codebase-audit-and-data-realism/plan.md)
- **Báo cáo phân tích**: [`plans/reports/261112-0925-codebase-audit-and-data-realism-report.md`](file:///D:/Project/Employee%20Management/plans/reports/261112-0925-codebase-audit-and-data-realism-report.md)
- **Trạng thái**: Sẵn sàng triển khai (Ready for Cook)

---

## 1. Tóm Tắt Nhiệm Vụ & Phân Tích

Rà soát toàn bộ source code backend và frontend để phát hiện các lỗi mã nguồn, các điểm tính toán chưa đúng và các vùng dữ liệu giả lập (mock/hardcode). Thống nhất kế hoạch giải quyết triệt để theo 3 giai đoạn:
1. **Giai đoạn 1**: Sửa lỗi mock trong `ScheduleAssignmentServiceTest` để test suite backend đạt 100% pass; loại bỏ mã nhân viên ngẫu nhiên trong form tạo nhân sự; xóa email giả lập `@example.com`; tính tỷ lệ hợp đồng hiệu lực từ bảng `salary_contracts`.
2. **Giai đoạn 2**: Đồng bộ nạp dữ liệu lịch phân ca và chấm công khi vào trang Dashboard; tính chính xác số giây làm việc từ thời điểm check-in thật; hiển thị đúng tên ca phân công thực tế hôm nay của nhân viên.
3. **Giai đoạn 3**: Chuẩn hóa công thức tỷ lệ vắng mặt trên Dashboard 7 ngày (chỉ tính vắng khi nhân viên được xếp ca); nạp dữ liệu kỳ báo cáo thực tế từ backend cho hai bảng đối chiếu Kế hoạch vs Thực tế và Báo cáo Vi phạm.

---

## 2. Kế Hoạch 3 Giai Đoạn Đã Tạo

- **Phase 01**: [`plans/261112-0925-codebase-audit-and-data-realism/phase-01-fix-test-and-remove-mock-data.md`](file:///D:/Project/Employee%20Management/plans/261112-0925-codebase-audit-and-data-realism/phase-01-fix-test-and-remove-mock-data.md)
- **Phase 02**: [`plans/261112-0925-codebase-audit-and-data-realism/phase-02-sync-dashboard-and-realtime-attendance.md`](file:///D:/Project/Employee%20Management/plans/261112-0925-codebase-audit-and-data-realism/phase-02-sync-dashboard-and-realtime-attendance.md)
- **Phase 03**: [`plans/261112-0925-codebase-audit-and-data-realism/phase-03-standardize-reports-and-attendance-trends.md`](file:///D:/Project/Employee%20Management/plans/261112-0925-codebase-audit-and-data-realism/phase-03-standardize-reports-and-attendance-trends.md)

Lệnh thực thi tiếp theo:
`/aikit-core:xd:cook plans/261112-0925-codebase-audit-and-data-realism/plan.md`
