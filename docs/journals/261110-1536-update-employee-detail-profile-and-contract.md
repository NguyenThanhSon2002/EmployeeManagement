# Ký Sự Triển Khai: Cập Nhật Thông Tin Hình Thức & Đầy Đủ Lý Lịch - Hợp Đồng Trên Trang Chi Tiết Nhân Sự

- **Ngày thực hiện**: 10/11/2026
- **Trạng thái**: Hoàn thành 100%
- **Yêu cầu người dùng**: Cập nhật cả trong phần lý lịch và hợp đồng trên trang chi tiết nhân viên (`/employees/:id`).

---

## 1. Mục Tiêu & Vấn Đề

Trên trang chi tiết nhân sự (`/employees/:id`):
- Tab **Lý Lịch & Hợp Đồng** trước đây chỉ có một card đơn sơ mang tên "Thông Tin Hợp Đồng & Nhân Sự", thiếu hoàn toàn trường **Hình Thức Làm Việc** (`Full-time` / `Part-time`) và mức lương tương ứng vừa mới phát triển.
- Tên tab là "Lý Lịch & Hợp Đồng" nhưng thiếu toàn bộ các thông tin lý lịch cá nhân cơ bản: CCCD/CMND, Ngày sinh, Giới tính, Số điện thoại, Email, Địa chỉ thường trú, Trạng thái tài khoản.
- Tại banner Header của hồ sơ nhân viên, mới chỉ có badge trạng thái hợp đồng (`Chính thức`), thiếu badge thể hiện hình thức làm việc `Full-time` hay `Part-time`.
- Người quản lý khi xem chi tiết nhân viên không có nút "Chỉnh Sửa Hồ Sơ" trực tiếp mà phải quay lại trang danh sách nhân sự.

---

## 2. Các Thay Đổi Đã Thực Hiện

### A. Tái cấu trúc Tab "Lý Lịch & Hợp Đồng" ([`EmployeeProfileTab.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/detail/EmployeeProfileTab.tsx))
Tách bạch và bổ sung thành 2 khối thẻ (Card) chuẩn Enterprise:

1. **Khối 1: Thông Tin Hợp Đồng & Chế Độ Làm Việc**:
   - **Hình Thức Làm Việc (MỚI)**: Hiển thị badge trực quan:
     - Part-time: `<span className="badge badge-warning"><Briefcase size={13}/> Bán thời gian (Part-time)</span>`
     - Full-time: `<span className="badge badge-info"><Clock size={13}/> Toàn thời gian (Full-time)</span>`
   - **Trạng Thái Hợp Đồng**: `<EmploymentStatusBadge status={employee.employmentStatus} />` (Chính thức, Thử việc, Nghỉ chế độ, Đã nghỉ việc)
   - **Chế Độ Lương & Đơn Giá (MỚI)**:
     - Part-time: Hiển thị rõ mức lương theo giờ `xx.xxx đ/giờ` kèm chú thích *"💡 Lương tính theo số giờ làm thực tế từ lịch phân ca"*.
     - Full-time: Hiển thị mức lương cứng cố định theo chức danh (Giám đốc: 25.000.000 đ/tháng, Quản lý: 15.000.000 đ/tháng, Nhân viên: 8.500.000 đ/tháng) kèm chú thích *"💼 Mặc định 8h/ngày, 26 ngày công chuẩn (208h/tháng)"*.
   - **Ngày Ký Hợp Đồng / Vào Làm**: Định dạng ngày chuẩn Việt Nam `dd/MM/yyyy`.
   - **Ngày Nghỉ Việc (Chấm Dứt HĐ)**: Tự động hiển thị nổi bật màu đỏ khi nhân sự có trạng thái `RESIGNED` hoặc có ngày nghỉ việc cụ thể.
   - **Cơ Sở Làm Việc Chính (Home Branch)**: Tên chi nhánh chính & chức danh phụ trách.
   - **Cơ Sở Kiêm Nhiệm / Hỗ Trợ**: Danh sách các chi nhánh và chức danh kiêm nhiệm.

2. **Khối 2: Thông Tin Lý Lịch & Cá Nhân (MỚI)**:
   - **Mã Nhân Viên**: Mã định danh `EMP-xxx`.
   - **Họ Và Tên**: Tên đầy đủ của nhân sự.
   - **Số CCCD / CMND**: Số căn cước công dân của nhân viên.
   - **Ngày Sinh**: Ngày tháng năm sinh định dạng tiếng Việt.
   - **Giới Tính**: Nam / Nữ / Khác.
   - **Số Điện Thoại**: Số điện thoại liên hệ cá nhân.
   - **Email Liên Hệ**: Địa chỉ email công việc.
   - **Trạng Thái Tài Khoản**: Badge Đang hoạt động (xanh lá) hoặc Ngừng hoạt động (đỏ).
   - **Địa Chỉ Thường Trú / Nơi Ở Hiện Tại**: Địa chỉ liên hệ chi tiết.

### B. Nâng cấp Banner Header & Bổ Sung Nút Sửa Hồ Sơ ([`EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx))
1. **Banner Header**:
   - Ngay cạnh `<EmploymentStatusBadge />`, bổ sung badge `Full-time` (xanh dương) hoặc `Part-time` (màu cam), giúp nhận diện ngay hình thức làm việc của nhân sự tại trang cá nhân.
2. **Nút "Chỉnh Sửa Hồ Sơ"**:
   - Bổ sung nút "Chỉnh Sửa Hồ Sơ" (`Edit2` icon) vào thanh tác vụ cho Quản lý và Giám đốc (`canManageStaff`).
   - Tích hợp [`EmployeeFormModal`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/components/EmployeeFormModal.tsx) trực tiếp tại trang chi tiết: khi lưu thành công, thông tin trên trang được cập nhật ngay lập tức mà không cần F5 hay tải lại trang.

---

## 3. Kiểm Thử & Triển Khai
- Chạy `npm run build`: Không lỗi TypeScript, bundle build thành công 100%.
- Rebuild Docker container `hrms-frontend` thành công.
- Kiểm tra hiển thị tại `http://localhost:8082/employees/1`:
  - Header hiển thị: `Nguyễn Thu Phương`, `EMP-001`, `• Chính thức`, `• Full-time`, nút `Chỉnh Sửa Hồ Sơ`.
  - Tab "Lý Lịch & Hợp Đồng": Hiển thị đầy đủ cả 2 khối thẻ: Thông Tin Hợp Đồng & Chế Độ Làm Việc và Thông Tin Lý Lịch & Cá Nhân.
