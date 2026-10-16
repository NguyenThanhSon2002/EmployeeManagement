# TÀI LIỆU 16: MA TRẬN TRUY XUẤT NGUỒN GỐC TOÀN DIỆN (FRONTEND TRACEABILITY MATRIX)
**Dự án:** Employee Management System  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC TRUY XUẤT (TRACEABILITY PRINCIPLES)

Tài liệu này cung cấp ma trận ánh xạ 2 chiều (Bidirectional Traceability) từ mọi Yêu cầu Nghiệp vụ (FR-001..FR-033), Quy tắc Nghiệp vụ Phân ca (BR-001..BR-018), và Màn hình Giao diện (SCR-01..SCR-17) từ các tài liệu nền tảng (`docs/01`, `docs/02`, `docs/07`) tới các thành phần phần mềm cụ thể của Frontend:
1. **Component React:** Thành phần giao diện chịu trách nhiệm hiển thị và tương tác.
2. **Store Slice:** Lát cắt trạng thái quản lý dữ liệu trong Zustand.
3. **Util Function:** Hàm xử lý nghiệp vụ thuần túy (Pure Function).
4. **Test Case ID:** Ca kiểm thử tương ứng trong Vitest hoặc Manual QA Checklist (`docs/14`).
5. **Roadmap Stage:** Giai đoạn triển khai mã nguồn (`docs/15`).

---

## 2. MA TRẬN TRUY XUẤT MÀN HÌNH GIAO DIỆN (SCREEN TRACEABILITY MATRIX - SCR)

| Mã Màn Hình | Tên Màn Hình Tiếng Việt | Component(s) Chính | Store Slice(s) Liên Quan | Util Function(s) Áp Dụng | Test Case ID | Roadmap Stage |
|:---:|:---|:---|:---|:---|:---|:---:|
| **SCR-01** | Đăng nhập hệ thống (Login) | `<LoginPage />`, `<LoginForm />` | `useAuthStore` | `format.utils.ts` | `TC-QA-01` | Stage A |
| **SCR-02** | Bảng điều khiển Tổng quan | `<DashboardPage />`, `<QuickAttendanceCard />`, `<TrendBarChart />` | `useAuthStore`, `useAttendanceStore`, `useLeaveStore` | `date.utils.ts` | `TC-QA-02` | Stage C |
| **SCR-03** | Danh sách Nhân viên | `<EmployeeListPage />`, `<Table />`, `<Input />` | `useEmployeeStore` | `format.utils.ts`, `useDebounce` | `TC-QA-03` | Stage C |
| **SCR-04** | Thêm mới / Sửa Nhân viên | `<EmployeeFormModal />`, `<Dialog />` | `useEmployeeStore` | `format.utils.ts` (validate phone/email) | `TC-QA-04` | Stage C |
| **SCR-05** | Chi tiết Hồ sơ Nhân viên (4 Tabs)| `<EmployeeDetailPage />`, `<Tabs />`, `<MonthViewGrid />` | `useEmployeeStore`, `useScheduleStore`, `useAttendanceStore` | `schedule-calc.utils.ts` | `TC-QA-05` | Stage C |
| **SCR-06** | Quản lý Phòng ban | `<DepartmentsPage />`, `<DepartmentTreeView />` | `useEmployeeStore` | `format.utils.ts` | `TC-QA-06` | Stage C |
| **SCR-07** | Quản lý Chức danh | `<PositionsPage />`, `<PositionTable />` | `useEmployeeStore` | `format.utils.ts` | `TC-QA-07` | Stage C |
| **SCR-08** | Tổng quan Bảng Chấm công | `<AttendanceOverviewPage />`, `<AttendanceTable />` | `useAttendanceStore` | `date.utils.ts`, `csv-exporter.utils.ts` | `TC-QA-08` | Stage D |
| **SCR-09** | Chi tiết & Giải trình Chấm công | `<AttendanceCorrectionModal />` | `useAttendanceStore` | `date.utils.ts` | `TC-QA-09` | Stage D |
| **SCR-10** | Cấu hình Mẫu ca Làm việc | `<ShiftTemplatesPage />`, `<ShiftTemplateCard />`, `<ShiftFormModal />` | `useScheduleStore` | `schedule-calc.utils.ts` | `TC-QA-10` | Stage D |
| **SCR-11** | **Bảng Lịch Làm Việc Tuần (Core)**| `<SchedulePage />`, `<WeeklyGrid />`, `<ScheduleToolbar />`, `<GridHeader />`, `<EmployeeRow />`, `<ScheduleCell />`, `<ShiftCard />`, `<ScheduleSummaryCards />` | `useScheduleStore`, `useEmployeeStore`, `useSettingsStore` | `date.utils.ts`, `schedule-calc.utils.ts`, `conflict-detector.utils.ts`, `csv-exporter.utils.ts` | `TC-INT-01` đến `TC-INT-08`, `TC-QA-11` | **Stage B (B1..B9)** |
| **SCR-12** | **Gán Ca & Điều Chỉnh Phân Ca** | `<AssignShiftDrawer />`, `<BulkAssignDialog />`, `<ConflictNoticeModal />` | `useScheduleStore`, `useSettingsStore` | `conflict-detector.utils.ts`, `schedule-calc.utils.ts` | `TC-INT-02`, `TC-INT-03`, `TC-INT-04` | **Stage B (B2, B3)** |
| **SCR-13** | Danh sách Đơn xin Nghỉ phép | `<LeaveRequestsPage />`, `<LeaveTable />` | `useLeaveStore` | `date.utils.ts` | `TC-QA-13` | Stage D |
| **SCR-14** | Chi tiết & Phê duyệt Nghỉ phép | `<LeaveApprovalModal />`, `<Timeline />` | `useLeaveStore`, `useScheduleStore` (Cross-sync) | `date.utils.ts` | `TC-QA-14` | Stage D |
| **SCR-15** | Báo cáo & Thống kê Giờ công | `<ReportsPage />`, `<ScheduledVsActualTable />` | `useAttendanceStore`, `useScheduleStore` | `csv-exporter.utils.ts`, `schedule-calc.utils.ts` | `TC-QA-15` | Stage D |
| **SCR-16** | Tài khoản, Phân quyền & Cài đặt | `<SettingsPage />`, `<PolicyThresholdsForm />` | `useSettingsStore`, `useAuthStore` | `format.utils.ts` | `TC-QA-16` | Stage C |
| **SCR-17** | Hồ sơ Cá nhân & Lịch của tôi | `<PersonalProfilePage />`, `<PersonalWeekList />` | `useAuthStore`, `useScheduleStore` | `date.utils.ts` | `TC-QA-17` | Stage C |

