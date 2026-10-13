# TÀI LIỆU 01: YÊU CẦU NGHIỆP VỤ VÀ TÍNH NĂNG SẢN PHẨM (PRD & BRD)
**Dự án:** Employee Management System  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. MỤC TIÊU DỰ ÁN VÀ TIÊU CHÍ THÀNH CÔNG (BUSINESS OBJECTIVES & OKRs)

### 1.1. Bối cảnh và Mục tiêu Doanh nghiệp
Doanh nghiệp quy mô từ 50 đến 300 nhân sự đang đối mặt với bài toán quản lý phân ca thủ công qua file Excel rời rạc:
- Xung đột ca làm việc (trùng ca, thiếu người ca đêm, vi phạm giờ nghỉ giữa 2 ca) thường xuyên xảy ra.
- Dữ liệu chấm công bị phân mảnh, tốn từ 3 đến 5 ngày công mỗi tháng để Trưởng phòng Nhân sự và Kế toán rà soát đối chiếu.
- Đơn xin nghỉ phép và giải trình quên chấm công bằng giấy tờ/tin nhắn chat dễ thất lạc, không kiểm soát được số dư phép năm.

**Mục tiêu của dự án Employee Management System:**
1. **Số hóa 100% quy trình phân ca:** Chuyển đổi toàn bộ việc xếp ca tuần từ Excel sang giao diện trực quan dạng ma trận (Nhân viên x Ngày), tích hợp cơ chế tự động phát hiện xung đột và cảnh báo theo thời gian thực.
2. **Minh bạch và tức thời trong chấm công:** Nhân viên thực hiện Check-in / Check-out trực tiếp trên Web Portal; hệ thống tự động tính toán số giờ làm việc thực tế, giờ tăng ca (OT), giờ làm đêm và đối chiếu tức thì với ca được phân.
3. **Chuẩn hóa phê duyệt phép và giải trình:** Tự động hóa vòng đời đơn nghỉ phép và đơn bổ sung công với luồng phê duyệt phân cấp rõ ràng (Quản lý trực tiếp -> Nhân sự).
4. **Tuân thủ khung pháp lý Việt Nam:** Đảm bảo các cảnh báo về thời gian làm việc, giờ làm đêm, giờ làm thêm giờ và nghỉ ngơi tuân thủ Bộ luật Lao động 2019 thông qua các tham số cấu hình linh hoạt.

### 1.2. Tiêu chí Thành công (Key Success Metrics)
- **Thời gian lập lịch:** Giảm 75% thời gian tạo và phê duyệt lịch tuần của Trưởng bộ phận (từ trung bình 4 giờ/tuần xuống dưới 1 giờ/tuần nhờ tính năng nhân bản tuần và gán hàng loạt).
- **Độ chính xác dữ liệu công:** Giảm 90% số lượng khiếu nại sai lệch giờ công của người lao động vào cuối tháng.
- **Tốc độ chốt công tháng:** Giảm thời gian tổng hợp báo cáo công tháng từ 3 ngày làm việc xuống còn dưới 30 phút.
- **Tỷ lệ nhân viên tự phục vụ (Self-service):** 100% nhân sự chủ động theo dõi lịch làm việc cá nhân, số dư ngày phép và gửi đơn xin nghỉ/giải trình trên hệ thống.

---

## 2. VAI TRÒ NGƯỜI DÙNG VÀ MA TRẬN PHÂN QUYỀN (ROLES & RBAC MATRIX)

### 2.1. Định nghĩa các Vai trò (User Roles)

| Mã Role | Tên Vai trò | Phạm vi Dữ liệu (Data Scope) | Trách nhiệm Nghiệp vụ |
|:---|:---|:---|:---|
| **ROLE_ADMIN** | Quản trị viên Hệ thống | Toàn bộ hệ thống (Toàn công ty) | Cấu hình tham số hệ thống, quản lý tài khoản người dùng, gán quyền, giám sát nhật ký kiểm toán (Audit Log), khôi phục dữ liệu. |
| **ROLE_HR_MANAGER** | Trưởng phòng / Chuyên viên Nhân sự | Toàn bộ nhân viên công ty | Quản lý hồ sơ nhân viên, phòng ban, chức danh; cấu hình mẫu ca; giám sát và điều chỉnh bảng chấm công toàn công ty; phê duyệt phép cấp cao; xuất báo cáo tổng hợp. |
| **ROLE_DEPT_MANAGER** | Trưởng bộ phận / Quản lý ca | Phạm vi Phòng ban quản lý và các phòng ban cấp con trực thuộc | Lập lịch và công bố ca làm việc tuần cho nhân viên thuộc bộ phận; phê duyệt đơn xin nghỉ phép của nhân viên; duyệt đơn giải trình chấm công của bộ phận mình. |
| **ROLE_EMPLOYEE** | Nhân viên thông thường | Chỉ dữ liệu của chính mình (Self-data only) | Xem lịch làm việc cá nhân; thực hiện Check-in / Check-out trên web; gửi đơn xin nghỉ phép; gửi đơn giải trình chấm công; theo dõi số dư phép cá nhân. |

### 2.2. Ma trận Phân quyền Chức năng và Thao tác (Feature x Role Permission Matrix)

*Ký hiệu: C (Create), R (Read), U (Update), D (Delete/Deactivate), A (Approve/Reject), P (Publish/Unpublish), `-` (Không có quyền).*

