# TÀI LIỆU 07: QUY TẮC NGHIỆP VỤ PHÂN CA, CHẤM CÔNG VÀ KIỂM SOÁT XUNG ĐỘT (BUSINESS RULES)
**Dự án:** Employee Management System  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. NGUYÊN TẮC THIẾT KẾ QUY TẮC NGHIỆP VỤ (CORE PRINCIPLES)

Toàn bộ các quy tắc phân ca, chấm công và nghỉ phép trong hệ thống được phân loại thành hai cấp độ kiểm soát chặt chẽ:

1. **LỖI BẮT BUỘC (MANDATORY ERROR - Chặn tuyệt đối):**
   - Vi phạm tính toàn vẹn vật lý và logic toán học của thời gian (ví dụ: một người không thể ở hai nơi cùng lúc trong cùng một khung giờ).
   - Vi phạm tính pháp lý cốt lõi của hợp đồng (ví dụ: gán ca cho người đã nghỉ việc hoặc tài khoản đã bị khóa).
   - **Hành vi hệ thống:** Backend từ chối giao dịch (ném ngoại lệ nghiệp vụ, mã lỗi HTTP `422 Unprocessable Entity`), cơ sở dữ liệu rollback toàn bộ. Không một vai trò nào (kể cả Administrator) được phép ghi đè (override).

2. **CẢNH BÁO CHÍNH SÁCH (POLICY WARNING - Cho phép Ghi đè có giải trình):**
   - Vi phạm các giới hạn chính sách nhân sự hoặc khuyến nghị lao động (ví dụ: làm quá 48 giờ/tuần, khoảng cách giữa 2 ca dưới 12 giờ, ca làm việc chưa đạt định biên tối thiểu, ca rơi vào ngày lễ).
   - **Hành vi hệ thống:** Backend trả về danh sách cảnh báo (`warnings: [...]`). Hệ thống trên giao diện hiển thị hộp thoại cảnh báo vi phạm kèm ô bắt buộc nhập **Lý do giải trình đặc cách (Override Reason)**.
   - Khi người dùng gửi lại yêu cầu kèm `override_reason` hợp lệ (tối thiểu 10 ký tự), hệ thống cho phép lưu, đồng thời ghi lại bản ghi kiểm toán đầy đủ: Ai ghi đè, vào lúc nào, quy tắc vi phạm là gì, lý do giải trình.

---

## 2. DANH MỤC QUY TẮC NGHIỆP VỤ CHI TIẾT (BUSINESS RULES CATALOG)

### BR-001: Trùng ca làm việc của một nhân viên (Shift Time Overlap)
- **Phân loại:** **MANDATORY (Lỗi bắt buộc - Chặn tuyệt đối)**
- **Mã lỗi API:** `ERR_SHIFT_OVERLAP`
- **Mô tả nghiệp vụ:** Một nhân viên không thể có hai ca làm việc có khoảng thời gian giao nhau (dù chỉ 1 phút) trong cùng một ngày hoặc giữa hai ngày kế tiếp (do ca làm việc qua đêm kéo dài sang ngày hôm sau).
- **Thuật toán kiểm tra:**
  - Gọi khoảng thời gian ca mới là $[S_{new}, E_{new}]$ và ca đã tồn tại là $[S_{exist}, E_{exist}]$ (với $S, E$ được chuẩn hóa thành mốc thời gian tuyệt đối `UTC Timestamp`).
  - Điều kiện xung đột toán học:
    $$\max(S_{new}, S_{exist}) < \min(E_{new}, E_{exist})$$
  - Nếu bất kỳ ca nào của nhân viên thỏa mãn điều kiện trên $\rightarrow$ Xung đột.
- **Ví dụ vi phạm:**
  - Nhân viên A có Ca 1 từ 08:00 đến 16:00 ngày 15/10/2026. Quản lý gán thêm Ca 2 từ 15:00 đến 23:00 ngày 15/10/2026 $\rightarrow$ Xung đột trong khoảng 15:00 - 16:00.
  - Nhân viên B có Ca Đêm từ 22:00 ngày 15/10 đến 06:00 ngày 16/10. Quản lý gán Ca Sáng từ 05:00 đến 13:00 ngày 16/10 $\rightarrow$ Xung đột trong khoảng 05:00 - 06:00 ngày 16/10.
- **Hành vi hệ thống:** Chặn lưu, thông báo: *"Không thể xếp ca: Nhân viên [Tên] đã có ca [Tên ca cũ] ([Giờ bắt đầu] - [Giờ kết thúc]) trùng khung giờ với ca này."*

---

