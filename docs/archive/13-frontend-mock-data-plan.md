# TÀI LIỆU 13: KẾ HOẠCH DỮ LIỆU MẪU XÁC ĐỊNH (FRONTEND MOCK DATA PLAN)
**Dự án:** Employee Management System  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. NGUYÊN TẮC THIẾT KẾ DỮ LIỆU MẪU XÁC ĐỊNH (DETERMINISTIC MOCK DATA DESIGN)

Để đảm bảo nguyên mẫu Frontend hoạt động như một hệ thống hoàn chỉnh mà không cần Backend Spring Boot, dữ liệu mẫu phải thỏa mãn các nguyên tắc kiến trúc sau:

```
SƠ ĐỒ NEO DỮ LIỆU ĐỘNG THEO THỨ HAI TUẦN HIỆN TẠI (CURRENT MONDAY OFFSET)
                      [ THỜI ĐIỂM NGƯỜI DÙNG MỞ DEMO (new Date()) ]
                                            │
                                            ▼
                           Xác định mốc: CurrentMonday (T2 tuần này)
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
       TUẦN TRƯỚC (W-1)              TUẦN NÀY (W0)                 TUẦN SAU (W+1)
  [CurrentMonday - 7 ngày]          [CurrentMonday]           [CurrentMonday + 7 ngày]
  • Trạng thái: PUBLISHED           • Trạng thái: DRAFT       • Trạng thái: DRAFT
  • 100% ca đã chốt                 • Đầy đủ kịch bản xung đột• Chuẩn bị lịch mới
  • Phục vụ test 'Copy tuần'        • 'Hôm nay' luôn có ca    • Phục vụ test kiểm tra tràn tuần
```

### 1.1. Cơ Chế Neo Thời Gian Động (Dynamic Monday Offset Anchor)
1. **Không Hard-code Ngày Tuyệt Đối:** Nếu dữ liệu mẫu gắn cứng ngày `12/10/2026`, khi người kiểm thử mở ứng dụng vào bất kỳ tháng nào khác, nút "Tuần này" và "Hôm nay" sẽ trỏ vào một tuần trống trơn.
2. **Công Thức Tính Toán:**
   ```typescript
   // Lấy mốc Thứ Hai tuần hiện tại
   const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
   
   // Hàm tiện ích sinh ngày ISO YYYY-MM-DD
   export const getOffsetDate = (daysOffset: number): string => {
     return format(addDays(baseMonday, daysOffset), 'yyyy-MM-dd');
   };
   // Ví dụ:
   // getOffsetDate(0)  -> Thứ Hai tuần này
   // getOffsetDate(1)  -> Thứ Ba tuần này
   // getOffsetDate(6)  -> Chủ Nhật tuần này
   // getOffsetDate(-7) -> Thứ Hai tuần trước
   // getOffsetDate(7)  -> Thứ Hai tuần sau
   ```
3. **Phạm Vi Dữ Liệu Khởi Tạo (Seed Coverage):**
   - **Tuần trước ($W-1$, offset -7 đến -1):** 100% các ô đã được xếp ca, trạng thái `PUBLISHED`, phục vụ tính năng "Sao chép từ tuần trước".
   - **Tuần này ($W0$, offset 0 đến 6):** Lịch đang ở trạng thái `DRAFT` (hoặc có thể test công bố), chứa đầy đủ 25 nhân sự với các tình huống nghiệp vụ và xung đột mẫu.
   - **Tuần sau ($W+1$, offset 7 đến 13):** Một số ca đã được xếp thử nghiệm để kiểm tra ranh giới tràn ca đêm từ Chủ Nhật tuần này sang Thứ Hai tuần sau.

---

## 2. QUY CHUẨN ĐẶT TÊN VÀ ĐỊNH DANH (NAMING & ID CONSISTENCY RULES)