| Phân hệ / Tính năng | ROLE_ADMIN | ROLE_HR_MANAGER | ROLE_DEPT_MANAGER | ROLE_EMPLOYEE | Cơ chế Kiểm soát Backend bắt buộc |
|:---|:---:|:---:|:---:|:---:|:---|
| **A. Dashboard Tổng quan** | R (Toàn bộ) | R (Toàn bộ) | R (Dept scope) | R (Self scope) | JPA Specification lọc theo `department_id` hoặc `employee_id`. |
| **B. Quản lý Nhân sự (Employees)** | C, R, U, D | C, R, U, D | R (Dept scope) | R (Chỉ hồ sơ mình) | Cấm Dept Manager gọi API POST/PUT/DELETE nhân viên. Spring Security `@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")`. |
| **C. Phòng ban & Chức danh** | C, R, U, D | C, R, U, D | R (Toàn bộ) | R (Toàn bộ) | Chỉ Admin & HR được thêm/sửa/xóa phòng ban và chức danh. |
| **D. Chấm công (Attendance)** | | | | | |
| - Check-in / Check-out Web | C | C | C | C (Self only) | API ép buộc `employee_id = current_user.employee_id`. |
| - Xem bảng công hàng ngày/tháng | R (Toàn bộ) | R (Toàn bộ) | R (Dept scope) | R (Self scope) | Kiểm tra quyền truy cập theo phòng ban tại tầng Service. |
| - Gửi đơn giải trình chấm công | C | C | C | C (Self only) | Nhân viên chỉ được tạo đơn cho ngày công của chính mình. |
| - Phê duyệt giải trình chấm công | A | A | A (Dept scope) | - | Dept Manager duyệt đơn của cấp dưới; HR duyệt toàn bộ. |
| **E. Quản lý Ca & Phân ca (Schedules)** | | | | | |
| - Cấu hình Mẫu ca (Work Shifts) | C, R, U, D | C, R, U, D | R (Xem danh mục) | R (Xem danh mục) | Chỉ Admin & HR được chỉnh sửa mẫu ca. |
| - Lập lịch phân ca (Draft) | C, R, U, D | C, R, U, D | C, R, U, D (Dept) | - | Dept Manager chỉ được gán ca cho nhân sự thuộc bộ phận mình. |
| - Công bố lịch (Publish/Unpublish) | P | P | P (Dept scope) | - | Dept Manager chỉ được công bố lịch phòng ban mình phụ trách. |
| - Xem lịch biểu tuần phòng ban | R (Toàn bộ) | R (Toàn bộ) | R (Dept scope) | - | Lịch nháp chỉ Quản lý mới nhìn thấy. |
| - Xem lịch làm việc cá nhân | R (Toàn bộ) | R (Toàn bộ) | R (Toàn bộ) | R (Chỉ lịch Published) | Nhân viên thông thường CHỈ nhìn thấy ca có trạng thái `PUBLISHED`. |
| **F. Quản lý Nghỉ phép & Ngày lễ** | | | | | |
| - Cấu hình Loại phép & Ngày lễ | C, R, U, D | C, R, U, D | R | R | Admin & HR cấu hình ngày nghỉ lễ và quỹ phép năm. |
| - Tạo đơn xin nghỉ phép | C | C | C | C (Self only) | Tự tạo đơn cho chính mình. |
| - Phê duyệt đơn xin nghỉ phép | A | A (Toàn bộ/Cấp 2) | A (Dept scope/Cấp 1) | - | Phê duyệt 2 cấp: Quản lý trực tiếp duyệt, HR duyệt đơn dài ngày. |
| **G. Báo cáo & Xuất Excel** | R, Export | R, Export | R (Dept), Export | - | Giới hạn phạm vi dữ liệu xuất ra theo vai trò. |
| **H. Tài khoản, Quyền & Cài đặt** | C, R, U, D | - | - | - | `@PreAuthorize("hasRole('ADMIN')")`. |

### 2.3. Quy tắc Thực thi Bảo mật tại Backend (Enforced in Backend, Not UI Only)
1. **Tuyệt đối không tin tưởng Client:** Dữ liệu ẩn nút ở giao diện chỉ mang tính chất trải nghiệm (UX). Mọi API endpoint đều được bảo vệ bởi Spring Security `@PreAuthorize` kết hợp custom Permission Evaluator.
2. **Kiểm tra Ngữ cảnh Dữ liệu (Data-Scope Validation):**
   - Khi `ROLE_DEPT_MANAGER` gọi API xem/sửa dữ liệu (ví dụ: `GET /api/v1/schedules?department_id=5`), tầng Service bắt buộc kiểm tra xem người dùng hiện tại có phụ trách `department_id=5` hoặc các phòng ban con của nó hay không. Nếu không, trả về HTTP `403 Forbidden`.
   - Khi `ROLE_EMPLOYEE` gọi API xem chấm công hoặc đơn phép, backend tự động ghi đè hoặc so sánh tham số `employee_id` với định danh nhân viên liên kết trong JWT Principal. Nếu truy vấn sang ID người khác, lập tức chặn và trả về HTTP `403 Forbidden`.

---

## 3. PHẠM VI TÍNH NĂNG CHI TIẾT THEO PHÂN HỆ (MODULE SPECIFICATIONS)

---

### PHÂN HỆ A: BẢNG ĐIỀU KHIỂN TRỰC QUAN (DASHBOARD)
- **Mã phân hệ:** `MOD-A`
- **Mục tiêu:** Cung cấp bức tranh toàn cảnh về tình hình nhân sự, tỷ lệ đi làm hôm nay, ca làm việc sắp diễn ra và danh sách việc cần xử lý nhanh (Pending Approvals).

#### Yêu cầu Chức năng:
- **FR-001 (Dashboard theo vai trò):** Hệ thống tự động chuyển hướng và hiển thị giao diện Dashboard tương ứng với vai trò của người dùng khi đăng nhập thành công.
  - *Admin/HR Dashboard:* Thống kê toàn công ty: Tổng số nhân sự, số nhân sự đang hoạt động (active), số nhân viên có mặt hôm nay, số nhân viên vắng mặt, số nhân viên đi muộn/về sớm, số nhân viên đang nghỉ phép có lương/không lương, biểu đồ phân bổ ca hôm nay, danh sách đơn xin nghỉ/giải trình chờ phê duyệt toàn công ty.
  - *Department Manager Dashboard:* Thống kê trong phạm vi phòng ban: Tỷ lệ nhân sự đi làm hôm nay của bộ phận, danh sách ca làm việc của bộ phận trong ngày, cảnh báo ca thiếu người (dưới min staffing), danh sách đơn phép và giải trình công của nhân viên cấp dưới đang chờ duyệt.
  - *Employee Dashboard:* Trang tổng quan cá nhân: Nút Check-in / Check-out nhanh kèm đồng hồ số thời gian thực (real-time clock), trạng thái chấm công hôm nay, ca làm việc kế tiếp trong tuần, số dư phép năm còn lại, trạng thái các đơn từ cá nhân vừa gửi.
- **FR-002 (Biểu đồ Xu hướng Đi làm):** Cung cấp biểu đồ trực quan thống kê tỷ lệ đúng giờ / đi muộn / vắng mặt trong 7 ngày gần nhất và tổng số giờ làm việc thực tế so với giờ kế hoạch trong tháng hiện tại.
- **FR-003 (Widget Phê duyệt Nhanh):** Cho phép Quản lý duyệt hoặc từ chối nhanh đơn xin nghỉ phép và giải trình công ngay tại màn hình Dashboard với 1 cú click (kèm modal nhập lý do nếu từ chối).

---

### PHÂN HỆ B: QUẢN LÝ HỒ SƠ NHÂN SỰ (EMPLOYEE MANAGEMENT)
- **Mã phân hệ:** `MOD-B`
- **Mục tiêu:** Quản lý tập trung vòng đời nhân viên từ khi gia nhập đến khi nghỉ việc, lưu vết thông tin tổ chức và lịch sử công tác.