### BR-002: Trạng thái nhân viên không hợp lệ để phân ca (Invalid Employee Status)
- **Phân loại:** **MANDATORY (Lỗi bắt buộc - Chặn tuyệt đối)**
- **Mã lỗi API:** `ERR_INVALID_EMPLOYEE_STATUS`
- **Mô tả nghiệp vụ:** Không được phép xếp ca làm việc cho nhân viên không còn hoạt động hoặc đang trong trạng thái tạm ngừng công tác dài hạn.
- **Điều kiện vi phạm:**
  - Nhân viên có `status = 'RESIGNED'` (Đã thôi việc).
  - Nhân viên có `is_active = FALSE` hoặc `deleted_at IS NOT NULL` (Đã bị vô hiệu hóa/xóa mềm).
  - Ngày phân ca $D_{work} < \text{hire\_date}$ (Xếp ca trước ngày chính thức vào làm).
  - Nhân viên đang trong kỳ nghỉ dài hạn chính thức (`status = 'ON_LEAVE'`, ví dụ: Nghỉ thai sản 6 tháng đã kích hoạt).
- **Hành vi hệ thống:** Chặn thao tác, thông báo: *"Không thể gán ca cho nhân viên [Tên] vì hồ sơ ở trạng thái không hoạt động hoặc chưa đến ngày vào làm."*

---

### BR-003: Phân ca trùng ngày nghỉ phép đã phê duyệt (Approved Leave Conflict)
- **Phân loại:** **CẤU HÌNH ĐƯỢC (Mặc định: WARNING - Cho phép Ghi đè; có thể nâng lên MANDATORY theo policy)**
- **Mã cảnh báo API:** `WARN_LEAVE_CONFLICT`
- **Mô tả nghiệp vụ:** Khi xếp ca vào ngày mà nhân viên đã có Đơn xin nghỉ phép ở trạng thái `APPROVED`.
- **Lý do cho phép Warning:** Trong môi trường vận hành thực tế tại Việt Nam, đôi khi nhân viên đã nộp đơn nghỉ phép nhưng do sự cố đột xuất hoặc thỏa thuận tự nguyện đi làm lại, quản lý vẫn cần điều động nhân sự vào ca.
- **Hành vi hệ thống:** 
  - Nếu `LEAVE_CONFLICT_SEVERITY = 'WARNING'`: Hiển thị cảnh báo: *"Nhân viên [Tên] đã được phê duyệt nghỉ [Loại phép] vào ngày [Ngày]. Bạn có chắc chắn muốn điều động nhân viên đi làm không?"*. Nếu tiếp tục, bắt buộc nhập lý do điều động.
  - Nếu `LEAVE_CONFLICT_SEVERITY = 'MANDATORY'`: Chặn hoàn toàn, bắt buộc nhân viên hoặc HR phải hủy đơn phép trước khi xếp ca.

---

### BR-004: Vượt giới hạn giờ làm việc trong tuần (Max Weekly Working Hours Breach)
- **Phân loại:** **WARNING (Cảnh báo chính sách)**
- **Mã cảnh báo API:** `WARN_WEEKLY_HOURS_EXCEEDED`
- **Mô tả nghiệp vụ:** Tổng số giờ làm việc theo kế hoạch (Scheduled Hours) của nhân viên trong một tuần (từ Thứ Hai 00:00 đến Chủ Nhật 23:59) vượt quá giới hạn cấu hình trong `system_settings` (`MAX_WEEKLY_REGULAR_HOURS`, mặc định 48 giờ/tuần theo Điều 105 BLLĐ 2019).
- **Công thức tính toán:**
  $$\text{TotalWeeklyHours} = \sum_{i=1}^{n} \text{ScheduledHours}(Ca_i) > 48.0$$
- **Hành vi hệ thống:** Gắn badge cảnh báo màu vàng tại tên nhân viên trên Bảng lịch tuần. Tooltip: *"Tổng giờ làm trong tuần là 52.0 giờ (vượt giới hạn quy định 48.0 giờ/tuần)"*. Cho phép công bố lịch sau khi quản lý xác nhận lý do đặc cách tăng ca.

---

### BR-005: Vượt giới hạn giờ làm việc trong ngày (Max Daily Working Hours Breach)
- **Phân loại:** **WARNING (Cảnh báo chính sách)**
- **Mã cảnh báo API:** `WARN_DAILY_HOURS_EXCEEDED`
- **Mô tả nghiệp vụ:** Tổng số giờ làm việc theo kế hoạch của một nhân viên trong cùng một ngày làm việc vượt quá giới hạn quy định (`MAX_DAILY_HOURS`, mặc định 8 giờ đối với ca thường, hoặc 12 giờ nếu làm thêm giờ theo Điều 107 BLLĐ 2019).
- **Hành vi hệ thống:** Hiển thị cảnh báo màu vàng trên ô ngày của nhân viên. Yêu cầu giải trình nếu vượt quá 12 giờ/ngày (mức trần tối đa theo luật lao động).

---