1. **Họ và Tên Nhân Sự:** Sử dụng 100% tên người Việt Nam thực tế, phân bổ cân bằng giới tính, chức vụ và loại hình hợp đồng.
2. **Quy tắc Định danh (ID Ranges):**
   - **Phòng ban (`departments`):** ID từ `1` đến `5` (Mã: `DEPT-01` đến `DEPT-05`).
   - **Chức danh (`positions`):** ID từ `1` đến `8` (Mã: `POS-01` đến `POS-08`).
   - **Mẫu ca làm việc (`work_shifts`):** ID từ `1` đến `4` (Mã: `CA-SANG`, `CA-SANG-SOM`, `CA-CHIEU`, `CA-DEM`).
   - **Nhân viên (`employees`):** ID từ `1` đến `25` (Mã: `EMP-001` đến `EMP-025`).
   - **Bảng lịch tuần (`schedules`):** ID `101` (Tuần trước), `102` (Tuần này), `103` (Tuần sau).
   - **Bản ghi phân ca (`shift_assignments`):** ID từ `1001` trở lên.
   - **Bản ghi chấm công (`attendance_records`):** ID từ `5001` trở lên.
   - **Đơn xin nghỉ phép (`leave_requests`):** ID từ `7001` trở lên.

---

## 3. DANH MỤC DỮ LIỆU CỐT LÕI (MASTER SEED DATA)

### 3.1. Danh Mục 5 Phòng Ban (`departments.mock.ts`)
| ID | Mã Phòng Ban | Tên Phòng Ban | ID Trưởng Phòng (`managerId`) | Mô Tả Trách Nhiệm |
|:---:|:---|:---|:---:|:---|
| `1` | `DEPT-BGD` | Ban Giám đốc & Điều hành | `1` (EMP-001) | Lãnh đạo chung công ty |
| `2` | `DEPT-OPS` | **Phòng Vận hành Dịch vụ (Trọng tâm Demo)** | `1` (EMP-001) | Trực ca 24/7, vận hành hệ thống khách hàng |
| `3` | `DEPT-TECH`| Phòng Kỹ thuật & Công nghệ | `6` (EMP-006) | Phát triển phần mềm & hạ tầng máy chủ |
| `4` | `DEPT-HR` | Phòng Hành chính - Nhân sự | `11` (EMP-011) | Quản trị nhân sự, chính sách lao động, tuyển dụng |
| `5` | `DEPT-ACC` | Phòng Kế toán & Tài chính | `16` (EMP-016) | Quản lý dòng tiền, thuế, kế toán tiền lương |

---

### 3.2. Danh Mục 8 Chức Danh (`positions.mock.ts`)
| ID | Mã Chức Danh | Tên Chức Danh Tiếng Việt | Phòng Ban Tiêu Biểu |
|:---:|:---|:---|:---|
| `1` | `POS-LEAD` | Trưởng nhóm Ca trực (Shift Leader) | Phòng Vận hành |
| `2` | `POS-TECH` | Kỹ thuật viên Vận hành (Ops Specialist)| Phòng Vận hành |
| `3` | `POS-AGENT`| Nhân viên Trực tổng đài (Service Agent)| Phòng Vận hành |
| `4` | `POS-DEV` | Lập trình viên Phần mềm (Software Dev) | Phòng Kỹ thuật |
| `5` | `POS-HR` | Chuyên viên Nhân sự Tổng hợp (HR Officer)| Phòng Nhân sự |
| `6` | `POS-ACC` | Kế toán viên Tổng hợp (Accountant) | Phòng Kế toán |
| `7` | `POS-MGR` | Trưởng phòng Bộ phận (Department Head) | Toàn công ty |
| `8` | `POS-INTERN`| Thực tập sinh (Intern) | Toàn công ty |

---