#### Yêu cầu Chức năng:
- **FR-004 (Danh sách Nhân viên Phân trang):** Hiển thị danh sách nhân viên dạng bảng với phân trang server-side (mặc định 10, 20, 50, 100 dòng/trang). Hỗ trợ tìm kiếm nhanh theo mã nhân viên (`employee_code`), họ tên (`full_name`), email, số điện thoại; lọc đa tiêu chí theo phòng ban, chức danh, trạng thái làm việc, loại hình hợp đồng.
- **FR-005 (Thêm mới và Cập nhật Hồ sơ):**
  - Các trường thông tin bắt buộc: Mã nhân viên (tự sinh định dạng `EMP-xxxxx` hoặc nhập tay có kiểm tra trùng), Họ và tên đầy đủ, Email doanh nghiệp (kiểm tra định dạng và tính duy nhất), Số điện thoại (kiểm tra định dạng di động VN và tính duy nhất), Phòng ban, Chức danh, Người quản lý trực tiếp (`manager_id`), Trạng thái làm việc (`PROBATION` - Thử việc, `OFFICIAL` - Chính thức, `ON_LEAVE` - Nghỉ dài hạn/Thai sản, `RESIGNED` - Thôi việc), Loại hình làm việc (`FULL_TIME`, `PART_TIME`, `INTERN`, `CONTRACTOR`), Ngày vào làm (`hire_date`).
  - Các trường tùy chọn: Số CCCD/CMND (`national_id`, kiểm tra trùng nếu có nhập), Ngày sinh, Giới tính, Địa chỉ thường trú.
- **FR-006 (Xóa mềm và Khôi phục Nhân sự):** 
  - Khi nhân viên thôi việc, hệ thống chuyển trạng thái sang `RESIGNED`, thiết lập `is_active = FALSE` và gán thời gian `deleted_at`.
  - Nghiêm cấm xóa vật lý (Hard delete) để bảo vệ toàn vẹn lịch sử chấm công và phân ca trước đó.
  - Cho phép Admin khôi phục (Reactivate) hồ sơ nhân viên đã thôi việc nếu nhân sự quay trở lại làm việc.
- **FR-007 (Xem Chi tiết Hồ sơ Toàn diện):** Màn hình chi tiết hồ sơ nhân viên (SCR-05) hiển thị 4 tab liên kết: (1) Thông tin cá nhân & công việc, (2) Lịch sử phân ca làm việc, (3) Lịch sử chấm công thực tế theo tháng, (4) Lịch sử và số dư nghỉ phép.

---

### PHÂN HỆ C: QUẢN LÝ CƠ CẤU PHÒNG BAN & CHỨC DANH (DEPARTMENT & POSITION)
- **Mã phân hệ:** `MOD-C`
- **Mục tiêu:** Xây dựng sơ đồ cây tổ chức doanh nghiệp và danh mục chức danh phục vụ phân luồng duyệt và giới hạn dữ liệu.

#### Yêu cầu Chức năng:
- **FR-008 (Cơ cấu Phòng ban Cây phân cấp):** Quản lý danh mục phòng ban hỗ trợ cấu trúc cha - con đa cấp (`parent_department_id`). Mỗi phòng ban có mã phòng ban (`department_code`, duy nhất), tên phòng ban, trưởng bộ phận (`manager_id` liên kết nhân viên).
- **FR-009 (Ngăn chặn Vòng lặp Phân cấp):** Hệ thống chặn tuyệt đối việc thiết lập quan hệ cha-con tạo thành vòng lặp vô tận (Circular Hierarchy, ví dụ: Phòng A là cha của Phòng B, nhưng người dùng sửa Phòng B thành cha của Phòng A).
- **FR-010 (Ràng buộc Khi Ngừng hoạt động Phòng ban):** Không cho phép vô hiệu hóa hoặc xóa mềm một phòng ban nếu phòng ban đó vẫn còn nhân viên đang hoạt động hoặc còn các phòng ban con đang hoạt động. Bắt buộc chuyển nhân viên sang phòng ban khác trước khi đóng phòng ban.
- **FR-011 (Danh mục Chức danh):** CRUD danh mục chức danh (Mã chức danh, tên chức danh, mô tả). Kiểm tra không cho phép xóa chức danh đang được gán cho nhân viên.

---

### PHÂN HỆ D: QUẢN LÝ CHẤM CÔNG (ATTENDANCE MANAGEMENT)
- **Mã phân hệ:** `MOD-D`
- **Mục tiêu:** Ghi nhận chính xác mốc thời gian làm việc thực tế, tính toán giờ công chuẩn, giờ OT, giờ làm đêm và hỗ trợ quy trình giải trình điều chỉnh minh bạch.

#### Yêu cầu Chức năng:
- **FR-012 (Web Check-in / Check-out):** Nhân viên đăng nhập vào hệ thống nhấn nút Check-in khi bắt đầu ca và Check-out khi kết thúc ca.
  - Hệ thống ghi nhận chính xác mốc thời gian thực của máy chủ (Server Timestamp UTC), địa chỉ IP và gán `source = 'WEB_PORTAL'`.
  - Hiển thị phản hồi tức thì trạng thái: Đã check-in lúc mấy giờ, số giờ đã làm việc tính đến hiện tại.
- **FR-013 (Tính toán Số giờ Công Thực tế Tự động):**
  - Khi có đủ cặp Check-in và Check-out, hệ thống tự động tính:
    - *Tổng giờ hiện diện:* Khoảng cách từ Check-in đến Check-out.
    - *Giờ làm việc thực tế (`actual_hours`):* Tổng giờ trừ đi thời gian nghỉ không lương của ca tương ứng.
    - *Số phút đi muộn (`late_minutes`):* Tính từ giờ bắt đầu ca quy định cộng thời gian ân hạn (grace period, mặc định 5 phút) đến giờ check-in thực tế.
    - *Số phút về sớm (`early_leave_minutes`):* Tính từ giờ check-out thực tế đến giờ kết thúc ca quy định.
    - *Giờ làm việc ban đêm (`night_hours`):* Số giờ thực tế rơi vào khung 22:00 - 06:00.
    - *Giờ làm thêm (`overtime_hours`):* Số giờ làm vượt ngoài khung giờ quy định của ca (chỉ tính khi có phê duyệt làm thêm giờ).
- **FR-014 (Xử lý Quên Check-out):** Nếu hết ngày làm việc (hoặc sau 12 tiếng kể từ giờ kết thúc ca) mà nhân viên chỉ có Check-in mà không có Check-out, hệ thống tự động đánh dấu bản ghi là `MISSING_CHECKOUT`. Nhân viên không được tính công ngày đó cho đến khi hoàn thành quy trình giải trình.
- **FR-015 (Quy trình Giải trình / Điều chỉnh Chấm công):**
  - Nhân viên có quyền gửi đơn giải trình chấm công (Attendance Correction) cho các bản ghi bị thiếu check-out, sai giờ do lỗi kỹ thuật hoặc đi công tác ngoài văn phòng.
  - Đơn giải trình bao gồm: Ngày làm việc, Giờ check-in mới đề xuất, Giờ check-out mới đề xuất, Lý do giải trình chi tiết.
  - Quản lý bộ phận hoặc HR xem xét phê duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) kèm lý do.
  - Khi đơn được duyệt, hệ thống cập nhật giờ công mới vào bảng `attendance_records`, đổi trạng thái bản ghi thành `CORRECTED`, đồng thời ghi vết kiểm toán toàn diện: Ai duyệt, duyệt lúc nào, giá trị cũ là gì.

