# Journal: Hoàn Tất Rà Soát Mã Nguồn & Chuẩn Hóa Dữ Liệu Thực Tế

- **Thời gian**: 2026-11-12 10:00 (GMT+7)
- **Kế hoạch triển khai**: [`plans/261112-0925-codebase-audit-and-data-realism/plan.md`](file:///D:/Project/Employee%20Management/plans/261112-0925-codebase-audit-and-data-realism/plan.md)
- **Báo cáo phân tích**: [`plans/reports/261112-0925-codebase-audit-and-data-realism-report.md`](file:///D:/Project/Employee%20Management/plans/reports/261112-0925-codebase-audit-and-data-realism-report.md)
- **Trạng thái**: Hoàn thành 100% (Completed & Verified)

---

## 1. Tóm Tắt Kết Quả Triển Khai

Cả 3 giai đoạn của kế hoạch đã được thực thi và kiểm thử nghiêm ngặt, đảm bảo toàn bộ mã nguồn hoạt động trên dữ liệu thực tế và không còn dữ liệu mock/hardcode:

### Phase 1: Sửa lỗi Test Backend & Xóa bỏ dữ liệu Mock / Hardcode
1. **Backend Unit Test**:
   - Khắc phục lỗi `ScheduleAssignmentServiceTest.testClaimShift_ShiftFull` bằng cách mock `findByIdForUpdate(10L)` tương ứng với phương thức bảo vệ concurrency conflict của JPA.
   - Kết quả: `mvn test` pass **35/35 tests (0 failure, 0 error)**.
2. **Mã Nhân Viên Tự Động**:
   - Loại bỏ `Math.random()` trong `useEmployeeForm.ts`. Khi thêm mới nhân viên để trống mã, backend tự động sinh mã tuần tự tiếp theo (`generateNextEmployeeCode()`) như `EMP-022`, `EMP-023`.
   - Cập nhật hướng dẫn trực quan trong `EmployeeBasicInfoFields.tsx`.
3. **Email Nhân Viên**:
   - Loại bỏ fallback `@example.com` trong `useScheduleStore.ts`, chuyển sang ưu tiên lấy email hồ sơ hoặc định dạng `@company.com`.
4. **Tỷ Lệ Hợp Đồng Có Hiệu Lực**:
   - Trong `DashboardServiceImpl.java`, thay thế giá trị cứng `100.0` bằng câu lệnh đếm thực tế số nhân viên có hợp đồng `is_active = true` từ `salary_contracts` chia cho tổng số nhân sự đang làm việc.

### Phase 2: Đồng Bộ Dashboard & Chấm Công Thực Tế
1. **Tự Động Nạp Dữ Liệu**:
   - Bổ sung `fetchRecords()` và `fetchWeeklySchedule()` vào `DashboardPage.tsx` khi người dùng đăng nhập vào Dashboard, đảm bảo thẻ Chấm công nhanh và lịch làm việc không bị rỗng.
2. **Chấm Công Nhanh & Thời Gian Làm Việc Thực**:
   - Trong `QuickAttendanceCard.tsx`, loại bỏ hoàn toàn mock cứng `2h15m`.
   - Tính toán `elapsedSeconds` chính xác dựa trên độ lệch giữa `new Date()` và `todayRecord.checkInTime`.
   - Hiển thị đúng ca trực hôm nay từ danh sách phân ca (`assignments`), phân biệt trạng thái vào đúng giờ hay đi muộn (`lateMinutes`).

### Phase 3: Chuẩn Hóa Công Thức Xu Hướng Chuyên Cần & Báo Cáo
1. **Tỷ Lệ Vắng Mặt Trên Dashboard 7 Ngày**:
   - Sửa logic tính toán trong `DashboardServiceImpl.getAttendanceTrends`: Chỉ tính tỷ lệ vắng mặt trên tập nhân viên **thực sự được xếp ca trong ngày** (`scheduledCount > 0`). Nếu là ngày nghỉ toàn cơ sở hoặc không có ca trực nào được xếp, tỷ lệ vắng mặt là 0%.
2. **Kế Hoạch vs Thực Tế (`ScheduledVsActualTable.tsx`)**:
   - Bổ sung tính toán `total_scheduled_hours` từ các ca làm việc (`ShiftAssignment`) theo từng nhân viên trong kỳ tại `ReportService.java`.
   - Thêm bộ chọn Tháng/Năm trên giao diện và tải trực tiếp từ `reportService.getAttendanceSummary()`, đối chiếu chính xác giữa giờ kế hoạch và giờ làm việc thực tế.
3. **Báo Cáo Vi Phạm Đi Muộn / Về Sớm (`LateEarlyReport.tsx`)**:
   - Bổ sung KPI Cards thống kê tổng số lượt vi phạm trong kỳ.
   - Hiển thị danh sách vi phạm thực tế theo Tháng/Năm, mức cảnh báo tuân thủ (Tốt, Nhắc nhở, Kỷ luật), hỗ trợ lọc chỉ xem nhân sự có vi phạm và xuất CSV theo kỳ chuẩn xác.

---

## 2. Kết Quả Kiểm Thử (Verification)

- **Backend**: `mvn test` hoàn thành 35/35 tests, BUILD SUCCESS.
- **Frontend**: `npm run build` hoàn thành với `tsc -b && vite build`, 0 lỗi, bundle thành công.
- **Tính toán nghiệp vụ**: Bảo lưu nguyên tắc Net = Gross theo thỏa thuận lương ban đầu; tỷ lệ chuyên cần và giờ công ca phản ánh 100% dữ liệu thực tế từ cơ sở dữ liệu.