---

## 3. MA TRẬN TRUY XUẤT YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

| Mã FR | Tên Yêu Cầu Chức Năng (Tài liệu 01) | Component(s) Chịu Trách Nhiệm | Store Slice(s) | Util Function(s) | Test Case ID | Stage |
|:---:|:---|:---|:---|:---|:---:|:---:|
| **FR-001** | Dashboard phân theo 3 vai trò | `<DashboardPage />`, `<RoleSwitcher />` | `useAuthStore` | `date.utils.ts` | `TC-QA-02` | Stage C |
| **FR-002** | Biểu đồ xu hướng đi làm 7 ngày | `<TrendBarChart />` (SVG pure) | `useAttendanceStore` | `date.utils.ts` | `TC-QA-02` | Stage C |
| **FR-003** | Widget phê duyệt đơn nhanh | `<QuickApprovalCard />` | `useLeaveStore`, `useAttendanceStore` | - | `TC-QA-02` | Stage C |
| **FR-004** | Danh sách nhân viên phân trang | `<EmployeeListPage />` | `useEmployeeStore` | `useDebounce` | `TC-QA-03` | Stage C |
| **FR-005** | Thêm mới và cập nhật nhân viên | `<EmployeeFormModal />` | `useEmployeeStore` | `format.utils.ts` | `TC-QA-04` | Stage C |
| **FR-006** | Xóa mềm & khôi phục nhân viên | `<EmployeeActionMenu />` | `useEmployeeStore` | - | `TC-QA-03` | Stage C |
| **FR-007** | Xem chi tiết hồ sơ 4 tabs | `<EmployeeDetailPage />` | `useEmployeeStore` | `date.utils.ts` | `TC-QA-05` | Stage C |
| **FR-008** | Cơ cấu phòng ban cây phân cấp | `<DepartmentTreeView />` | `useEmployeeStore` | - | `TC-QA-06` | Stage C |
| **FR-009** | Ngăn chặn vòng lặp phòng ban | `<DepartmentFormModal />` | `useEmployeeStore` | `validateHierarchy()` | `TC-QA-06` | Stage C |
| **FR-010** | Ràng buộc khi đóng phòng ban | `<DepartmentDeleteModal />` | `useEmployeeStore` | - | `TC-QA-06` | Stage C |
| **FR-011** | Danh mục chức danh CRUD | `<PositionsPage />` | `useEmployeeStore` | - | `TC-QA-07` | Stage C |
| **FR-012** | Web Check-in / Check-out | `<QuickAttendanceCard />`, `<Topbar />` | `useAttendanceStore` | `date.utils.ts` | `TC-INT-01` | Stage C |
| **FR-013** | Tính số giờ công thực tế tự động | `<AttendanceTable />` | `useAttendanceStore` | `schedule-calc.utils.ts` | `TC-CALC-01` | Stage A |
| **FR-014** | Xử lý quên Check-out | `<AttendanceStatusBadge />` | `useAttendanceStore` | `date.utils.ts` | `TC-QA-08` | Stage D |
| **FR-015** | Giải trình điều chỉnh chấm công | `<AttendanceCorrectionModal />` | `useAttendanceStore` | - | `TC-QA-09` | Stage D |
| **FR-016** | Cấu hình Mẫu ca làm việc | `<ShiftTemplatesPage />` | `useScheduleStore` | `schedule-calc.utils.ts` | `TC-QA-10` | Stage D |
| **FR-017** | **Bảng Lịch tuần Ma trận (Core)**| `<WeeklyGrid />`, `<ScheduleCell />` | `useScheduleStore` | `schedule-calc.utils.ts` | `TC-INT-01` | **Stage B** |
| **FR-018** | **Thao tác Gán ca & Bulk Assign** | `<AssignShiftDrawer />`, `<BulkAssignDialog />` | `useScheduleStore` | `conflict-detector.utils.ts` | `TC-INT-02` | **Stage B** |
| **FR-019** | **Cơ chế Phát hiện Xung đột Tức thì**| `<ConflictNoticeModal />`, `<ShiftCard />` | `useScheduleStore`, `useSettingsStore` | `conflict-detector.utils.ts` | `TC-INT-03` | **Stage B** |
| **FR-020** | **Vòng đời Lịch Draft & Published**| `<ScheduleToolbar />`, `<PublishConfirmDialog />` | `useScheduleStore` | - | `TC-INT-06` | **Stage B** |
| **FR-021** | Cấu hình loại phép | `<LeaveTypesList />` | `useLeaveStore` | - | `TC-QA-13` | Stage D |
| **FR-022** | Quản lý Quỹ phép & Số dư năm | `<LeaveBalanceCard />` | `useLeaveStore` | `calcRemainingLeave()` | `TC-QA-13` | Stage D |
| **FR-023** | Vòng đời Đơn xin nghỉ phép | `<LeaveRequestsPage />`, `<LeaveRequestModal />` | `useLeaveStore` | `date.utils.ts` | `TC-QA-13` | Stage D |
| **FR-024** | Phê duyệt phân cấp 2 cấp | `<LeaveApprovalModal />` | `useLeaveStore` | - | `TC-QA-14` | Stage D |
| **FR-025** | Quản lý Ngày lễ công ty | `<HolidaysList />`, `<GridHeader />` | `useScheduleStore` | `date.utils.ts` | `TC-QA-11` | Stage B |
| **FR-026** | Báo cáo Điểm danh hàng ngày | `<DailyAttendanceReport />` | `useAttendanceStore` | `date.utils.ts` | `TC-QA-15` | Stage D |
| **FR-027** | Báo cáo Tổng hợp công tháng | `<MonthlyAttendanceReport />` | `useAttendanceStore` | `schedule-calc.utils.ts` | `TC-QA-15` | Stage D |
| **FR-028** | Báo cáo Scheduled vs Actual | `<ScheduledVsActualTable />` | `useAttendanceStore`, `useScheduleStore` | `schedule-calc.utils.ts` | `TC-QA-15` | Stage D |
| **FR-029** | Xuất dữ liệu CSV UTF-8 BOM | `<ExportCsvButton />` | `useScheduleStore` | `csv-exporter.utils.ts` | `TC-CSV-01` | Stage A, B |
| **FR-030** | Xác thực Đăng nhập & Đăng xuất | `<LoginPage />`, `<Topbar />` | `useAuthStore` | - | `TC-QA-01` | Stage A |
| **FR-031** | Đổi mật khẩu cá nhân | `<ChangePasswordModal />` | `useAuthStore` | - | `TC-QA-16` | Stage C |
| **FR-032** | Chống Brute-force & Khóa login | `<LoginForm />` | `useAuthStore` | - | `TC-QA-01` | Stage A |
| **FR-033** | Quản lý tài khoản & phân quyền | `<UserAccountsList />` | `useAuthStore` | - | `TC-QA-16` | Stage C |