### 3.3. Danh Mục 4 Mẫu Ca Làm Việc Chuẩn (`shift-templates.mock.ts`)
| ID | Mã Ca | Tên Ca | Bắt Đầu | Kết Thúc | Nghỉ (p) | Net Hours | Qua Đêm? | Định Biên | Màu Nền (`colorCode`) | Màu Chữ |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `1` | `CA-SANG` | Ca Sáng Tiêu Chuẩn | `08:00` | `17:00` | 60 | **8.0h** | `false` | 2 - 6 người | `#E6F7FF` | `#0958D9` |
| `2` | `CA-SANG-SOM`| Ca Sáng Sớm | `06:00` | `14:00` | 0 | **8.0h** | `false` | 1 - 4 người | `#E6FFFB` | `#08979C` |
| `3` | `CA-CHIEU` | Ca Chiều | `14:00` | `22:00` | 0 | **8.0h** | `false` | 2 - 6 người | `#FFF7E6` | `#D46B08` |
| `4` | `CA-DEM` | Ca Đêm Qua Đêm (+1) | `22:00` | `06:00` | 0 | **8.0h** | `true` | 1 - 3 người | `#FFF1F0` | `#CF1322` |

---

### 3.4. Danh Mục Ngày Lễ Công Ty Trong Kỳ (`holidays.mock.ts`)
| ID | Ngày Diễn Ra (`holidayDate`) | Tên Ngày Lễ | Hưởng Lương? |
|:---:|:---|:---|:---:|
| `1` | `getOffsetDate(6)` (Chủ Nhật tuần này) | Ngày Hội truyền thống Doanh nghiệp | `true` |
| `2` | `getOffsetDate(-43)` | Ngày Quốc khánh Việt Nam (02/09) | `true` |

---

## 4. DANH SÁCH 25 NHÂN VIÊN HẠT GIỐNG (`employees.mock.ts`)

*Toàn bộ 25 nhân sự có đầy đủ mã nhân viên, chức vụ, phòng ban và trạng thái làm việc:*