### BR-006: Vi phạm thời gian nghỉ ngơi tối thiểu giữa 2 ca liên tiếp (Insufficient Rest Between Shifts)
- **Phân loại:** **WARNING (Cảnh báo chính sách)**
- **Mã cảnh báo API:** `WARN_INSUFFICIENT_REST_TIME`
- **Mô tả nghiệp vụ:** Khoảng cách thời gian nghỉ ngơi từ lúc kết thúc ca làm việc trước ($E_{prev}$) đến lúc bắt đầu ca làm việc tiếp theo ($S_{next}$) nhỏ hơn thời gian nghỉ tối thiểu quy định trong `system_settings` (`MIN_REST_BETWEEN_SHIFTS_HOURS`, mặc định **12 giờ** theo Điều 110 BLLĐ 2019).
- **Công thức:**
  $$\Delta T_{rest} = S_{next} - E_{prev} < 12.0 \text{ hours}$$
- **Ví dụ điển hình:**
  - Ca 1: Ca Chiều kết thúc lúc 22:00 ngày Thứ Hai.
  - Ca 2: Ca Sáng bắt đầu lúc 06:00 ngày Thứ Ba.
  - Khoảng nghỉ thực tế: $06:00 - 22:00 = 8 \text{ giờ} < 12 \text{ giờ}$.
- **Hành vi hệ thống:** Hiển thị cờ cảnh báo sức khỏe người lao động: *"Thời gian nghỉ giữa 2 ca chỉ có 8 giờ (thiếu 4 giờ so với quy định 12 giờ)"*. Quản lý phải xác nhận đây là ca trực hoán đổi khẩn cấp và nhân viên đã đồng thuận.

---

### BR-007: Xếp ca vào Ngày nghỉ lễ hoặc Ngày nghỉ hàng tuần (Holiday / Rest Day Assignment)
- **Phân loại:** **WARNING (Cảnh báo chính sách)**
- **Mã cảnh báo API:** `WARN_HOLIDAY_ASSIGNMENT`
- **Mô tả nghiệp vụ:** Xếp ca làm việc vào ngày được định nghĩa là Ngày lễ quốc gia (`company_holidays`), ngày nghỉ lễ công ty, hoặc ngày mà nhân viên có quyền nghỉ hàng tuần (đảm bảo ít nhất 24 giờ nghỉ liên tục trong tuần theo Điều 111 BLLĐ 2019).
- **Hành vi hệ thống:** 
  - Ô lịch đổi màu viền sang màu cam ngày lễ.
  - Cảnh báo: *"Ngày này là ngày nghỉ lễ [Tên ngày lễ]. Ca làm việc này sẽ được tính hệ số lương làm thêm ngày lễ (nếu có chấm công)"*.
  - Yêu cầu xác nhận phê duyệt đi làm ngày lễ.

---

### BR-008: Vi phạm định biên nhân sự tối thiểu / tối đa của ca (Staffing Capacity Breach)
- **Phân loại:** **WARNING (Cảnh báo chính sách)**
- **Mã cảnh báo API:** `WARN_STAFFING_CAPACITY`
- **Mô tả nghiệp vụ:** Trong một ca làm việc tại một phòng ban cụ thể vào một ngày cụ thể, số lượng nhân viên được phân công ($N_{assigned}$) nằm ngoài khoảng định biên $[MinStaffing, MaxStaffing]$ đã cấu hình trong mẫu ca.
- **Hành vi hệ thống:**
  - Nếu $N_{assigned} < MinStaffing$: Cảnh báo thiếu nhân sự vận hành (Understaffed), có nguy cơ gián đoạn dịch vụ/sản xuất.
  - Nếu $N_{assigned} > MaxStaffing$: Cảnh báo thừa nhân sự so với nhu cầu ca (Overstaffed), lãng phí định biên.
  - Không chặn lưu, hiển thị số đếm định biên trên tiêu đề cột ca của ngày đó (ví dụ: `2/4 nhân sự - Thiếu người`).

---

### BR-009: Trùng lặp đơn xin nghỉ phép (Overlapping Leave Requests)
- **Phân loại:** **MANDATORY (Lỗi bắt buộc - Chặn tuyệt đối)**
- **Mã lỗi API:** `ERR_LEAVE_OVERLAP`
- **Mô tả nghiệp vụ:** Nhân viên không được phép gửi đơn xin nghỉ phép mới có khoảng ngày giao thoa với một đơn xin nghỉ phép khác của chính mình đang ở trạng thái `SUBMITTED` (chờ duyệt) hoặc `APPROVED` (đã duyệt).
- **Hành vi hệ thống:** Chặn tạo đơn tại client và ném lỗi validation tại backend: *"Bạn đã có đơn xin nghỉ phép từ ngày [Từ ngày] đến [Đến ngày] đang được xử lý hoặc đã duyệt."*