---

## 4. MA TRẬN TRUY XUẤT QUY TẮC NGHIỆP VỤ PHÂN CA (BUSINESS RULES - BR)

| Mã BR | Tên Quy Tắc Nghiệp Vụ (Tài liệu 07) | Phân Loại | Hàm Xử Lý Kiểm Tra (Pure Util) | Component Giao Diện Hiển Thị | Test Case ID | Stage |
|:---:|:---|:---:|:---|:---|:---:|:---:|
| **BR-001** | Trùng ca làm việc của 1 nhân viên | **MANDATORY** | `checkShiftOverlap()` trong `conflict-detector.utils.ts` | Chặn lưu trong `<AssignShiftDrawer />`; Banner đỏ; Chấm đỏ trên `<ShiftCard />`. | `TC-OVERLAP-01`..`06` | Stage A, B |
| **BR-002** | Trạng thái NV không hợp lệ | **MANDATORY** | `checkEmployeeActiveForShift()` | Khóa ô trong `<ScheduleCell />`; Thông báo hồ sơ thôi việc. | `TC-EMP-01` | Stage A, B |
| **BR-003** | Trùng ngày nghỉ phép đã duyệt | **WARNING** | `checkLeaveConflict()` | Thẻ `[🏖️ PHÉP NĂM]` viền vàng; Popup cảnh báo điều động trong ngày phép. | `TC-LEAVE-01` | Stage A, B |
| **BR-004** | Vượt giờ tuần (> 48h/tuần) | **WARNING** | `checkWeeklyHoursLimit()` | Thanh tiến độ giờ nhân viên màu đỏ `[56h/48h] 🔴`; Tooltip cảnh báo tuần. | `TC-WEEK-01`..`03` | Stage A, B |
| **BR-005** | Vượt giờ ngày (> 12h/ngày) | **WARNING** | `checkDailyHoursLimit()` | Viền ô ngày màu cam; Cờ cảnh báo vượt trần tối đa. | `TC-DAY-01` | Stage A, B |
| **BR-006** | Nghỉ giữa 2 ca $< 11.0$h (hoặc 12h)| **WARNING** | `checkRestTimeBetweenShifts()` | Icon chấm than vàng ⚠️ trên `<ShiftCard />`; Drawer bắt buộc lý do $\ge 10$ ký tự. | `TC-REST-01`..`04` | Stage A, B |
| **BR-007** | Xếp ca vào Ngày lễ công ty | **WARNING** | `checkHolidayAssignment()` | Tiêu đề cột hồng đỏ `[🚩 LỄ]`; Viền thẻ ca màu hồng; Ghi chú hưởng lương lễ. | `TC-HOLIDAY-01` | Stage A, B |
| **BR-008** | Vi phạm định biên nhân sự ca | **WARNING** | `calculateStaffingCapacity()` | Hàng định biên `<GridHeader />`: hiển thị `ĐB: 3/4 ⚠️` (Thiếu người). | `TC-STAFF-01` | Stage B |
| **BR-009** | Trùng lặp đơn xin nghỉ phép | **MANDATORY** | `checkLeaveOverlap()` | Báo lỗi inline trên `<LeaveRequestModal />`. | `TC-LEAVE-02` | Stage D |
| **BR-010** | Quy tắc Check-in sớm & Grace 5p | Policy | `calculateAttendanceStatus()` | Tính `late_minutes = 0` nếu check-in trong vòng 5 phút đầu ca. | `TC-ATT-01` | Stage A |
| **BR-011** | **Quy tắc Ca qua đêm (+1 ngày)** | Core Domain | `calculateShiftDurations()` | Gắn vào ô ngày bắt đầu, nhãn `[🌙 Ca Đêm (+1)]`. Giờ tính 1 lần vào ngày bắt đầu. | `TC-CALC-03` | Stage A, B |
| **BR-012** | Khấu trừ thời gian nghỉ giữa ca | Core Domain | `calculateShiftDurations()` | Net hours = Duration - Break minutes. | `TC-CALC-01` | Stage A, B |
| **BR-013** | Phân tách Kế hoạch vs Thực tế | Core Domain | Store slices riêng biệt | Giữ nguyên dữ liệu phân ca khi cập nhật chấm công. | `TC-INT-05` | Stage B, D |
| **BR-014** | Snapshotting mẫu ca làm việc | Core Domain | `snapshotShiftData()` | Bản ghi gán lưu bản chụp: tên, giờ bắt đầu/kết thúc, nghỉ, cờ qua đêm. | `TC-SNAP-01` | Stage A, B |
| **BR-015** | Thay đổi lịch đã công bố có lý do | Audit Trail | `useScheduleStore.modifyPublishedShift()` | Kích hoạt `<ChangeReasonDialog />`, lưu vào `scheduleChangeHistory`. | `TC-INT-07` | Stage B |
| **BR-016** | Kiểm toán điều chỉnh chấm công | Audit Trail | `useAttendanceStore.approveCorrection()` | Lưu vết người duyệt, giờ cũ, giờ mới vào `attendance_corrections`. | `TC-QA-09` | Stage D |
| **BR-017** | Khóa lạc quan (Optimistic Concurrency)| Concurrency | `verifyScheduleVersion()` | Kiểm tra khớp `version`, báo lỗi 409 nếu có người sửa trước. | `TC-LOCK-01` | Stage B |
| **BR-018** | Chuẩn hóa Múi giờ UTC/GMT+7 | Timezone | `date.utils.ts` | Ngày lưu YYYY-MM-DD, hiển thị giờ địa phương chuẩn 24h. | `TC-TIME-01` | Stage A |

---
*Kết thúc Tài liệu 16.*