| ID | Mã NV | Họ và Tên | Giới Tính | Phòng Ban | Chức Danh | Loại Hợp Đồng | Trạng Thái | Ngày Vào Làm | Vai Trò Demo |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---:|:---|
| `1` | `EMP-001` | Nguyễn Văn An | Nam | Vận hành | Trưởng nhóm Ca trực | `FULL_TIME` | `OFFICIAL` | 01/03/2022 | Dept Manager |
| `2` | `EMP-002` | Trần Thị Bích | Nữ | Vận hành | Kỹ thuật viên | `FULL_TIME` | `OFFICIAL` | 15/05/2023 | Employee |
| `3` | `EMP-003` | Lê Văn Cường | Nam | Vận hành | Nhân viên Trực tổng đài | `FULL_TIME` | `PROBATION`| 01/09/2026 | Employee |
| `4` | `EMP-004` | Phạm Văn Dũng | Nam | Vận hành | Kỹ thuật viên | `FULL_TIME` | `OFFICIAL` | 10/10/2022 | Employee |
| `5` | `EMP-005` | Hoàng Thị Mai | Nữ | Vận hành | Nhân viên Trực tổng đài | `PART_TIME` | `OFFICIAL` | 01/01/2024 | Employee |
| `6` | `EMP-006` | Đỗ Văn Nam | Nam | Kỹ thuật | Trưởng phòng Kỹ thuật | `FULL_TIME` | `OFFICIAL` | 01/06/2021 | Dept Manager |
| `7` | `EMP-007` | Vũ Thị Lan | Nữ | Kỹ thuật | Lập trình viên | `FULL_TIME` | `OFFICIAL` | 15/02/2023 | Employee |
| `8` | `EMP-008` | Ngô Văn Hùng | Nam | Kỹ thuật | Lập trình viên | `FULL_TIME` | `OFFICIAL` | 01/04/2023 | Employee |
| `9` | `EMP-009` | Đinh Thị Hương | Nữ | Kỹ thuật | Lập trình viên | `FULL_TIME` | `PROBATION`| 15/08/2026 | Employee |
| `10`| `EMP-010` | Bùi Văn Tuấn | Nam | Kỹ thuật | Lập trình viên | `CONTRACTOR`| `OFFICIAL` | 01/07/2024 | Employee |
| `11`| `EMP-011` | Lê Thị Thanh | Nữ | Nhân sự | Trưởng phòng Nhân sự | `FULL_TIME` | `OFFICIAL` | 10/11/2020 | HR Manager |
| `12`| `EMP-012` | Phan Văn Bình | Nam | Nhân sự | Chuyên viên Nhân sự | `FULL_TIME` | `OFFICIAL` | 01/08/2022 | Employee |
| `13`| `EMP-013` | Trịnh Thị Ngọc | Nữ | Nhân sự | Chuyên viên Tuyển dụng | `FULL_TIME` | `OFFICIAL` | 15/03/2023 | Employee |
| `14`| `EMP-014` | Mai Văn Kiên | Nam | Nhân sự | Chuyên viên C&B | `FULL_TIME` | `OFFICIAL` | 01/05/2023 | Employee |
| `15`| `EMP-015` | Cao Thị Thảo | Nữ | Nhân sự | Thực tập sinh | `INTERN` | `PROBATION`| 01/10/2026 | Employee |
| `16`| `EMP-016` | Vũ Đình Trọng | Nam | Kế toán | Trưởng phòng Kế toán | `FULL_TIME` | `OFFICIAL` | 01/01/2020 | Dept Manager |
| `17`| `EMP-017` | Lương Thị Huệ | Nữ | Kế toán | Kế toán viên Tổng hợp | `FULL_TIME` | `OFFICIAL` | 15/09/2022 | Employee |
| `18`| `EMP-018` | Tạ Văn Long | Nam | Kế toán | Kế toán viên Thanh toán | `FULL_TIME` | `OFFICIAL` | 01/11/2023 | Employee |
| `19`| `EMP-019` | Đặng Thị Yến | Nữ | Kế toán | Kế toán viên Nội bộ | `FULL_TIME` | `OFFICIAL` | 01/02/2024 | Employee |
| `20`| `EMP-020` | Hà Văn Quang | Nam | Kế toán | Thực tập sinh Kế toán | `INTERN` | `PROBATION`| 15/09/2026 | Employee |
| `21`| `EMP-021` | Trần Đình Khoa | Nam | Ban Giám đốc| Giám đốc Điều hành (CEO)| `FULL_TIME` | `OFFICIAL` | 01/01/2019 | Admin |
| `22`| `EMP-022` | Nguyễn Thu Hà | Nữ | Ban Giám đốc| Trợ lý Tổng Giám đốc | `FULL_TIME` | `OFFICIAL` | 01/06/2021 | Employee |
| `23`| `EMP-023` | Dương Văn Phúc| Nam | Vận hành | Nhân viên Trực tổng đài | `FULL_TIME` | `RESIGNED` | 15/04/2022 | (Đã thôi việc) |
| `24`| `EMP-024` | Lâm Thị Thu | Nữ | Vận hành | Kỹ thuật viên | `FULL_TIME` | `ON_LEAVE` | 01/08/2022 | (Nghỉ thai sản)|
| `25`| `EMP-025` | Trương Văn Hải| Nam | Vận hành | Kỹ thuật viên | `FULL_TIME` | `OFFICIAL` | 01/02/2024 | Employee |

---

## 5. BẢNG HẠT GIỐNG PHÂN CA TUẦN HIỆN TẠI VÀ DANH MỤC XUNG ĐỘT (SEED MATRIX)

Bảng dưới đây mô tả chính xác lịch làm việc tuần này ($W0$, từ Thứ Hai `getOffsetDate(0)` đến Chủ Nhật `getOffsetDate(6)`) của các nhân sự trọng điểm phòng Vận hành, thiết lập sẵn **toàn bộ 9 kịch bản kiểm thử**:

| Nhân Viên | T2 (Offset 0) | T3 (Offset 1) | T4 (Offset 2) | T5 (Offset 3) | T6 (Offset 4) | T7 (Offset 5) | CN (Offset 6) | Tình Huống Kỹ Thuật & Xung Đột Sinh Ra |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **Nguyễn Văn An**<br>(EMP-001) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | --- | --- | **Kịch bản 1: Lịch chuẩn hành chính.**<br>Tổng 40.0h/48h. Không có cảnh báo nào. |
| **Trần Thị Bích**<br>(EMP-002) | **Ca Chiều**<br>(14:00-22:00) | **Ca Sáng Sớm**⚠️<br>(06:00-14:00) | **Ca Chiều**<br>(14:00-22:00) | **🏖️ PHÉP NĂM**<br>(Approved) | **Ca Chiều**<br>(14:00-22:00) | **Ca Chiều**<br>(14:00-22:00) | --- | **Kịch bản 2 & 3:**<br>• T3: Nghỉ giữa ca chỉ có 8.0h (< 11.0h) $\rightarrow$ Kích hoạt `BR-006` (WARNING).<br>• T5: Đơn nghỉ phép năm đã duyệt $\rightarrow$ Thẻ Phép năm màu xanh lá. |
| **Lê Văn Cường**<br>(EMP-003) | --- | **Ca Đêm (+1)**<br>(22:00-06:00) | (Nghỉ sau đêm)| **Ca Đêm (+1)**<br>(22:00-06:00) | (Nghỉ sau đêm)| **Ca Đêm (+1)**<br>(22:00-06:00) | (Nghỉ bù) | **Kịch bản 4: Ca làm việc qua đêm.**<br>Thẻ ca hiển thị nhãn `Ca Đêm (+1 ngày)` tại T3, T5, T7. Tổng 24.0h tính vào tuần này. |
| **Phạm Văn Dũng**<br>(EMP-004) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**<br>(08:00-17:00) | **Ca Sáng**⚠️<br>(08:00-17:00) | **Kịch bản 5 & 6:**<br>• Làm cả 7 ngày: $7 \times 8 = 56.0$ giờ $\rightarrow$ Kích hoạt `BR-004` (Vượt 48h/tuần).<br>• CN rơi vào Ngày lễ công ty $\rightarrow$ Kích hoạt `BR-007` (Làm việc ngày lễ). |
| **Hoàng Thị Mai**<br>(EMP-005) | **Ca Chiều**<br>(14:00-22:00) | **Ca Chiều**<br>(14:00-22:00) | **Ca Chiều**<br>(14:00-22:00) | --- | --- | **Ca Chiều**<br>(14:00-22:00) | **Ca Chiều**<br>(14:00-22:00) | **Kịch bản 7: Nhân sự Part-time.**<br>Tổng 40.0h, làm việc xoay vòng cuối tuần. |
| **Dương Văn Phúc**<br>(EMP-023) | ⛔ (Khóa) | ⛔ (Khóa) | ⛔ (Khóa) | ⛔ (Khóa) | ⛔ (Khóa) | ⛔ (Khóa) | ⛔ (Khóa) | **Kịch bản 8: Nhân viên đã thôi việc.**<br>Kích hoạt `BR-002` (MANDATORY). Toàn bộ ô bị khóa không cho gán ca. |
| **Trương Văn Hải**<br>(EMP-025) | --- | --- | --- | **Ca Chiều**<br>(14:00-22:00) | **Ca Chiều**<br>(14:00-22:00) | --- | **Ca Đêm (+1)**<br>(22:00-06:00) | **Kịch bản 9: Tràn ca đêm Chủ Nhật sang Thứ Hai tuần sau.**<br>Ca đêm CN kết thúc lúc 06:00 sáng Thứ Hai tuần 43 $\rightarrow$ Kiểm tra ranh giới tuần. |

---

## 6. DANH MỤC ĐƠN NGHỈ PHÉP & BẢN GHI CHẤM CÔNG HẠT GIỐNG