---

### BR-010: Quy tắc Chấm công Sớm và Muộn (Early Check-in & Late Thresholds)
- **Phân loại:** **CHÍNH SÁCH HỆ THỐNG (Policy Rule)**
- **Mô tả nghiệp vụ:**
  - **Check-in sớm (Early Check-in):** Nhân viên được phép bấm Check-in trước giờ bắt đầu ca tối đa 60 phút (`MAX_EARLY_CHECKIN_MINUTES = 60`). Thời gian có mặt sớm này mặc định **không được tự động tính vào giờ làm việc/giờ OT** trừ khi có phê duyệt làm thêm giờ riêng. Giờ tính công chỉ bắt đầu tính từ giờ ca quy định.
  - **Thời gian ân hạn đi muộn (Grace Period):** Được trễ tối đa 5 phút (`GRACE_PERIOD_MINUTES = 5`).
    - Check-in từ `Start_Time` đến `Start_Time + 5 phút`: Tính là Đúng giờ (`PRESENT`), `late_minutes = 0`.
    - Check-in từ `Start_Time + 6 phút` trở đi: Đánh dấu là Đi muộn (`LATE`), `late_minutes` được tính từ đúng `Start_Time`. Ví dụ: Ca 08:00, check-in 08:06 $\rightarrow$ Muộn 6 phút.
  - **Về sớm (Early Checkout):** Check-out trước giờ kết thúc ca bị đánh dấu là Về sớm (`EARLY_LEAVE`), trừ trường hợp có giấy công tác hoặc giải trình được duyệt.

---

### BR-011: Quy tắc Tính toán và Phân bổ Ca Qua Đêm (Overnight Shift Logic)
- **Phân loại:** **NGHIỆP VỤ CỐT LÕI (Core Domain Rule)**
- **Mô tả chi tiết:**
  - **Định nghĩa ca qua đêm:** Là ca có giờ kết thúc nhỏ hơn hoặc bằng giờ bắt đầu (về mặt đồng hồ trong ngày), ví dụ: `start_time = 22:00`, `end_time = 06:00`, cờ `is_cross_midnight = TRUE`.
  - **Thuộc tính Ngày Phân ca (Roster Container Attribution):** Ca qua đêm hoàn toàn **thuộc về ngày bắt đầu (Start Date)**. Ví dụ: Ca đêm bắt đầu lúc 22:00 ngày Thứ Hai 15/10 và kết thúc 06:00 ngày Thứ Ba 16/10 được quản lý xếp, tìm kiếm và hiển thị trên ô lịch của ngày **Thứ Hai 15/10**.
  - **Bản ghi chấm công:** Chỉ sinh **01 bản ghi chấm công duy nhất** gắn liền với ca làm việc ngày 15/10. Check-in lúc 21:55 ngày 15/10, Check-out lúc 06:05 ngày 16/10. Tổng giờ làm việc thực tế là 8 giờ.
  - **Tách giờ cho Báo cáo Ngày Hành chính (Hour Splitting across 00:00 Boundary):** Khi xuất báo cáo thống kê chính xác số giờ làm việc theo ngày dương lịch (để kiểm tra trần 8h/ngày):
    - Ngày 15/10: 2 giờ (22:00 đến 24:00).
    - Ngày 16/10: 6 giờ (00:00 đến 06:00).
  - **Giờ làm việc ban đêm (Night Hours):** Toàn bộ 8 giờ làm việc từ 22:00 đến 06:00 rơi trọn vào khung giờ đêm theo Điều 106 BLLĐ 2019, do đó `night_hours = 8.0` giờ (được gắn cờ tính phụ cấp làm đêm theo luật).

---

### BR-012: Xử lý Thời gian Nghỉ Giữa Ca (Break Time Deduction)
- **Phân loại:** **NGHIỆP VỤ TÍNH CÔNG (Hours Calculation Rule)**
- **Mô tả chi tiết:**
  - Trong mẫu ca có trường `break_minutes` (Thời gian nghỉ giữa ca, ví dụ: 60 phút nghỉ trưa).
  - Mặc định theo luật lao động: Thời gian nghỉ giữa ca không được tính vào thời giờ làm việc đối với ca làm việc thông thường không có tính chất độc hại đặc thù (nghỉ không hưởng lương).
  - **Số giờ làm việc theo kế hoạch:**
    $$\text{ScheduledHours} = \frac{\text{Duration}(StartTime, EndTime) - \text{BreakMinutes}}{60}$$
    *Ví dụ: Ca 08:00 - 17:00 (tổng 9 tiếng), nghỉ 60 phút $\rightarrow$ ScheduledHours = 8.0 giờ.*
  - **Số giờ làm việc thực tế:** Khi nhân viên check-in và check-out đủ ca, hệ thống tự động trừ đúng số phút nghỉ quy định của ca đó (`break_minutes`) trước khi ghi nhận vào `actual_hours`.