---

### PHÂN HỆ E: QUẢN LÝ CA LÀM VIỆC VÀ LỊCH LÀM VIỆC (CORE WORK SCHEDULING)
- **Mã phân hệ:** `MOD-E` (MODULE CỐT LÕI)
- **Mục tiêu:** Cấu hình mẫu ca linh hoạt và cung cấp công cụ xếp ca trực quan theo tuần, tự động kiểm tra xung đột và kiểm soát chặt chẽ trạng thái nháp/công bố.

#### Yêu cầu Chức năng:
- **FR-016 (Cấu hình Mẫu ca làm việc - Shift Templates):**
  - Cho phép Admin/HR tạo và quản lý các mẫu ca tái sử dụng: Mã ca (`shift_code`, duy nhất, ví dụ `CA-SANG`), Tên ca (`shift_name`), Giờ bắt đầu (`start_time`), Giờ kết thúc (`end_time`), Thời gian nghỉ giữa ca (`break_minutes`), Cờ qua đêm (`is_cross_midnight`), Màu sắc nhận diện giao diện (`color_code`), Định biên nhân sự tối thiểu/tối đa (`min_staffing`, `max_staffing`), Các thứ trong tuần áp dụng.
  - Hỗ trợ ca làm việc hành chính chuẩn và ca qua đêm (ví dụ: 22:00 hôm nay đến 06:00 sáng hôm sau).
- **FR-017 (Bảng Lịch Biểu Tuần - Weekly Timetable Matrix):**
  - Màn hình SCR-11 hiển thị ma trận phân ca trực quan: Danh sách nhân viên theo hàng dọc (nhóm theo phòng ban), các ngày từ Thứ Hai đến Chủ Nhật theo cột ngang.
  - Tại mỗi ô giao điểm hiển thị thẻ ca (Shift Chip) với màu sắc và tên ca, kèm badge cảnh báo nếu vi phạm quy tắc.
  - Hiển thị đồng thời: Ngày nghỉ tuần, Ngày lễ công ty, Đơn xin nghỉ phép đã duyệt của nhân viên trong tuần đó dưới dạng thẻ thông tin trực quan để quản lý không xếp nhầm ca.
- **FR-018 (Thao tác Gán Ca Linh hoạt):**
  - Gán ca đơn lẻ: Click vào ô bất kỳ để mở Drawer chọn ca.
  - Gán ca hàng loạt (Bulk Assignment): Chọn nhiều nhân viên hoặc toàn bộ phòng ban, chọn dải ngày trong tuần và gán chung một mẫu ca chỉ với 1 thao tác.
  - Sao chép tuần (Copy Previous Week): Sao chép toàn bộ lịch phân ca của tuần trước sang tuần hiện tại để tiết kiệm thời gian xếp lịch định kỳ.
- **FR-019 (Cơ chế Phát hiện Xung đột Tức thì - Real-time Conflict Engine):**
  - Khi quản lý thao tác gán ca hoặc kiểm tra lịch trước khi lưu, hệ thống chạy engine kiểm tra xung đột (cung cấp API Dry-run) và phân loại lỗi:
    - *Lỗi Bắt buộc (MANDATORY):* Chặn hoàn toàn thao tác (trùng ca cùng khung giờ, phân ca cho nhân viên đã nghỉ việc/vô hiệu hóa).
    - *Cảnh báo (WARNING):* Hiển thị cảnh báo màu vàng kèm mô tả vi phạm (vượt 48h/tuần, vi phạm 12h nghỉ giữa 2 ca, trùng lịch nghỉ phép đã duyệt, thiếu người theo min staffing). Quản lý có quyền Ghi đè (Override) nếu nhập đầy đủ lý do giải trình.
- **FR-020 (Vòng đời Lịch làm việc - Draft & Published Workflow):**
  - Lịch tuần mới tạo mặc định ở trạng thái `DRAFT` (Nháp). Nhân viên không nhìn thấy lịch nháp trên lịch cá nhân.
  - Quản lý có quyền chỉnh sửa, xóa, thử nghiệm xếp ca tự do khi lịch ở trạng thái Draft.
  - Thao tác Công bố (`PUBLISH`): Chuyển trạng thái lịch sang `PUBLISHED`. Khi đó, các ca làm việc chính thức hiển thị trên ứng dụng của nhân viên.
  - Thay đổi trên lịch đã công bố: Mọi thao tác thêm/sửa/hủy ca sau khi lịch đã `PUBLISHED` bắt buộc phải nhập lý do thay đổi (`change_reason`). Hệ thống tự động ghi nhật ký vào bảng `schedule_change_history` và gắn cờ để gửi thông báo cho nhân viên bị ảnh hưởng.
  - Thao tác Hủy công bố (`UNPUBLISH`): Đưa lịch trở lại trạng thái `DRAFT` (kèm quyền kiểm soát nghiêm ngặt của HR/Admin).

---

### PHÂN HỆ F: QUẢN LÝ NGHỈ PHÉP VÀ NGÀY LỄ (LEAVE & HOLIDAY MANAGEMENT)
- **Mã phân hệ:** `MOD-F`
- **Mục tiêu:** Quản lý số dư ngày phép, tự động hóa luồng xin nghỉ và tích hợp đồng bộ với lịch phân ca để ngăn chặn phân ca sai.

#### Yêu cầu Chức năng:
- **FR-021 (Cấu hình Danh mục Loại phép):** Quản lý các loại nghỉ phép: Phép năm (`ANNUAL_LEAVE`, có trừ quỹ phép), Nghỉ ốm hưởng BHXH (`SICK_LEAVE`), Nghỉ thai sản (`MATERNITY_LEAVE`), Nghỉ việc riêng hưởng lương (`COMPASSIONATE_LEAVE` - kết hôn, tang chế), Nghỉ không hưởng lương (`UNPAID_LEAVE`). Cấu hình cờ có hưởng lương hay không và có yêu cầu đính kèm tài liệu minh chứng hay không.
- **FR-022 (Quản lý Quỹ phép và Số dư Phép năm):**
  - Hệ thống theo dõi quỹ phép năm (`leave_balances`) của từng nhân viên theo từng năm dương lịch.
  - Tự động tích lũy phép năm theo thâm niên (mặc định 12 ngày/năm, cộng thêm 1 ngày cho mỗi 5 năm làm việc theo Điều 114 BLLĐ 2019).
  - Tự động trừ số ngày phép khả dụng khi đơn xin nghỉ phép được phê duyệt chính thức.
