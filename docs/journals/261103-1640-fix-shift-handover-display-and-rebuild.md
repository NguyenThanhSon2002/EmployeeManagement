# Journal: Fix Shift Handover Display & Backend Rebuild

- **Thời gian:** 2026-11-03 16:40
- **Nhánh:** `dev`
- **Chủ đề:** Khắc phục triệt để vấn đề hiển thị nhân sự nhường ca và lý do giải trình trên ô ca tuần.

## 1. Vấn Đề Gốc Được Phát Hiện
- Người dùng phản ánh qua ảnh chụp màn hình ô ca Thứ Ba/Thứ Tư: Nhân sự nhận thay (Nguyễn Xuân Tài) hiển thị kèm tooltip ghi lý do của người nhường ("Có việc gia đình đột xuất") dưới tên Nguyễn Xuân Tài, trong khi người nhường ca ban đầu (Nguyễn Tử Duy Anh) hoàn toàn không xuất hiện và không có thanh thu gọn `▾ 1 NV đã nhường ca`.
- **Nguyên nhân cốt lõi:**
  1. Container `hrms-backend` chạy image cũ từ trước khi tạo file Flyway migration `V24__add_transferred_from_employee_id_to_shift_assignments.sql`, dẫn đến bảng `shift_assignments` trên database MariaDB host chưa có cột `transferred_from_employee_id`.
  2. API `weekly` trả về `transferred_from_employee_id = null`, khiến client lọc ra danh sách rỗng và không hiển thị thanh thu gọn.
  3. Tooltip trên chip của người nhận ca hiển thị trực tiếp `overrideReason` là văn bản nhường ca, gây hiểu lầm rằng người nhận ca là người có việc gia đình đột xuất.
  4. Thiếu logic bảo vệ tính bất biến (immutability) ở backend cho các ca nhường, và nhầm lẫn gán `transferredFromEmployeeId` cả cho đổi ca 2 chiều (SWAP).

## 2. Các Thay Đổi & Giải Pháp Đã Thực Hiện
1. **Backend Database & Docker Rebuild:**
   - Rebuild image `hrms-backend` và khởi động lại container. Flyway đã áp dụng thành công migration `V24`.
   - Thực thi câu lệnh SQL backfill cập nhật `transferred_from_employee_id` từ `shift_swap_requests` kiểu `HANDOVER` đã được phê duyệt.
   - Sửa `ShiftSwapService.java`: Chỉ gán `transferredFromEmployeeId` cho `HANDOVER`, không gán cho đổi ca 2 chiều `SWAP`.
   - Bổ sung kiểm tra bất biến trong `ScheduleAssignmentService.java`: Chặn chỉnh sửa giải trình của ca đã chuyển nhượng qua API.

2. **Frontend UI & Attribution Refinement (`ShiftGridCell.tsx` & `OverrideReasonModal.tsx`):**
   - Xây dựng helper `getAssignmentHandoverInfo`: Trích xuất sạch thông tin người nhường, mã đơn và lý do giải trình thực sự, hỗ trợ fallback regex cho dữ liệu lịch sử.
   - Trên chip người nhận ca:
     - Hiển thị huy hiệu `Nhận thay` kèm icon `<ArrowLeftRight size={9} />`.
     - Tooltip hiển thị: `Nhận nhường ca từ: [Tên người nhường] ([Mã])`.
     - Ẩn biểu tượng giải trình `FileText` trên chip người nhận để loại bỏ hoàn toàn sự hiểu lầm.
   - Dòng thu gọn ở cuối ô ca:
     - Mặc định đóng: `▾ [N] NV đã nhường ca` (không làm vỡ bố cục lưới).
     - Khi mở rộng: Hiển thị chip mờ gạch ngang tên `~~[Tên người nhường]~~` kèm nhãn đỏ `Đã nhường`.
     - Tooltip của chip người nhường hiển thị: `↩ Đã nhường ca này cho [Tên người nhận]` và `Lý do giải trình: [Nội dung người nhường nhập]`.
   - `OverrideReasonModal.tsx`: Khóa chỉnh sửa và hiển thị banner thông báo ca được chuyển nhượng từ nhân sự ban đầu.

3. **Xác Minh & Build Container:**
   - `tsc -b && vite build`: Thành công 0 lỗi.
   - `oxlint`: 0 lỗi.
   - `mvn test`: 21/21 tests passed.
   - Rebuild hoàn toàn container `hrms-backend` và `hrms-frontend` (`--no-cache`), phục vụ trên port 8081 và 8082.