---

### BR-013: Tính Bất biến giữa Giờ Kế hoạch và Giờ Thực tế (Hours Separation & Immutability)
- **Phân loại:** **TOÀN VẸN DỮ LIỆU (Data Integrity Rule)**
- **Mô tả chi tiết:**
  - Dữ liệu Phân ca (`shift_assignments`) và Dữ liệu Chấm công (`attendance_records`) lưu trữ tại hai bảng vật lý độc lập.
  - Hệ thống **tuyệt đối không bao giờ ghi đè** `actual_hours` vào các trường của `shift_assignments`, và ngược lại.
  - Nhờ đó, báo cáo Chênh lệch Kế hoạch và Thực tế (Scheduled vs. Actual) luôn giữ được nguyên vẹn giá trị lịch sử để phân tích hiệu suất và quản trị độ tin cậy.

---

### BR-014: Chiến lược Snapshotting Mẫu Ca Làm Việc (Template Snapshotting)
- **Phân loại:** **TOÀN VẸN LỊCH SỬ (Audit Integrity Rule)**
- **Mô tả chi tiết:**
  - Khi một ca làm việc được gán cho nhân viên trong bảng `shift_assignments`, toàn bộ các thuộc tính tại thời điểm đó của mẫu ca (`shift_name`, `start_time`, `end_time`, `break_minutes`, `is_cross_midnight`) được sao chép nguyên trạng vào các cột snapshot tương ứng trong `shift_assignments`.
  - Nếu sau này Admin vào màn hình Cấu hình Mẫu ca (SCR-10) để sửa giờ ca hoặc xóa ca đó, các ca đã gán trong quá khứ hoặc trong tuần hiện tại **hoàn toàn không bị biến động sai lệch**.

---

### BR-015: Quản lý Thay đổi Lịch Đã Công bố (Published Schedule Modification Traceability)
- **Phân loại:** **KIỂM TOÁN VÀ THÔNG BÁO (Audit & Notification Rule)**
- **Mô tả chi tiết:**
  - Khi lịch làm việc tuần ở trạng thái `DRAFT`, người quản lý được tự do thêm/sửa/xóa mà không cần nhập lý do.
  - Khi lịch đã chuyển sang trạng thái `PUBLISHED`:
    - Bất kỳ thao tác hủy ca, đổi ca hoặc thêm ca mới đều kích hoạt Modal bắt buộc nhập **Lý do thay đổi (Change Reason)**.
    - Hệ thống lưu một bản ghi vào bảng `schedule_change_history` ghi nhận: Ai sửa, sửa lúc nào, giá trị cũ (ca cũ), giá trị mới (ca mới), lý do thay đổi.
    - Nhân viên bị đổi ca được đánh dấu cờ `needs_notification = TRUE` để nhận thông báo cảnh báo về việc đổi lịch làm việc.

---

### BR-016: Quy trình Kiểm toán Điều chỉnh Chấm công (Attendance Correction Audit)
- **Phân loại:** **KIỂM SOÁT NỘI BỘ (Internal Control Rule)**
- **Mô tả chi tiết:**
  - Nhân viên chỉ được gửi yêu cầu giải trình cho các ngày công trong tháng hiện tại và tối đa 3 ngày đầu của tháng kế tiếp (trước kỳ chốt công).
  - Đơn giải trình phải có đầy đủ: Giờ vào/ra cũ, Giờ vào/ra mới đề xuất, Lý do chi tiết.
  - Sau khi cấp có thẩm quyền (Quản lý hoặc HR) phê duyệt, hệ thống cập nhật bản ghi chấm công gốc với cờ `is_manually_corrected = TRUE`, đồng thời lưu vết vĩnh viễn ID người duyệt, ngày giờ duyệt và lý do duyệt vào bảng `attendance_corrections`.

---

### BR-017: Kiểm soát Đồng thời Khóa Lạc quan (Optimistic Concurrency Control)
- **Phân loại:** **KỸ THUẬT PHÒNG CHỐNG XUNG ĐỘT (Concurrency Rule)**
- **Mô tả chi tiết:**
  - Bảng `schedules` và `shift_assignments` đều sở hữu cột `version INT NOT NULL DEFAULT 0`.
  - Mọi yêu cầu cập nhật lịch từ giao diện web đều phải gửi kèm trường `version` hiện tại mà client đang nắm giữ.
  - Khi xảy ra xung đột (hai người quản lý cùng sửa một lịch tuần gần như đồng thời), người gửi sau sẽ nhận phản hồi HTTP `409 Conflict` kèm thông báo: *"Dữ liệu lịch làm việc đã bị thay đổi bởi người dùng khác. Vui lòng nhấn nút Làm mới để cập nhật dữ liệu mới nhất trước khi thao tác."*
  - Ngăn chặn hoàn toàn hiện tượng mất dữ liệu (Lost Update).