- **FR-023 (Vòng đời Đơn xin Nghỉ phép):**
  - Trạng thái đơn: `DRAFT` -> `SUBMITTED` (Đã nộp) -> `APPROVED` (Đã duyệt) / `REJECTED` (Bị từ chối) -> `CANCELLED` (Hủy đơn).
  - Kiểm tra điều kiện khi nộp đơn: Kiểm tra số dư phép khả dụng (nếu là loại phép tính quỹ); kiểm tra không được nộp trùng dải ngày với đơn phép khác đã được duyệt hoặc đang chờ duyệt.
- **FR-024 (Quy trình Phê duyệt Phân cấp Linh hoạt):**
  - Mặc định: Trưởng bộ phận trực tiếp duyệt đơn của nhân viên.
  - Cấu hình phê duyệt 2 cấp: Đối với đơn xin nghỉ phép liên tục trên $N$ ngày (cấu hình trong `system_settings`, mặc định $N = 3$ ngày), sau khi Trưởng bộ phận duyệt cấp 1, đơn tự động chuyển lên Trưởng phòng Nhân sự (HR Manager) phê duyệt cấp 2 mới có hiệu lực.
- **FR-025 (Quản lý Ngày lễ Công ty):** Danh mục ngày lễ quốc gia và ngày nghỉ nội bộ công ty (`company_holidays`). Quản lý cấu hình lịch ngày nghỉ lễ và các ngày làm việc bù (compensatory workdays). Toàn bộ ngày lễ được hiển thị đánh dấu nổi bật trên Bảng lịch tuần (SCR-11) và Lịch cá nhân (SCR-17).

---

### PHÂN HỆ G: BÁO CÁO VÀ THỐNG KÊ (REPORTS & ANALYTICS)
- **Mã phân hệ:** `MOD-G`
- **Mục tiêu:** Cung cấp số liệu tổng hợp chính xác phục vụ đánh giá năng suất và chuyển giao dữ liệu cho bộ phận tính lương.

#### Yêu cầu Chức năng:
- **FR-026 (Báo cáo Điểm danh Hàng ngày):** Báo cáo tình trạng đi làm theo ngày chọn: Danh sách nhân viên, ca làm việc được phân, giờ check-in, giờ check-out, số phút đi muộn, số phút về sớm, trạng thái (Có mặt, Đi muộn, Về sớm, Vắng không phép, Nghỉ phép).
- **FR-027 (Báo cáo Tổng hợp Công tháng):** Bảng tổng hợp công tháng theo nhân viên và phòng ban: Tổng số ca được phân, tổng số ca đã làm, tổng số giờ làm việc chuẩn, tổng số giờ làm thêm (OT ngày thường, OT ngày nghỉ, OT ngày lễ), tổng số giờ làm việc ban đêm, tổng số lần đi muộn/về sớm, tổng số ngày nghỉ phép có lương/không lương.
- **FR-028 (Báo cáo Đối chiếu Kế hoạch vs Thực tế - Scheduled vs Actual):** Báo cáo so sánh trực quan giữa số giờ được xếp lịch theo kế hoạch và số giờ nhân viên thực sự có mặt làm việc, tính toán tỷ lệ chênh lệch (%) để phát hiện nhân sự thừa/thiếu giờ làm.
- **FR-029 (Xuất Dữ liệu Đa định dạng):** Hỗ trợ xuất toàn bộ các báo cáo trên ra định dạng file **Excel (.xlsx)** và **CSV** chuẩn mã hóa UTF-8 (hiển thị tiếng Việt không bị lỗi font), có định dạng tiêu đề, bộ lọc và tổng dòng cuối bảng.

---

### PHÂN HỆ H: TÀI KHOẢN, PHÂN QUYỀN VÀ BẢO MẬT (USERS, ROLES & SECURITY)
- **Mã phân hệ:** `MOD-H`
- **Mục tiêu:** Đảm bảo xác thực an toàn, kiểm soát truy cập và bảo vệ dữ liệu theo tiêu chuẩn doanh nghiệp.

#### Yêu cầu Chức năng:
- **FR-030 (Xác thực Đăng nhập & Đăng xuất):** Đăng nhập bằng mã nhân viên / email và mật khẩu. Mã hóa mật khẩu bằng thuật toán an toàn **BCrypt** (work factor 12). Cung cấp chức năng Đăng xuất (thu hồi refresh token và xóa cookie an toàn).
- **FR-031 (Đổi mật khẩu Bắt buộc Lần đầu Đăng nhập):** Khi tài khoản mới được tạo bởi Admin với mật khẩu tạm thời (`must_change_password = TRUE`), hệ thống bắt buộc người dùng phải đổi mật khẩu mới ngay sau khi đăng nhập lần đầu trước khi được truy cập các tính năng khác.
- **FR-032 (Chống Tấn công Dò Mật khẩu - Login Throttling):** Áp dụng giới hạn tần suất đăng nhập (Rate Limiting). Nếu đăng nhập sai quá 5 lần liên tiếp trong vòng 15 phút từ cùng một IP/tài khoản, hệ thống tự động khóa tạm thời tài khoản trong 15 phút và trả về thông báo lỗi rõ ràng.
- **FR-033 (Quản lý Tài khoản & Phân quyền):** Cho phép Quản trị viên kích hoạt / vô hiệu hóa tài khoản người dùng, gán một hoặc nhiều vai trò (Roles) cho tài khoản, và thiết lập lại mật khẩu tạm thời khi người dùng quên mật khẩu.

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 4.1. Hiệu năng và Tải hệ thống (Performance & Scalability)
- **NFR-001 (Tốc độ tải Bảng Lịch tuần):** Màn hình Lịch làm việc tuần (SCR-11) tải đầy đủ dữ liệu cho phòng ban quy mô lên tới 200 nhân sự trong 31 ngày (tháng) hoặc 7 ngày (tuần) trong thời gian **dưới 3,0 giây** ở điều kiện mạng bình thường (Ping < 50ms, băng thông tiêu chuẩn).
- **NFR-002 (Thời gian phản hồi API Chấm công):** Thao tác Check-in / Check-out (API-025, API-026) phản hồi trong thời gian **dưới 200 mili-giây** (p95) để tránh tắc nghẽn khi hàng trăm nhân viên cùng quét mã/nhấn nút đầu giờ làm việc.
- **NFR-003 (Thời gian phản hồi API Chung):** 95% các API truy vấn nghiệp vụ thông thường (xem danh sách nhân viên, xem bảng công, nộp đơn) có thời gian phản hồi **dưới 500 mili-giây**.
- **NFR-004 (Độ đồng thời - Concurrency):** Hệ thống phục vụ ổn định tối thiểu 100 người dùng hoạt động đồng thời (concurrent users) mà không xảy ra hiện tượng tràn bộ nhớ (OOM) hoặc nghẽn kết nối cơ sở dữ liệu (Connection Pool Exhaustion).