### 6.1. Danh Sách Đơn Xin Nghỉ Phép Mẫu (`leaves.mock.ts`)
1. **Đơn phép đã duyệt (Approved):**
   - Mã đơn: `LEAVE-7001`
   - Nhân viên: Trần Thị Bích (EMP-002)
   - Loại phép: Phép năm (`ANNUAL_LEAVE`, có hưởng lương)
   - Thời gian: `getOffsetDate(3)` (Thứ Năm tuần này) - 1.0 ngày
   - Trạng thái: `APPROVED` (Đã duyệt bởi Quản lý Nguyễn Văn An)
   - Tác động: Hiển thị thẻ màu xanh lá `[🏖️ PHÉP NĂM]` trên ô Thứ Năm của Trần Thị Bích.
2. **Đơn phép đang chờ duyệt (Pending):**
   - Mã đơn: `LEAVE-7002`
   - Nhân viên: Hoàng Thị Mai (EMP-005)
   - Loại phép: Nghỉ việc riêng hưởng lương (`COMPASSIONATE_LEAVE`)
   - Thời gian: `getOffsetDate(10)` (Thứ Năm tuần sau) - 1.0 ngày
   - Trạng thái: `SUBMITTED` (Chờ duyệt)
   - Tác động: Hiển thị trong Widget duyệt đơn nhanh trên Dashboard SCR-02.

### 6.2. Danh Sách Bản Ghi Chấm Công Mẫu Đối Chiếu (`attendance.mock.ts`)
1. **Bản ghi Check-in đúng giờ hôm nay:**
   - Nhân viên: Nguyễn Văn An (EMP-001) - Ngày: Hôm nay
   - Ca gán: Ca Sáng (08:00 - 17:00)
   - `checkInTime`: Hôm nay lúc `07:55:12` | `lateMinutes`: 0 | Trạng thái: `PRESENT`.
2. **Bản ghi Quên Check-out (Missing Check-out):**
   - Nhân viên: Lê Văn Cường (EMP-003) - Ngày: Hôm qua
   - Ca gán: Ca Hành chính
   - `checkInTime`: Hôm qua lúc `08:02:00` | `checkOutTime`: `null` | Trạng thái: `MISSING_CHECKOUT`.
   - Tác động: Kích hoạt nút "Gửi giải trình bổ sung công" trên Dashboard và SCR-08.

---

## 7. CƠ CHẾ KHÔI PHỤC DỮ LIỆU DEMO (RESET DEMO DATA ENGINE)

1. **Khởi Tạo Lần Đầu:** Khi ứng dụng khởi chạy lần đầu tiên, nếu trong `localStorage` chưa tồn tại key `EMS_SCHEDULE_STATE_V1`, hệ thống tự động chạy script seed dữ liệu và nạp toàn bộ danh mục vào bộ nhớ.
2. **Lưu Trữ Đồng Bộ:** Mọi thao tác thêm ca, sửa ca, xóa ca, công bố lịch đều được lưu tự động vào `localStorage` qua middleware của Zustand store.
3. **Nút Khôi Phục (Reset Demo Data):**
   - Vị trí: Đặt tại góc trái Footer của Bảng lịch tuần SCR-11 và trang Cài đặt SCR-16.
   - Hành vi khi click:
     ```typescript
     export const resetDemoData = () => {
       localStorage.removeItem('EMS_SCHEDULE_STATE_V1');
       localStorage.removeItem('EMS_SETTINGS_STATE_V1');
       window.location.reload(); // Nạp lại dữ liệu hạt giống ban đầu tức thì
     };
     ```
   - Đảm bảo người dùng có thể thoải mái thử nghiệm gán ca, gây xung đột lỗi, xóa lịch và sau đó đưa hệ thống về trạng thái demo hoàn hảo chỉ với **1 cú click**.

---
*Kết thúc Tài liệu 13.*