---

### BR-018: Quản lý Múi giờ và Tính toán Chuẩn hóa UTC (Timezone Standardization)
- **Phân loại:** **KIẾN TRÚC THỜI GIAN (Timezone Architecture Rule)**
- **Mô tả chi tiết:**
  - Mọi mốc thời gian sự kiện (Check-in time, Check-out time, Created at, Updated at) được lưu trữ trong CSDL dưới dạng UTC.
  - Mọi phép tính xác định ngày làm việc, giờ làm đêm (22:00 - 06:00), giờ ân hạn đi muộn được thực hiện theo ngữ cảnh múi giờ địa phương Việt Nam `Asia/Ho_Chi_Minh` (UTC+7).
  - Không chịu ảnh hưởng của quy ước giờ mùa hè (DST-free). Sẵn sàng cho việc mở rộng thêm chi nhánh ở múi giờ khác trong tương lai bằng cách gắn timezone vào phòng ban.

---

## 3. BẢNG CẤU HÌNH THAM SỐ CHÍNH SÁCH HỆ THỐNG (SYSTEM SETTINGS POLICY TABLE)

Toàn bộ các tham số điều khiển các quy tắc nghiệp vụ trên được quản lý tập trung trong bảng CSDL `system_settings`:

| Key Cấu hình (`setting_key`) | Kiểu Dữ liệu | Giá trị Mặc định | Đơn vị | Tham chiếu Pháp lý / Nghiệp vụ | Mô tả Chi tiết |
|:---|:---:|:---:|:---:|:---|:---|
| `MAX_WEEKLY_REGULAR_HOURS` | NUMBER | `48.0` | Giờ/tuần | Điều 105 BLLĐ 2019 | Giờ làm việc bình thường tối đa trong 1 tuần (vượt mức này sẽ kích hoạt Cảnh báo BR-004). |
| `MAX_DAILY_HOURS` | NUMBER | `8.0` | Giờ/ngày | Điều 105 BLLĐ 2019 | Giờ làm việc tiêu chuẩn trong 1 ngày làm việc bình thường. |
| `MAX_DAILY_HOURS_INCLUDING_OT` | NUMBER | `12.0` | Giờ/ngày | Điều 107 BLLĐ 2019 | Tổng giờ làm việc tối đa trong ngày bao gồm cả tăng ca (vượt mức này sẽ cảnh báo nghiêm trọng BR-005). |
| `NIGHT_SHIFT_START_TIME` | TIME | `22:00` | Giờ:phút | Điều 106 BLLĐ 2019 | Giờ bắt đầu tính khung thời gian làm việc ban đêm. |
| `NIGHT_SHIFT_END_TIME` | TIME | `06:00` | Giờ:phút | Điều 106 BLLĐ 2019 | Giờ kết thúc khung thời gian làm việc ban đêm. |
| `MIN_REST_BETWEEN_SHIFTS_HOURS`| NUMBER | `12.0` | Giờ | Điều 110 BLLĐ 2019 | Khoảng cách thời gian nghỉ tối thiểu giữa 2 ca làm việc liên tiếp (kích hoạt Cảnh báo BR-006). |
| `MIN_WEEKLY_REST_HOURS` | NUMBER | `24.0` | Giờ liên tục | Điều 111 BLLĐ 2019 | Thời gian nghỉ ngơi tối thiểu liên tục trong một tuần cho người lao động. |
| `STANDARD_ANNUAL_LEAVE_DAYS` | NUMBER | `12.0` | Ngày/năm | Điều 113 BLLĐ 2019 | Số ngày phép năm tiêu chuẩn cho người lao động làm đủ 12 tháng trong điều kiện bình thường. |
| `SENIORITY_LEAVE_INTERVAL_YEARS`| NUMBER | `5` | Năm | Điều 114 BLLĐ 2019 | Cứ đủ số năm thâm niên này thì được cộng thêm 1 ngày phép năm. |
| `GRACE_PERIOD_MINUTES` | NUMBER | `5` | Phút | Quy định Nội bộ | Thời gian cho phép đến muộn đầu ca mà không bị tính vi phạm đi muộn. |
| `MAX_EARLY_CHECKIN_MINUTES` | NUMBER | `60` | Phút | Quy định Nội bộ | Khoảng thời gian tối đa trước giờ bắt đầu ca cho phép nhân viên thực hiện Check-in. |
| `OT_ROUNDING_MINUTES` | NUMBER | `15` | Phút | Quy định Nội bộ | Bước làm tròn giờ làm thêm (15 phút/lần). Dưới 15 phút không tính OT. |
| `LEAVE_APPROVAL_TIER2_DAYS` | NUMBER | `3.0` | Ngày | Quy định Nội bộ | Số ngày nghỉ phép liên tục từ mức này trở lên bắt buộc phải có thêm phê duyệt cấp 2 của HR Manager. |
| `LEAVE_CONFLICT_SEVERITY` | STRING | `'WARNING'` | Enum | Quy định Nội bộ | Mức độ cảnh báo khi xếp ca vào ngày nghỉ phép đã duyệt (`WARNING` hoặc `MANDATORY`). |
| `OVERNIGHT_SHIFT_ATTRIBUTION` | STRING | `'START_DATE'` | Enum | Quy định Nội bộ | Quy ước ca qua đêm thuộc về ngày bắt đầu (`START_DATE`) hay ngày kết thúc (`END_DATE`). |