### 4.2. An ninh và Bảo mật Dữ liệu (Security & Compliance)
- **NFR-005 (Bảo vệ Lỗ hổng OWASP Top 10):** Chống triệt để các lỗ hổng Injection (SQL Injection bằng Hibernate Parameterized Queries), Broken Access Control (kiểm tra phân quyền hai lớp tại Filter và Service), XSS (thoát mã ký tự đầu ra trên React, cấm `dangerouslySetInnerHTML`), CSRF (sử dụng Header Bearer Token và SameSite Cookie).
- **NFR-006 (Bảo vệ Dữ liệu Cá nhân theo Nghị định 13/2023/NĐ-CP):** Dữ liệu định danh cá nhân nhạy cảm (Số CCCD, số điện thoại, ngày sinh, địa chỉ) được kiểm soát truy cập nghiêm ngặt. Chỉ người sở hữu tài khoản, Trưởng phòng Nhân sự và Quản trị viên có quyền xem. Không log thông tin mật khẩu hoặc CCCD ra file log ứng dụng.
- **NFR-007 (Chính sách Mật khẩu Doanh nghiệp):** Mật khẩu người dùng bắt buộc dài tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.
- **NFR-008 (Nhật ký Kiểm toán Toàn vẹn - Audit Trail):** Ghi log bất biến (Immutable Audit Log) đối với toàn bộ các thao tác nhạy cảm: Thay đổi trạng thái lịch sau khi công bố, Điều chỉnh giờ chấm công, Phê duyệt đơn xin nghỉ, Khóa/mở tài khoản người dùng. Log bao gồm: `user_id`, `action`, `entity_name`, `entity_id`, `old_value`, `new_value`, `ip_address`, `timestamp`.

### 4.3. Tính khả dụng và Độ tin cậy (Availability & Reliability)
- **NFR-009 (Thời gian Hoạt động - Uptime):** Hệ thống đạt mức sẵn sàng tối thiểu **99.5%** trong khung giờ làm việc chính (07:00 - 23:00 hàng ngày).
- **NFR-010 (Sao lưu Dữ liệu Tự động):** Thiết lập cơ chế tự động sao lưu toàn bộ cơ sở dữ liệu MySQL (mysqldump / volume snapshot) hàng ngày vào lúc 02:00 sáng, lưu giữ tối thiểu 30 bản sao lưu gần nhất. Mục tiêu điểm phục hồi RPO < 24 giờ, mục tiêu thời gian phục hồi RTO < 2 giờ.

### 4.4. Trải nghiệm Người dùng và Tiếp cận (Usability & Accessibility)
- **NFR-011 (Tiêu chuẩn Tiếp cận WCAG 2.1 AA):** Giao diện đáp ứng độ tương phản màu tối thiểu 4.5:1 đối với văn bản thông thường; các thẻ ca làm việc bắt buộc có cả nhãn chữ/icon đi kèm màu sắc, không bao giờ dùng màu sắc đơn độc để biểu thị thông tin (hỗ trợ người mù màu).
- **NFR-012 (Hỗ trợ Tiếng Việt & Thiết bị):** Toàn bộ giao diện hiển thị đúng chuẩn ngữ pháp tiếng Việt có dấu, phông chữ hỗ trợ hoàn hảo bộ ký tự Unicode (Inter / Be Vietnam Pro). Giao diện hiển thị tốt trên Desktop (màn hình từ 1280px trở lên) và tương thích linh hoạt trên máy tính bảng, điện thoại di động (Mobile Responsive cho các tác vụ của Nhân viên).

---

## 5. USER STORIES VÀ TIÊU CHÍ CHẤP NHẬN (GIVEN / WHEN / THEN)

### US-01: Nhân viên thực hiện Check-in đầu ca làm việc
- **Là:** Nhân viên thông thường (`ROLE_EMPLOYEE`)
- **Tôi muốn:** Nhấn nút Check-in trên ứng dụng Web khi đến nơi làm việc
- **Để:** Hệ thống ghi nhận giờ bắt đầu làm việc của tôi một cách chính xác và minh bạch.

```gherkin
Kịch bản 1: Check-in thành công đúng giờ
  GIVEN Nhân viên "Nguyễn Văn An" đã đăng nhập vào hệ thống
  AND Hôm nay nhân viên có ca làm việc "Ca Sáng" (08:00 - 17:00) ở trạng thái PUBLISHED
  AND Nhân viên chưa thực hiện Check-in hôm nay
  WHEN Nhân viên nhấn nút "Check-in" trên màn hình Dashboard lúc 07:55
  THEN Hệ thống lưu bản ghi chấm công mới với check_in_time = 07:55, status = 'PRESENT', source = 'WEB_PORTAL'
  AND Nút "Check-in" chuyển thành trạng thái vô hiệu hóa, nút "Check-out" sẵn sàng hoạt động
  AND Màn hình hiển thị thông báo thành công: "Điểm danh vào ca thành công lúc 07:55"

Kịch bản 2: Check-in muộn quá thời gian ân hạn (Grace Period)
  GIVEN Nhân viên có ca làm việc "Ca Sáng" bắt đầu lúc 08:00
  AND Thời gian ân hạn cho phép là 5 phút (đến 08:05)
  WHEN Nhân viên nhấn nút "Check-in" lúc 08:18
  THEN Hệ thống lưu bản ghi chấm công với check_in_time = 08:18, status = 'LATE', late_minutes = 18
  AND Dashboard hiển thị cảnh báo nhẹ: "Bạn đã check-in muộn 18 phút"
```

---

### US-02: Trưởng bộ phận xếp ca tuần và phát hiện xung đột
- **Là:** Trưởng bộ phận (`ROLE_DEPT_MANAGER`)
- **Tôi muốn:** Kéo thả hoặc chọn gán ca cho nhân viên trên Bảng lịch tuần và được cảnh báo ngay nếu vi phạm
- **Để:** Đảm bảo lịch làm việc hợp lý, không trùng giờ và tuân thủ quy định nghỉ ngơi của người lao động.

```gherkin
Kịch bản 1: Cảnh báo vi phạm thời gian nghỉ giữa 2 ca liên tiếp (< 12 giờ)
  GIVEN Nhân viên "Trần Thị Bích" đã được xếp "Ca Chiều" (14:00 - 22:00) vào ngày Thứ Hai
  WHEN Trưởng bộ phận gán "Ca Sáng" (06:00 - 14:00) vào ngày Thứ Ba cho nhân viên này
  THEN Hệ thống hiển thị huy hiệu Cảnh báo màu vàng (WARNING - BR-006) tại ô ngày Thứ Ba
  AND Tooltip giải thích: "Khoảng cách nghỉ ngơi giữa 2 ca là 8 giờ (dưới mức tối thiểu quy định 12 giờ)"
  AND Cho phép Trưởng bộ phận xác nhận "Tiếp tục gán và nhập lý do đặc cách" hoặc "Hủy thao tác"

Kịch bản 2: Chặn hoàn toàn việc xếp trùng ca trong cùng một ngày (MANDATORY)
  GIVEN Nhân viên "Lê Văn Cường" đã có "Ca Sáng" (08:00 - 17:00) vào ngày Thứ Tư
  WHEN Trưởng bộ phận cố tình gán thêm "Ca Hành chính" (08:30 - 17:30) vào cùng ngày Thứ Tư cho nhân viên này
  THEN Hệ thống hiển thị hộp thoại Lỗi chặn màu đỏ (MANDATORY - BR-001): "Trùng giờ làm việc với ca đã xếp"
  AND Hệ thống từ chối lưu thay đổi và giữ nguyên ca ban đầu
```

---

### US-03: Trưởng bộ phận Công bố Lịch làm việc tuần
- **Là:** Trưởng bộ phận (`ROLE_DEPT_MANAGER`)
- **Tôi muốn:** Nhấn nút "Công bố lịch làm việc" cho tuần tới
- **Để:** Toàn bộ nhân viên trong bộ phận nhìn thấy lịch làm việc chính thức của mình.

```gherkin
Kịch bản 1: Công bố lịch tuần không còn lỗi chặn
  GIVEN Lịch làm việc tuần 42 của phòng "Kinh doanh" đang ở trạng thái DRAFT
  AND Không có bất kỳ lỗi chặn MANDATORY nào còn tồn đọng trong tuần
  WHEN Trưởng bộ phận nhấn nút "Công bố lịch tuần" và xác nhận tại hộp thoại
  THEN Trạng thái lịch chuyển thành PUBLISHED, version tăng thêm 1
  AND Toàn bộ các ca làm việc trong tuần trở nên khả dụng trên màn hình Lịch cá nhân của nhân viên phòng Kinh doanh
  AND Hệ thống ghi log kiểm toán: "Trưởng bộ phận A đã công bố lịch Tuần 42 cho phòng Kinh doanh"
```

---

### US-04: Nhân viên nộp đơn xin nghỉ phép năm
- **Là:** Nhân viên thông thường (`ROLE_EMPLOYEE`)
- **Tôi muốn:** Gửi đơn xin nghỉ phép năm từ ngày Thứ Năm đến Thứ Sáu
- **Để:** Được quản lý phê duyệt nghỉ có hưởng lương và hệ thống không xếp ca hoặc cảnh báo khi xếp ca.

```gherkin
Kịch bản 1: Nộp đơn nghỉ phép thành công khi đủ số dư
  GIVEN Nhân viên "Phạm Văn Dũng" có số dư phép năm khả dụng là 4.5 ngày
  WHEN Nhân viên nộp đơn xin nghỉ phép năm từ 20/10/2026 đến 21/10/2026 (tổng 2 ngày làm việc)
  THEN Hệ thống tạo bản ghi đơn nghỉ phép với trạng thái SUBMITTED
  AND Gửi thông báo đến Trưởng bộ phận phụ trách
  AND Số dư phép tạm giữ (pending) hiển thị là 2 ngày, số dư khả dụng còn 2.5 ngày

Kịch bản 2: Từ chối nộp đơn khi vượt quá số dư phép năm
  GIVEN Nhân viên chỉ còn 1 ngày phép năm khả dụng
  WHEN Nhân viên nộp đơn xin nghỉ phép năm 3 ngày liên tiếp
  THEN Hệ thống hiển thị thông báo lỗi: "Số ngày nghỉ vượt quá quỹ phép khả dụng hiện tại (1 ngày). Vui lòng chọn loại Nghỉ không lương hoặc điều chỉnh thời gian."
  AND Đơn không được tạo ở trạng thái SUBMITTED
```

---

### US-05: Nhân viên giải trình quên Check-out
- **Là:** Nhân viên thông thường (`ROLE_EMPLOYEE`)
- **Tôi muốn:** Gửi yêu cầu điều chỉnh giờ chấm công cho ngày hôm qua do quên bấm Check-out
- **Để:** Được tính đúng số giờ công thực tế sau khi Quản lý xác nhận.

```gherkin
Kịch bản 1: Gửi giải trình thành công và Quản lý phê duyệt
  GIVEN Bản ghi chấm công ngày hôm qua của nhân viên có check_in lúc 08:00 và check_out = NULL (status = MISSING_CHECKOUT)
  WHEN Nhân viên vào màn hình Chấm công cá nhân, chọn ngày hôm qua và nhấn "Gửi giải trình"
  AND Điền giờ check-out thực tế là 17:05 kèm lý do: "Máy tính sập nguồn cuối giờ nên quên quét web"
  THEN Hệ thống tạo bản ghi trong attendance_corrections ở trạng thái PENDING
  WHEN Trưởng bộ phận mở danh sách phê duyệt và nhấn "Chấp thuận"
  THEN Bản ghi chấm công gốc được cập nhật check_out_time = 17:05, status chuyển thành CORRECTED, actual_hours = 8.08
  AND Hệ thống lưu vết kiểm toán: "Người duyệt: Quản lý B, Lý do: Chấp thuận giải trình quên quét"
```

---

## 6. ĐỊNH NGHĨA PHẠM VI MVP VÀ HẬU MVP (MVP VS POST-MVP SCOPE)

Bảng dưới đây xác lập ranh giới tuyệt đối giữa giai đoạn MVP và các giai đoạn tiếp theo.