---

## 4. BẢNG TỔNG HỢP KỊCH BẢN THỰC TẾ WORKED EXAMPLES (Ít nhất 8 Kịch bản)

Bảng dưới đây mô phỏng 8 kịch bản nghiệp vụ thực tế xảy ra trong quá trình vận hành, minh họa chi tiết đầu vào, quy tắc kích hoạt, kết quả xử lý của hệ thống và dữ liệu ghi nhận:

| STT | Tên Kịch bản / Tình huống | Dữ liệu Đầu vào (Inputs) | Quy tắc Nghiệp vụ Kích hoạt | Kết quả Xử lý & Thông báo Hệ thống | Dữ liệu Ghi nhận / Trạng thái Database |
|:---:|:---|:---|:---:|:---|:---|
| **SC-01** | **Ca làm việc Qua đêm (Overnight Shift)** | Nhân viên: Nguyễn Văn An (EMP-001).<br>Ngày xếp ca: 15/10/2026.<br>Ca gán: Ca Đêm (`22:00` đến `06:00` hôm sau, nghỉ 0p).<br>Check-in: 15/10 21:55.<br>Check-out: 16/10 06:05. | **BR-011**, **DEC-015** | ✅ Hệ thống gán ca thành công vào ô ngày 15/10.<br>Khi chấm công xong: Tính tổng giờ làm việc thực tế = 8.0 giờ.<br>Tất cả 8.0 giờ đều được đánh dấu là `night_hours` (do rơi vào khung 22:00 - 06:00). | `shift_assignments`: `work_date = 2026-10-15`, `is_cross_midnight = TRUE`.<br>`attendance_records`: `check_in = 2026-10-15 14:55 UTC`, `check_out = 2026-10-15 23:05 UTC`, `actual_hours = 8.0`, `night_hours = 8.0`, `status = PRESENT`. |
| **SC-02** | **Xếp ca trùng ngày Nghỉ phép đã duyệt (Leave Conflict)** | Nhân viên: Trần Thị Bích (EMP-002).<br>Ngày xếp ca: 16/10/2026.<br>Đơn phép: Phép năm (ANNUAL_LEAVE) ngày 16/10 đã `APPROVED`.<br>Quản lý thao tác: Gán Ca Sáng (08:00 - 17:00). | **BR-003** (Cấu hình `WARNING`) | ⚠️ Giao diện hiển thị Modal cảnh báo màu vàng: *"Nhân viên đã được duyệt nghỉ Phép năm vào ngày 16/10. Bạn có chắc chắn muốn điều động?"*<br>Quản lý nhập lý do: *"Hỗ trợ sự kiện ra mắt sản phẩm mới đột xuất"* và bấm Xác nhận. | Ca được gán vào `shift_assignments` kèm `override_reason = 'Hỗ trợ sự kiện...'`.<br>Ghi log kiểm toán hành vi override.<br>Đơn phép giữ nguyên để nhân sự đối chiếu hoàn trả phép sau này. |
| **SC-03** | **Quên Check-out cuối ngày (Missing Check-out)** | Nhân viên: Lê Văn Cường (EMP-003).<br>Ngày: 15/10/2026.<br>Ca: Hành chính (08:00 - 17:00).<br>Check-in: 07:58.<br>Check-out: Không bấm (rời văn phòng lúc 17:05). | **FR-014**, **BR-016** | ❌ Đến 05:00 sáng ngày 16/10 (quá 12 tiếng sau ca), cron job quét và cập nhật trạng thái chấm công thành `MISSING_CHECKOUT`.<br>Số giờ công thực tế tạm tính = `0.0`.<br>Gửi thông báo nhắc nhân viên nộp đơn giải trình bổ sung công. | `attendance_records`: `check_in_time = 07:58`, `check_out_time = NULL`, `actual_hours = 0.0`, `status = MISSING_CHECKOUT`. |
| **SC-04** | **Đi làm vào Ngày nghỉ Lễ Quốc gia (Holiday Shift)** | Nhân viên: Phạm Văn Dũng (EMP-004).<br>Ngày: 02/09/2026 (Quốc khánh).<br>Ca gán: Ca Trực Lễ (08:00 - 16:00, nghỉ 0p).<br>Check-in: 07:55.<br>Check-out: 16:02. | **BR-007**, **DEC-010** | ⚠️ Khi xếp ca: Cảnh báo xếp ca vào ngày lễ công ty (Quản lý xác nhận).<br>Khi chấm công: Hệ thống tính `actual_hours = 8.0` giờ và tự động gắn cờ `holiday_work_hours = 8.0` để phục vụ chuyển dữ liệu kế toán tính đơn giá làm thêm ngày lễ 300%. | `shift_assignments`: có cờ cảnh báo lễ.<br>`attendance_records`: `actual_hours = 8.0`, `holiday_hours = 8.0`, `status = PRESENT`. |
| **SC-05** | **Tính toán Làm thêm giờ (Overtime Calculation)** | Nhân viên: Hoàng Thị Mai (EMP-005).<br>Ca: Hành chính (08:00 - 17:00, nghỉ trưa 60p).<br>Có Đơn đăng ký OT đã duyệt: 17:30 đến 19:30 (2.0 giờ).<br>Check-in: 07:50.<br>Check-out: 19:38. | **BR-010**, **OQ-001** (Bước làm tròn 15 phút) | ✅ Thời gian làm chuẩn: 08:00 - 17:00 (trừ 60p nghỉ) = 8.0 giờ.<br>Thời gian làm thêm: Từ 17:30 đến 19:38 (tổng 2 giờ 08 phút).<br>Theo quy tắc làm tròn 15 phút: 8 phút thừa bị bỏ qua $\rightarrow$ Ghi nhận chính xác `overtime_hours = 2.0` giờ. | `attendance_records`: `regular_hours = 8.0`, `overtime_hours = 2.0`, `actual_hours = 10.0`, `status = PRESENT`. |
| **SC-06** | **Vi phạm Thời gian nghỉ giữa 2 ca (< 12 giờ)** | Nhân viên: Đỗ Văn Nam (EMP-006).<br>Thứ Hai 15/10: Ca Chiều (14:00 - 22:00).<br>Thứ Ba 16/10: Quản lý cố gán Ca Sáng (06:00 - 14:00). | **BR-006** | ⚠️ Khoảng cách nghỉ: 22:00 hôm trước đến 06:00 hôm sau = 8.0 giờ (< 12.0 giờ).<br>Giao diện hiện Popup cảnh báo vi phạm Điều 110 BLLĐ 2019.<br>Quản lý phải chọn: "Nhân viên đã đồng ý đổi ca hỗ trợ khẩn cấp" mới lưu được. | Ghi nhận bản ghi phân ca kèm trường `override_rule = 'BR-006'`, `override_reason = 'Nhân viên đã đồng ý...'`. Ghi log kiểm toán. |
| **SC-07** | **Xếp Trùng Ca trong cùng một ngày (Shift Overlap)** | Nhân viên: Vũ Thị Lan (EMP-007).<br>Ngày: 18/10/2026.<br>Đã có Ca Sáng: 08:00 - 16:00.<br>Quản lý thao tác: Gán thêm Ca Hành chính (13:00 - 21:00). | **BR-001** (MANDATORY) | ⛔ Chặn tuyệt đối! Xuất hiện hộp thoại đỏ lỗi nghiêm trọng: *"Xung đột thời gian: Ca gán mới (13:00 - 21:00) trùng 3 giờ (13:00 - 16:00) với Ca Sáng đã xếp."*<br>Không có nút Override. Bắt buộc hủy thao tác. | Giao dịch bị hủy bỏ (Rollback). Cơ sở dữ liệu không bị thay đổi. |
| **SC-08** | **Xung đột Khóa Lạc quan khi 2 Quản lý cùng sửa lịch tuần (Optimistic Lock Conflict)** | Quản lý A và Quản lý B cùng mở Lịch tuần 42 của phòng Chăm sóc khách hàng (Version = 3).<br>Quản lý A gán ca và nhấn Lưu lúc 10:00:00 (thành công, version lên 4).<br>Quản lý B đổi ca và nhấn Lưu lúc 10:00:02 (gửi version = 3). | **BR-017**, **DEC-012** | ⛔ Backend bắt `OptimisticLockException` và trả về HTTP `409 Conflict`.<br>Màn hình của Quản lý B hiển thị thông báo: *"Lịch tuần này vừa được Quản lý A cập nhật. Dữ liệu đã thay đổi. Vui lòng tải lại trang để xem lịch mới nhất."* | Thao tác của Quản lý B bị từ chối; dữ liệu của Quản lý A được bảo toàn nguyên vẹn. |

---
*Kết thúc Tài liệu 07.*