| Tính năng / Phân hệ | Giai đoạn MVP (Phải có) | Giai đoạn Post-MVP (Lộ trình sau) |
|:---|:---|:---|
| **Xác thực & Người dùng** | Đăng nhập/Đăng xuất JWT, BCrypt, RBAC 4 vai trò, Đổi mật khẩu lần đầu, Khóa tài khoản khi brute-force. | Đăng nhập một lần SSO (Google Workspace, Microsoft Azure AD, SAML2, OIDC). |
| **Quản lý Tổ chức & Nhân sự** | CRUD Hồ sơ nhân viên, Phòng ban cây phân cấp, Chức danh, Xóa mềm, Tìm kiếm, Lọc đa tiêu chí. | Quản lý hợp đồng lao động điện tử, file scan đính kèm, trường thông tin tùy biến (custom fields). |
| **Cấu hình Mẫu ca** | Mẫu ca tái sử dụng, ca hành chính, ca qua đêm, giờ nghỉ cố định, màu sắc hiển thị, định biên nhân sự min/max. | Mẫu ca làm việc linh hoạt (Flexi-time window), ca chia đoạn (Split shifts 2 buổi cách xa nhau). |
| **Xếp ca & Lịch tuần** | Ma trận lịch tuần (Nhân viên x Ngày), Gán đơn/hàng loạt, Sao chép tuần trước, Phát hiện xung đột (Mandatory & Warning), Quy trình Draft/Published, Khóa lạc quan (Optimistic Lock). | Đổi ca giữa 2 nhân viên (Shift Swap Request), Kéo thả thẻ ca trên lịch (Drag-and-Drop scheduling), Tự động gợi ý xếp ca bằng thuật toán (Auto-scheduling AI/Heuristic). |
| **Chấm công Thực tế** | Web Check-in / Check-out trên trình duyệt, Tính giờ công thực tế, tính giờ đêm, tính OT cơ bản, Cờ quên check-out, Đơn giải trình bổ sung công 1 cấp duyệt. | Đồng bộ máy chấm công vân tay/khuôn mặt, Chấm công định vị GPS trên di động, Chấm công quét mã QR động xoay vòng. |
| **Nghỉ phép & Lễ** | Cấu hình loại phép, Quản lý ngày lễ công ty, Theo dõi quỹ phép năm, Vòng đời nộp và duyệt đơn phép (1 hoặc 2 cấp duyệt), Đồng bộ hiển thị ngày nghỉ lên lịch tuần. | Chuyển số dư phép năm thừa sang năm sau (Leave carry-over rules), Tạm ứng ngày phép tương lai. |
| **Báo cáo & Thống kê** | Báo cáo điểm danh ngày, Báo cáo tổng hợp công tháng, Báo cáo đối chiếu Kế hoạch vs Thực tế, Xuất dữ liệu Excel (.xlsx) và CSV. | Báo cáo phân tích chi phí nhân công theo ca kíp, Xuất báo cáo định dạng PDF tùy biến mẫu, Biểu đồ phân tích nâng cao (Advanced BI Dashboard). |
| **Thông báo & Tương tác** | Thông báo trong ứng dụng (In-app Notification / Toast / Badge chuông). | Bắn thông báo qua Email (SMTP/SendGrid), Thông báo qua Telegram Bot / Zalo ZNS khi lịch tuần được công bố. |

---

## 7. CÂU HỎI MỞ CẦN XÁC NHẬN (OPEN QUESTIONS FOR USER REVIEW)

*Lưu ý: Theo Chính sách Tự chủ (Autonomy Policy), các đề xuất dưới đây đã được áp dụng làm phương án mặc định xuyên suốt tài liệu thiết kế để không làm gián đoạn tiến độ. Người dùng có thể xem xét và điều chỉnh sau khi quá trình thiết kế hoàn tất.*

| Mã | Câu hỏi Cần Xác nhận | Phương án Đề xuất của Chuyên gia (Đã áp dụng mặc định) | Lý do & Khuyến nghị |
|:---:|:---|:---|:---|
| **OQ-001** | Quy định làm tròn giờ làm thêm (Overtime Rounding): Làm tròn theo bước 15 phút, 30 phút hay tính chính xác theo từng phút? | **Đề xuất: Làm tròn theo bước 15 phút (Block of 15 minutes).** Thời gian làm thêm tối thiểu phải từ 15 phút trở lên mới được tính. Dưới 15 phút không tính OT; từ 15-29 phút tính 15 phút (0.25h); từ 30-44 phút tính 30 phút (0.5h). | Phù hợp nhất với tập quán quản lý nhân sự tại Việt Nam, tránh việc nhân viên nán lại 2-3 phút gây tranh cãi về chi phí tăng ca, đồng thời đơn giản hóa cho kế toán. |
| **OQ-002** | Quy tắc chuyển số dư phép năm cũ sang năm mới (Leave Carry-over): Có cho phép chuyển phép thừa sang quý 1 năm sau không? | **Đề xuất: Cho phép chuyển tối đa toàn bộ phép thừa sang sử dụng đến hết ngày 31/03 năm kế tiếp.** Sau 31/03, số dư phép cũ chưa dùng sẽ tự động hủy về 0. | Tuân thủ thông lệ chuẩn của Điều 113 Khoản 4 Bộ luật Lao động 2019 (Người sử dụng lao động có thể thỏa thuận với người lao động để nghỉ phép năm thành nhiều lần hoặc gộp tối đa 03 năm một lần). Hạn chót 31/03 là chuẩn mực của 90% doanh nghiệp Việt Nam. |
| **OQ-003** | Ngưỡng số ngày nghỉ phép kích hoạt luồng duyệt 2 cấp (Trưởng bộ phận -> HR Manager)? | **Đề xuất: Nghỉ từ 03 ngày làm việc liên tục trở lên.** Nghỉ từ 1 đến 2 ngày chỉ cần Trưởng bộ phận phê duyệt là có hiệu lực ngay. | Giảm tải thủ tục hành chính cho phòng Nhân sự đối với các kỳ nghỉ ngắn hạn thông thường, nhưng vẫn kiểm soát chặt chẽ các đợt vắng mặt dài hạn có thể ảnh hưởng đến vận hành. |
| **OQ-004** | Thời gian ân hạn đi muộn (Grace Period) cho phép đầu giờ là bao nhiêu phút? | **Đề xuất: 05 phút.** Ví dụ ca 08:00, nhân viên check-in đến 08:05:59 vẫn được tính là Đúng giờ (`PRESENT`). Từ 08:06:00 trở đi tính là Đi muộn (`LATE`) 6 phút. | Tạo sự linh hoạt văn minh cho nhân viên gặp sự cố thang máy, mạng internet đầu giờ mà không ảnh hưởng nghiêm trọng đến kỷ luật công ty. Tham số này được lưu trong `system_settings` để HR có thể sửa bất cứ lúc nào. |
| **OQ-005** | Nhân viên đi làm vào ngày nghỉ tuần hoặc ngày lễ mà không được phân ca trước thì xử lý thế nào? | **Đề xuất: Vẫn ghi nhận giờ Check-in/out thực tế với cờ `UNSCHEDULED_ATTENDANCE`, nhưng số giờ công chuyển sang trạng thái `PENDING_MANAGER_APPROVAL`.** Quản lý phải duyệt xác nhận làm việc đột xuất thì giờ đó mới được tính vào báo cáo công/OT. | Ngăn chặn việc nhân viên tự ý lên công ty vào ngày nghỉ/ngày lễ để nhận tiền tăng ca trái phép mà không có sự điều động trước của cấp quản lý. |

---
*Kết thúc Tài liệu 01.*
