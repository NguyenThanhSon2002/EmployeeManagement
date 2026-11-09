# TÀI LIỆU 04: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)
**Dự án:** Employee Management System  
**Tiêu chuẩn:** RESTful, JSON API, OpenAPI 3.0 / Swagger UI  
**Gốc URL (Base URL):** `http://localhost:8080/api/v1` (hoặc `https://hrms.company.vn/api/v1`)  
**Phiên bản:** 3.0.0  
**Ngày cập nhật:** 09/11/2026  
**Trạng thái:** Confirmed / Production Ready  

---

## 1. QUY CHUẨN THIẾT KẾ REST API & PHONG BÌ DỮ LIỆU (RESPONSE ENVELOPE)

### 1.1. Tiêu chuẩn Chung
1. Toàn bộ tài nguyên sử dụng danh từ số nhiều (ví dụ: `/employees`, `/schedules`, `/branches`, `/notifications`).
2. Mọi dữ liệu trao đổi sử dụng chuẩn mã hóa UTF-8, định dạng JSON (`Content-Type: application/json; charset=UTF-8`), ngoại trừ các endpoint upload avatar (`multipart/form-data`) và xuất báo cáo nhị phân (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`).
3. Chuẩn hóa ngày giờ: ISO-8601 UTC string (`YYYY-MM-DDTHH:mm:ssZ`) đối với timestamp; `YYYY-MM-DD` đối với ngày thuần túy; `HH:mm:ss` đối với giờ ca.
4. Mọi yêu cầu bảo vệ bắt buộc đính kèm Header: `Authorization: Bearer <access_token>`.
5. Phân quyền trên từng endpoint kiểm soát qua Spring Security `@PreAuthorize` với 3 vai trò người dùng chuẩn: `ROLE_DIRECTOR` (Giám đốc), `ROLE_MANAGER` (Quản lý chi nhánh), `ROLE_EMPLOYEE` (Nhân viên), cùng vai trò kỹ thuật `ROLE_ADMIN`.

### 1.2. Cấu trúc Phong Bì Dữ liệu Thành Công (Standard Success Envelope)
Tất cả các API trả về thành công đều tuân thủ cấu trúc đồng nhất qua `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Thực hiện thành công",
  "data": { ... }
}
```

### 1.3. Cấu trúc Phân Trang (Standard Pagination Envelope)
Áp dụng cho các danh sách có phân trang server-side (`PageResponse<T>`) như danh sách nhân sự, bản ghi chấm công, đơn giải trình và đơn nghỉ phép:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "size": 20,
    "total_elements": 142,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```
*Lưu ý:* Tham số truy vấn `page` từ client được đánh chỉ số từ 1 (1-indexed). Backend Spring Data JPA tự động quy đổi `pageIndex = Math.max(0, page - 1)` (0-indexed).

### 1.4. Cấu trúc Phản Hồi Lỗi Chuẩn (Standard Error Envelope)
Khi xảy ra lỗi (mã HTTP 4xx hoặc 5xx), hệ thống trả về thông báo lỗi chi tiết, hỗ trợ danh sách lỗi từng trường phục vụ hiển thị form validation trên frontend:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu.",
    "details": [
      {
        "field": "phone_number",
        "rejected_value": "09123",
        "message": "Số điện thoại không đúng định dạng di động Việt Nam (yêu cầu 10 chữ số)."
      },
      {
        "field": "branch_id",
        "rejected_value": null,
        "message": "Chi nhánh làm việc không được để trống."
      }
    ],
    "timestamp": "2026-11-09T08:15:30Z",
    "path": "/api/v1/employees"
  }
}
```

### 1.5. Bảng Mã Lỗi Nghiệp Vụ Chuẩn (Business Error Codes Catalog)

| HTTP Status | Mã Lỗi (`error.code`) | Mô Tả Ý Nghĩa |
|:---:|:---|:---|
| `400` | `BAD_REQUEST` | Tham số đường dẫn hoặc cú pháp JSON không hợp lệ |
| `400` | `VALIDATION_FAILED` | Vi phạm ràng buộc dữ liệu đầu vào (Bean Validation) |
| `401` | `UNAUTHORIZED` | Token hết hạn, không hợp lệ hoặc thiếu thông tin xác thực |
| `401` | `INVALID_CREDENTIALS` | Tên đăng nhập hoặc mật khẩu không chính xác |
| `403` | `FORBIDDEN` | Người dùng không đủ quyền hạn hoặc truy cập ngoài phạm vi cơ sở được phân bổ |
| `404` | `RESOURCE_NOT_FOUND` | Không tìm thấy bản ghi theo ID yêu cầu |
| `409` | `RESOURCE_CONFLICT` | Dữ liệu bị trùng khóa duy nhất (Email, Mã NV, CCCD đã tồn tại) |
| `409` | `OPTIMISTIC_LOCK_CONFLICT`| Bản ghi lịch tuần đã bị người khác cập nhật trước (`version mismatch`) |
| `422` | `ERR_SHIFT_OVERLAP` | [BR-001] Trùng ca làm việc của một nhân viên trong ngày |
| `422` | `ERR_INSUFFICIENT_REST_TIME`| [BR-002] Khoảng cách nghỉ giữa 2 ca liên tiếp nhỏ hơn quy định (< 12 giờ) |
| `422` | `ERR_MAX_CONSECUTIVE_DAYS` | [BR-003] Vượt trần 6 ngày làm việc liên tục không có ngày nghỉ |
| `422` | `ERR_MAX_WEEKLY_HOURS` | [BR-004] Vượt trần 48 giờ làm việc tiêu chuẩn trong 1 tuần |
| `422` | `ERR_MAX_DAILY_HOURS` | [BR-005] Vượt trần 12 giờ làm việc/ngày (kể cả làm thêm) |
| `422` | `ERR_MAX_MONTHLY_OT_HOURS` | [BR-006] Vượt trần 40 giờ làm thêm trong tháng |
| `422` | `ERR_SHIFT_CAPACITY_FULL` | [BR-007] Ca làm việc đã đủ định biên nhân sự tối đa (`max_staffing`) |
| `422` | `ERR_LEAVE_OVERLAP` | [BR-009] Trùng lặp đơn xin nghỉ phép trong khoảng thời gian đã duyệt/chờ duyệt |
| `422` | `ERR_INSUFFICIENT_BALANCE` | Quỹ phép năm còn lại không đủ cho thời gian xin nghỉ |
| `429` | `TOO_MANY_REQUESTS` | Vượt quá giới hạn tần suất yêu cầu (Rate limiting) |
| `500` | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ nội bộ ngoài dự kiến |

---

## 2. DANH MỤC API THEO 14 PHÂN HỆ BACKEND

---

### PHÂN HỆ 1: AUTH - XÁC THỰC VÀ TÀI KHOẢN CÁ NHÂN (`/api/v1/auth`)

#### `API-001`: Đăng nhập hệ thống (Login)
- **Method & Path:** `POST /api/v1/auth/login`
- **Quyền hạn:** Public
- **Request Body:**
```json
{
  "username": "EMP-001",
  "password": "Password123@"
}
```
- **Phản hồi 200 OK:** *(Kèm Cookie `refresh_token` HttpOnly, Secure, SameSite=Strict)*
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in_seconds": 900,
    "must_change_password": false,
    "user": {
      "id": 1,
      "username": "EMP-001",
      "email": "an.nguyen@company.vn",
      "full_name": "Nguyễn Văn An",
      "employee_id": 1,
      "employee_code": "EMP-001",
      "branch_id": 1,
      "branch_name": "Cơ sở 1 - Hà Nội",
      "roles": ["ROLE_MANAGER", "ROLE_EMPLOYEE"]
    }
  }
}
```
- **Error Codes:** `INVALID_CREDENTIALS` (401), `TOO_MANY_REQUESTS` (429).

---

#### `API-002`: Làm mới Access Token (Refresh Token)
- **Method & Path:** `POST /api/v1/auth/refresh-token`
- **Quyền hạn:** Public (Đọc cookie `refresh_token`)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in_seconds": 900
  }
}
```

---

#### `API-003`: Đăng xuất (Logout)
- **Method & Path:** `POST /api/v1/auth/logout`
- **Quyền hạn:** Authenticated
- **Hành động:** Thu hồi refresh token trong CSDL, xóa cookie trên trình duyệt.
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": { "message": "Đăng xuất thành công." }
}
```

---

#### `API-004`: Lấy thông tin tài khoản hiện tại (Get Current Profile)
- **Method & Path:** `GET /api/v1/auth/me`
- **Quyền hạn:** Authenticated
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "employee_id": 1,
    "employee_code": "EMP-001",
    "full_name": "Nguyễn Văn An",
    "email": "an.nguyen@company.vn",
    "phone_number": "0912345678",
    "branch_id": 1,
    "branch_name": "Cơ sở 1 - Hà Nội",
    "position_id": 2,
    "position_name": "Quản lý cơ sở",
    "annual_leave_remaining": 11.5
  }
}
```

---

#### `API-005`: Đổi mật khẩu cá nhân (Change Password)
- **Method & Path:** `POST /api/v1/auth/change-password`
- **Quyền hạn:** Authenticated
- **Request Body:**
```json
{
  "old_password": "Password123@",
  "new_password": "NewSecurePassword456@"
}
```

---

### PHÂN HỆ 2: EMPLOYEE - HỒ SƠ NHÂN SỰ & KIÊM NHIỆM (`/api/v1/employees`)

#### `API-006`: Lấy danh sách nhân viên phân trang (Get Employees)
- **Method & Path:** `GET /api/v1/employees`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_ADMIN`
- **Query Parameters:**
  - `page` (int, default 1, 1-indexed)
  - `size` (int, default 20)
  - `branch_id` (long, tùy chọn)
  - `status` (string, ví dụ: `OFFICIAL`, `PROBATION`, `RESIGNED`)
  - `keyword` (string, tìm theo mã nhân viên, họ tên, email, sđt)
- **Phản hồi 200 OK (`PageResponse`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "employee_code": "EMP-001",
      "full_name": "Nguyễn Văn An",
      "email": "an.nguyen@company.vn",
      "phone_number": "0912345678",
      "branch_id": 1,
      "position_id": 2,
      "employment_status": "OFFICIAL",
      "employment_type": "FULL_TIME",
      "hire_date": "2023-03-15",
      "avatar_url": "/uploads/avatars/emp-1.png",
      "is_active": true,
      "version": 2,
      "secondary_branch_ids": [2],
      "secondary_branches": [
        {
          "id": 1,
          "branch_id": 2,
          "branch_name": "Cơ sở 2 - Cầu Giấy",
          "position_id": 3,
          "position_name": "Nhân viên hỗ trợ chéo"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "total_elements": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

---

#### `API-007`: Lấy chi tiết hồ sơ nhân viên (Get Employee Detail)
- **Method & Path:** `GET /api/v1/employees/{id}`
- **Quyền hạn:** Authenticated (`ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` chính mình)

---

#### `API-008`: Tạo mới hồ sơ nhân viên (Create Employee)
- **Method & Path:** `POST /api/v1/employees`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:**
```json
{
  "employee_code": "EMP-025",
  "full_name": "Trần Thị Lan",
  "email": "lan.tran@company.vn",
  "phone_number": "0987654321",
  "national_id": "001199003344",
  "date_of_birth": "1998-05-12",
  "gender": "FEMALE",
  "address": "Số 12 phố Trần Thái Tông, Cầu Giấy, Hà Nội",
  "branch_id": 1,
  "position_id": 3,
  "manager_id": 1,
  "employment_status": "OFFICIAL",
  "employment_type": "FULL_TIME",
  "hire_date": "2026-11-01",
  "secondary_branch_ids": [2]
}
```
- **Phản hồi 201 Created:** Trả về đối tượng `EmployeeDto` vừa tạo.

---

#### `API-009`: Cập nhật hồ sơ nhân viên (Update Employee)
- **Method & Path:** `PUT /api/v1/employees/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:** Tương tự `POST /api/v1/employees`, hỗ trợ cập nhật đồng bộ `secondary_branch_ids` và `secondary_branches`.

---

#### `API-010`: Xóa mềm hồ sơ nhân viên (Soft Delete Employee)
- **Method & Path:** `DELETE /api/v1/employees/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`
- **Hành động:** Gán `is_active = false`, cập nhật `deleted_at = NOW()`, thu hồi mọi phiên đăng nhập active.

---

#### `API-011`: Tải lên ảnh đại diện (Upload Avatar)
- **Method & Path:** `POST /api/v1/employees/{id}/avatar`
- **Content-Type:** `multipart/form-data`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` (chính mình)
- **Form Data:** `file` (File nhị phân: tối đa 5MB, định dạng png, jpg, jpeg, webp)
- **Phản hồi 200 OK:** Trả về `EmployeeDto` cập nhật đường dẫn `avatar_url`.

---

#### `API-012`: Xóa ảnh đại diện (Delete Avatar)
- **Method & Path:** `DELETE /api/v1/employees/{id}/avatar`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` (chính mình)
- **Phản hồi 200 OK:** Trả về `EmployeeDto` với `avatar_url = null`.

---

#### `API-013`: Lấy lịch ca làm việc tháng của nhân viên (Employee Monthly Schedule)
- **Method & Path:** `GET /api/v1/employees/{id}/shifts`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` (chính mình)
- **Query Parameters:** `month` (string định dạng `YYYY-MM`, ví dụ: `2026-11`)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "employee_id": 1,
    "employee_name": "Nguyễn Văn An",
    "month": "2026-11",
    "total_shifts": 22,
    "total_hours": 176.0,
    "shifts": [
      {
        "assignment_id": 305,
        "work_date": "2026-11-09",
        "shift_name": "Ca Sáng",
        "start_time": "08:00:00",
        "end_time": "17:00:00",
        "branch_name": "Cơ sở 1 - Hà Nội",
        "source": "MANAGER"
      }
    ]
  }
}
```

---

#### `API-014`: Quản trị viên đặt lại mật khẩu nhân viên (Admin Reset Password)
- **Method & Path:** `POST /api/v1/employees/{id}/reset-password`
- **Quyền hạn:** `ROLE_DIRECTOR`
- **Request Body:**
```json
{
  "new_password": "TemporaryPassword123@"
}
```

---

### PHÂN HỆ 3: AVAILABILITY - LỊCH ĐĂNG KÝ RẢNH & CA ƯU TIÊN (`/api/v1/employees`)

#### `API-015`: Lấy lịch rảnh cá nhân (Get Employee Availability)
- **Method & Path:** `GET /api/v1/employees/{employeeId}/availability`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` (chính mình)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "employee_id": 1,
    "availabilities": [
      {
        "id": 10,
        "day_of_week": 1,
        "shift_template_id": 1,
        "is_available": true
      }
    ],
    "preferred_shift_ids": [1, 2]
  }
}
```

---

#### `API-016`: Lấy ma trận lịch rảnh của cả cơ sở (Get Branch Availabilities)
- **Method & Path:** `GET /api/v1/employees/availability`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Query Parameters:** `branch_id` (long, bắt buộc)
- **Phản hồi 200 OK:** Map cấu trúc `{ employeeId: { dayOfWeek: [shiftTemplateIds] } }`.

---

#### `API-017`: Lấy danh sách ca ưu tiên của cả cơ sở (Get Branch Preferred Shifts)
- **Method & Path:** `GET /api/v1/employees/preferred-shifts`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Query Parameters:** `branch_id` (long, bắt buộc)
- **Phản hồi 200 OK:** Map cấu trúc `{ employeeId: [shiftTemplateIds] }`.

---

#### `API-018`: Lưu lịch đăng ký rảnh và ca ưu tiên (Save Availability & Preferred Shifts)
- **Method & Path:** `PUT /api/v1/employees/{employeeId}/availability`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE` (chính mình)
- **Query Parameters:** `branch_id` (long, tùy chọn)
- **Request Body (`SaveAvailabilityRequest`):**
```json
{
  "branch_id": 1,
  "availabilities": [
    { "day_of_week": 1, "shift_template_id": 1, "is_available": true },
    { "day_of_week": 2, "shift_template_id": 1, "is_available": true },
    { "day_of_week": 3, "shift_template_id": 2, "is_available": false }
  ],
  "preferred_shift_ids": [1, 2]
}
```

---

### PHÂN HỆ 4: BRANCH - QUẢN LÝ CƠ SỞ / CHI NHÁNH (`/api/v1/branches`)

#### `API-019`: Lấy danh sách toàn bộ cơ sở làm việc
- **Method & Path:** `GET /api/v1/branches`
- **Quyền hạn:** Authenticated
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "branch_code": "CN-HN01",
      "branch_name": "Cơ sở 1 - Hà Nội",
      "address": "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
      "phone_number": "02438686868",
      "is_active": true
    },
    {
      "id": 2,
      "branch_code": "CN-HN02",
      "branch_name": "Cơ sở 2 - Cầu Giấy",
      "address": "Số 18 Phạm Hùng, Cầu Giấy, Hà Nội",
      "phone_number": "02437686868",
      "is_active": true
    }
  ]
}
```

---

#### `API-020`: Lấy chi tiết cơ sở theo ID
- **Method & Path:** `GET /api/v1/branches/{id}`
- **Quyền hạn:** Authenticated

---

#### `API-021`: Tạo mới cơ sở làm việc
- **Method & Path:** `POST /api/v1/branches`
- **Quyền hạn:** `ROLE_DIRECTOR`
- **Request Body:**
```json
{
  "branch_code": "CN-HCM01",
  "branch_name": "Cơ sở 3 - Quận 1 TP.HCM",
  "address": "Số 99 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM",
  "phone_number": "02838222222",
  "is_active": true
}
```

---

#### `API-022`: Cập nhật thông tin cơ sở
- **Method & Path:** `PUT /api/v1/branches/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`

---

#### `API-023`: Xóa mềm cơ sở làm việc
- **Method & Path:** `DELETE /api/v1/branches/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`

---

### PHÂN HỆ 5: POSITION - QUẢN LÝ VỊ TRÍ & CHỨC DANH (`/api/v1/positions`)

- `API-024`: `GET /api/v1/positions` (Lấy danh mục chức danh - Authenticated)
- `API-025`: `GET /api/v1/positions/{id}` (Lấy chi tiết chức danh - Authenticated)
- `API-026`: `POST /api/v1/positions` (Tạo mới chức danh - `ROLE_DIRECTOR`)
- `API-027`: `PUT /api/v1/positions/{id}` (Cập nhật chức danh - `ROLE_DIRECTOR`)
- `API-028`: `DELETE /api/v1/positions/{id}` (Xóa mềm chức danh - `ROLE_DIRECTOR`)

---

### PHÂN HỆ 6: WORK SHIFT - MẪU CA LÀM VIỆC (`/api/v1/work-shifts`)

#### `API-029`: Lấy danh sách mẫu ca làm việc (Get Work Shifts)
- **Method & Path:** `GET /api/v1/work-shifts`
- **Quyền hạn:** Authenticated (`ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`)
- **Query Parameters:** `branchId` (long, tùy chọn - lọc ca riêng theo cơ sở)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shift_code": "CA-SANG",
      "shift_name": "Ca Sáng Tiêu Chuẩn",
      "start_time": "08:00:00",
      "end_time": "17:00:00",
      "break_minutes": 60,
      "is_cross_midnight": false,
      "color_code": "#E6F7FF",
      "min_staffing": 4,
      "max_staffing": 10,
      "branch_id": 1,
      "branch_name": "Cơ sở 1 - Hà Nội",
      "is_active": true
    },
    {
      "id": 2,
      "shift_code": "CA-DEM",
      "shift_name": "Ca Đêm Qua Đêm",
      "start_time": "22:00:00",
      "end_time": "06:00:00",
      "break_minutes": 0,
      "is_cross_midnight": true,
      "color_code": "#FFF1F0",
      "min_staffing": 2,
      "max_staffing": 4,
      "branch_id": null,
      "branch_name": null,
      "is_active": true
    }
  ]
}
```

---

#### `API-030`: Tạo mẫu ca làm việc mới
- **Method & Path:** `POST /api/v1/work-shifts`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`

---

#### `API-031`: Cập nhật mẫu ca làm việc
- **Method & Path:** `PUT /api/v1/work-shifts/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Kiến trúc:** Bất biến (Immutable Snapshotting) - sửa đổi mẫu ca không làm sai lệch các phân ca lịch sử.

---

#### `API-032`: Xóa mềm mẫu ca
- **Method & Path:** `DELETE /api/v1/work-shifts/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`

---

### PHÂN HỆ 7: SCHEDULE - XẾP CA, MA TRẬN LỊCH VÀ NHẬN CA TRỐNG (`/api/v1/schedules`)

#### `API-033`: Lấy ma trận lịch làm việc tuần theo chi nhánh (Get Weekly Roster)
- **Method & Path:** `GET /api/v1/schedules/weekly` (Alias: `GET /api/v1/schedules/week`)
- **Quyền hạn:** Authenticated (`ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`)
- **Query Parameters:**
  - `branch_id` (long, mặc định 1)
  - `start_date` (date string `YYYY-MM-DD`, ngày đầu tuần)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "schedule_id": 101,
    "branch_id": 1,
    "branch_name": "Cơ sở 1 - Hà Nội",
    "start_date": "2026-11-09",
    "end_date": "2026-11-15",
    "status": "DRAFT",
    "version": 4,
    "employees": [
      {
        "employee_id": 1,
        "employee_code": "EMP-001",
        "full_name": "Nguyễn Văn An",
        "weekly_scheduled_hours": 40.0,
        "assignments": [
          {
            "id": 501,
            "work_date": "2026-11-09",
            "work_shift_id": 1,
            "shift_name": "Ca Sáng Tiêu Chuẩn",
            "start_time": "08:00:00",
            "end_time": "17:00:00",
            "is_cross_midnight": false,
            "color_code": "#E6F7FF",
            "source": "MANAGER",
            "transferred_from_employee_id": null,
            "warnings": []
          }
        ]
      }
    ],
    "holidays": []
  }
}
```

---

#### `API-034`: Kiểm tra xung đột trước khi lưu (Dry-Run Conflict Check)
- **Method & Path:** `POST /api/v1/schedules/validate-conflicts`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:**
```json
{
  "branch_id": 1,
  "assignments": [
    {
      "employee_id": 2,
      "work_shift_id": 1,
      "work_date": "2026-11-10"
    }
  ]
}
```

---

#### `API-035`: Gán hoặc cập nhật phân ca đơn lẻ (Assign Single Shift)
- **Method & Path:** `POST /api/v1/schedules/assignments`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:**
```json
{
  "schedule_id": 101,
  "employee_id": 2,
  "work_shift_id": 1,
  "work_date": "2026-11-10",
  "override_rule": "WARN_INSUFFICIENT_REST_TIME",
  "override_reason": "Đổi ca hỗ trợ tăng cường giờ cao điểm",
  "schedule_version": 4
}
```
- **Error Codes:** `ERR_SHIFT_OVERLAP` (422), `OPTIMISTIC_LOCK_CONFLICT` (409).

---

#### `API-036`: Nhân viên tự đăng ký ca trống (Open Shift Claiming)
- **Method & Path:** `POST /api/v1/schedules/assignments/claim`
- **Quyền hạn:** Authenticated (`ROLE_EMPLOYEE`, `ROLE_MANAGER`, `ROLE_DIRECTOR`)
- **Request Body (`ClaimShiftRequest`):**
```json
{
  "schedule_id": 101,
  "work_shift_id": 1,
  "work_date": "2026-11-12",
  "self_volunteered_confirm": true
}
```
- **Xử lý nghiệp vụ:**
  - Kiểm tra 9 luật xung đột lịch lao động đối với nhân viên hiện tại.
  - Kiểm tra số lượng phân ca trong ca đó chưa vượt trần `max_staffing`.
  - Phân công ca trực tiếp với cờ `source = 'SELF_CLAIM'`.
- **Phản hồi 200 OK:** Trả về `ShiftAssignmentDto` phân ca mới.

---

#### `API-037`: Nhân viên tự hủy ca đã đăng ký (Cancel Claimed Shift)
- **Method & Path:** `DELETE /api/v1/schedules/assignments/claim/{id}`
- **Quyền hạn:** Authenticated
- **Hành động:** Chỉ cho phép người nhận ca tự hủy nếu ca đó do chính mình đăng ký (`source = 'SELF_CLAIM'`) và ca chưa bắt đầu.

---

#### `API-038`: Quản lý xóa một ca phân công (Delete Assignment)
- **Method & Path:** `DELETE /api/v1/schedules/assignments/{id}`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Query Parameters:** `schedule_version` (int, hỗ trợ kiểm soát optimistic lock)

---

#### `API-038B`: Reset toàn bộ phân ca của lịch tuần (Reset Weekly Schedule)
- **Method & Path:** `DELETE /api/v1/schedules/{id}/assignments`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Query Parameters:** `schedule_version` (int, hỗ trợ kiểm soát optimistic lock)
- **Hành động:** Kiểm tra lịch chưa công bố (`assertScheduleNotLocked`), xóa sạch toàn bộ ca phân công của lịch tuần (`deleteAllByScheduleId`) trong 1 Transaction, tăng `version` của lịch lên 1.
- **Phản hồi 200 OK:** `{ "success": true, "data": null }`

---

#### `API-039`: Cập nhật giải trình ngoại lệ đặc cách (Update Override Reason)
- **Method & Path:** `PATCH /api/v1/schedules/assignments/{id}/override`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:**
```json
{
  "override_rule": "WARN_MAX_WEEKLY_HOURS",
  "override_reason": "Có sự đồng thuận bằng văn bản của người lao động"
}
```

---

#### `API-040`: Gán ca hàng loạt theo khoảng ngày (Bulk Assign Shifts)
- **Method & Path:** `POST /api/v1/schedules/bulk-assign`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`

---

#### `API-041`: Lưu danh sách phân ca tự động hàng loạt (Batch Assign Shifts)
- **Method & Path:** `POST /api/v1/schedules/assignments/batch`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`

---

#### `API-042`: Sao chép lịch từ tuần trước (Copy Previous Week)
- **Method & Path:** `POST /api/v1/schedules/copy-week`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:**
```json
{
  "branch_id": 1,
  "source_start_date": "2026-11-02",
  "target_start_date": "2026-11-09",
  "target_schedule_id": 101,
  "schedule_version": 4
}
```

---

#### `API-043`: Công bố lịch làm việc chính thức (Publish Schedule)
- **Method & Path:** `POST /api/v1/schedules/{id}/publish`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body:** `{ "version": 4 }`
- **Phản hồi 200 OK:** Trạng thái lịch chuyển sang `PUBLISHED`, gửi thông báo in-app đến toàn bộ nhân viên có ca trong tuần.

---

#### `API-044`: Hủy công bố lịch làm việc (Unpublish Schedule)
- **Method & Path:** `POST /api/v1/schedules/{id}/unpublish`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_ADMIN`
- **Phản hồi 200 OK:** Trạng thái lịch chuyển về `DRAFT` để quản lý chỉnh sửa lại.

---

### PHÂN HỆ 8: SHIFT SWAP - HOÁN ĐỔI & NHƯỜNG CA TRỰC (`/api/v1/shift-swaps`)

#### `API-045`: Mô phỏng kiểm tra xung đột đổi/nhường ca (Simulate Swap)
- **Method & Path:** `POST /api/v1/shift-swaps/simulate`
- **Quyền hạn:** Authenticated
- **Request Body (`SimulateSwapRequest`):**
```json
{
  "requesterAssignmentId": 501,
  "targetEmployeeId": 2,
  "targetAssignmentId": 508,
  "type": "SWAP"
}
```
*(Nếu `type = "HANDOVER"`, trường `targetAssignmentId` để null).*
- **Phản hồi 200 OK (`SimulateSwapResponse`):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "hasError": false,
    "hasWarning": false,
    "requesterConflicts": [],
    "targetConflicts": [],
    "message": "Đủ điều kiện hoán đổi ca làm việc."
  }
}
```

---

#### `API-046`: Tạo đơn yêu cầu đổi ca / nhường ca (Create Swap Request)
- **Method & Path:** `POST /api/v1/shift-swaps`
- **Quyền hạn:** Authenticated
- **Request Body (`CreateSwapRequest`):**
```json
{
  "requesterAssignmentId": 501,
  "targetEmployeeId": 2,
  "targetAssignmentId": 508,
  "type": "SWAP",
  "reason": "Bận việc gia đình đột xuất ngày thứ 3"
}
```
- **Hành động:** Trạng thái khởi tạo là `PENDING_PEER`, tự động phát sinh thông báo `NOTIFICATION` loại `SHIFT_SWAP_REQUEST` tới `targetEmployeeId`.

---

#### `API-047`: Đồng nghiệp phản hồi đơn đổi ca (Peer Respond)
- **Method & Path:** `PUT /api/v1/shift-swaps/{id}/peer-respond`
- **Quyền hạn:** Authenticated (`targetEmployeeId`)
- **Request Body (`PeerRespondRequest`):**
```json
{
  "action": "ACCEPT",
  "peerNote": "Đồng ý nhận ca đổi giúp bạn"
}
```
*(Nếu `action = "REJECT"`, trạng thái đơn chuyển sang `PEER_REJECTED`).*
- **Hành động khi ACCEPT:** Đơn chuyển sang `PENDING_MANAGER`, gửi thông báo tới Quản lý cơ sở.

---

#### `API-048`: Quản lý xét duyệt đơn đổi/nhường ca (Manager Review)
- **Method & Path:** `PUT /api/v1/shift-swaps/{id}/manager-review`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_ADMIN`
- **Request Body (`ManagerReviewRequest`):**
```json
{
  "action": "APPROVE",
  "managerNote": "Duyệt phân ca thay thế"
}
```
- **Hành động khi APPROVE:**
  - Chạy lại kiểm tra xung đột thời gian thực trong transaction.
  - Nếu là `SWAP`: Hoán đổi `employee_id` giữa 2 `shift_assignments`.
  - Nếu là `HANDOVER`: Cập nhật `shift_assignments.employee_id = target_employee_id`, ghi nhận `transferred_from_employee_id = requester_employee_id` để phục vụ truy vết.
  - Đơn chuyển sang `APPROVED`, phát thông báo hoàn tất tới cả 2 nhân viên.

---

#### `API-049`: Người tạo hủy yêu cầu đổi ca (Cancel Request)
- **Method & Path:** `DELETE /api/v1/shift-swaps/{id}`
- **Quyền hạn:** Authenticated (Người khởi tạo đơn khi đơn chưa ở trạng thái `APPROVED`)
- **Phản hồi 200 OK:** Đơn chuyển sang `CANCELLED`.

---

#### `API-050`: Lấy danh sách yêu cầu cá nhân (Get My Requests)
- **Method & Path:** `GET /api/v1/shift-swaps/my-requests`
- **Quyền hạn:** Authenticated
- **Mô tả:** Trả về toàn bộ các đơn do cá nhân khởi tạo hoặc được đồng nghiệp gửi yêu cầu.

---

#### `API-051`: Quản lý lấy danh sách đơn chờ duyệt (Get Pending Manager Requests)
- **Method & Path:** `GET /api/v1/shift-swaps/pending-manager`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_ADMIN`
- **Query Parameters:** `branchId` (long, bắt buộc)
- **Mô tả:** Trả về danh sách đơn đã qua bước đồng nghiệp xác nhận (`status = 'PENDING_MANAGER'`).

---

#### `API-052`: Lấy lịch sử đơn đổi ca của cơ sở (Get Branch History)
- **Method & Path:** `GET /api/v1/shift-swaps/branch-history`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_ADMIN`
- **Query Parameters:** `branchId` (long, bắt buộc)

---

### PHÂN HỆ 9: NOTIFICATION - TRUNG TÂM THÔNG BÁO NỘI BỘ (`/api/v1/notifications`)

#### `API-053`: Lấy danh sách thông báo của tôi (List Notifications)
- **Method & Path:** `GET /api/v1/notifications`
- **Quyền hạn:** Authenticated
- **Mô tả:** Trả về 50 thông báo mới nhất của tài khoản đăng nhập (cả theo `user_id` và `employee_id`).
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 142,
      "type": "SHIFT_SWAP",
      "title": "Yêu cầu đổi ca mới",
      "message": "Trần Thị Lan muốn đổi ca Sáng ngày 12/11 với bạn.",
      "ref_type": "SHIFT_SWAP",
      "ref_id": 88,
      "is_read": false,
      "created_at": "2026-11-09T08:30:00"
    }
  ]
}
```

---

#### `API-054`: Lấy số lượng thông báo chưa đọc (Get Unread Count)
- **Method & Path:** `GET /api/v1/notifications/unread-count`
- **Quyền hạn:** Authenticated
- **Mô tả:** Phục vụ hiển thị badge số đếm trên thanh chuông header.
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

#### `API-055`: Đánh dấu một thông báo đã đọc (Mark Read)
- **Method & Path:** `PUT /api/v1/notifications/{id}/read`
- **Quyền hạn:** Authenticated
- **Phản hồi 200 OK:** `{ "success": true, "data": null }`

---

#### `API-056`: Đánh dấu toàn bộ thông báo đã đọc (Mark All Read)
- **Method & Path:** `PUT /api/v1/notifications/read-all`
- **Quyền hạn:** Authenticated
- **Phản hồi 200 OK:** `{ "success": true, "data": null }`

---

### PHÂN HỆ 10: ATTENDANCE - CHẤM CÔNG VÀ GIẢI TRÌNH (`/api/v1/attendance`)

#### `API-057`: Thực hiện Check-in vào ca (Web Check-in)
- **Method & Path:** `POST /api/v1/attendance/check-in`
- **Quyền hạn:** Authenticated (`ROLE_EMPLOYEE`)
- **Request Body:**
```json
{
  "note": "Check-in tại sảnh chính cơ sở 1"
}
```
- **Phản hồi 200 OK (`AttendanceRecordDto`):**
```json
{
  "success": true,
  "data": {
    "id": 8801,
    "employee_id": 1,
    "work_date": "2026-11-09",
    "check_in_time": "2026-11-09T07:55:12Z",
    "check_out_time": null,
    "status": "PRESENT",
    "late_minutes": 0,
    "source": "WEB_PORTAL"
  }
}
```

---

#### `API-058`: Thực hiện Check-out tan ca (Web Check-out)
- **Method & Path:** `POST /api/v1/attendance/check-out`
- **Quyền hạn:** Authenticated (`ROLE_EMPLOYEE`)
- **Request Body:**
```json
{
  "note": "Hoàn tất ca làm việc"
}
```
- **Phản hồi 200 OK:** Tự động tính toán số giờ làm việc thực tế (`actual_hours`), giờ làm ban đêm (`night_hours`) và giờ làm thêm (`ot_hours`).

---

#### `API-059`: Lấy danh sách bản ghi chấm công (Get Attendance Records)
- **Method & Path:** `GET /api/v1/attendance/records`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`
- **Query Parameters:** `employee_id`, `work_date`, `status`, `page`, `size`.

---

#### `API-060`: Nộp đơn giải trình chấm công (Submit Correction)
- **Method & Path:** `POST /api/v1/attendance/corrections`
- **Quyền hạn:** Authenticated
- **Request Body (`AttendanceCorrectionDto`):**
```json
{
  "attendance_record_id": 8801,
  "requested_check_in": "2026-11-09T08:00:00Z",
  "requested_check_out": "2026-11-09T17:05:00Z",
  "reason": "Mất kết nối mạng wifi nội bộ cuối ca không bấm được check-out",
  "attachment_url": null
}
```

---

#### `API-061`: Phê duyệt hoặc từ chối giải trình chấm công (Review Correction)
- **Method & Path:** `PUT /api/v1/attendance/corrections/{id}/review`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body (`ReviewCorrectionRequest`):**
```json
{
  "action": "APPROVE",
  "review_note": "Đã đối soát camera văn phòng khớp thời gian"
}
```

---

#### `API-062`: Lấy danh sách đơn giải trình chấm công (Get Corrections)
- **Method & Path:** `GET /api/v1/attendance/corrections`
- **Quyền hạn:** Authenticated
- **Query Parameters:** `employee_id`, `branch_id`, `status`, `page`, `size`.

---

### PHÂN HỆ 11: LEAVE - NGHỈ PHÉP VÀ QUỸ PHÉP NĂM (`/api/v1/leaves`)

#### `API-063`: Lấy danh mục loại nghỉ phép
- **Method & Path:** `GET /api/v1/leaves/types`
- **Quyền hạn:** Authenticated

---

#### `API-064`: Xem số dư quỹ phép năm (Get Leave Balances)
- **Method & Path:** `GET /api/v1/leaves/balances`
- **Quyền hạn:** Authenticated
- **Query Parameters:** `employee_id` (tùy chọn), `year` (tùy chọn, mặc định năm hiện tại)

---

#### `API-065`: Nộp đơn xin nghỉ phép (Submit Leave Request)
- **Method & Path:** `POST /api/v1/leaves/requests`
- **Quyền hạn:** Authenticated
- **Request Body (`CreateLeaveRequestDto`):**
```json
{
  "leave_type_id": 1,
  "start_date": "2026-11-20",
  "end_date": "2026-11-21",
  "total_days": 2.0,
  "reason": "Giải quyết việc cá nhân"
}
```
- **Error Codes:** `ERR_LEAVE_OVERLAP` (422), `ERR_INSUFFICIENT_BALANCE` (422).

---

#### `API-066`: Xem danh sách đơn nghỉ phép (Get Leave Requests)
- **Method & Path:** `GET /api/v1/leaves/requests`
- **Quyền hạn:** Authenticated
- **Query Parameters:** `employee_id`, `branch_id`, `status`, `page`, `size`.

---

#### `API-067`: Hủy đơn xin nghỉ phép (Cancel Leave Request)
- **Method & Path:** `PUT /api/v1/leaves/requests/{id}/cancel`
- **Quyền hạn:** Authenticated (Người nộp đơn khi đơn đang ở trạng thái `SUBMITTED`, hoặc Quản lý cơ sở)

---

#### `API-068`: Phê duyệt hoặc từ chối đơn nghỉ phép (Review Leave Request)
- **Method & Path:** `PUT /api/v1/leaves/requests/{id}/review`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Request Body (`ReviewLeaveRequestDto`):**
```json
{
  "action": "APPROVE",
  "rejection_reason": null
}
```

---

### PHÂN HỆ 12: REPORT - BÁO CÁO VÀ XUẤT FILE EXCEL/CSV (`/api/v1/reports`)

#### `API-069`: Báo cáo tổng hợp chấm công tháng (Monthly Attendance Summary)
- **Method & Path:** `GET /api/v1/reports/attendance-summary`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Query Parameters:** `branch_id` (tùy chọn đối với Giám đốc), `year` (int), `month` (1-12).

---

#### `API-070`: Xuất báo cáo công tháng ra file Excel (.xlsx)
- **Method & Path:** `GET /api/v1/reports/export/excel`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Response Headers:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="Bao_Cao_Cham_Cong_11_2026.xlsx"`

---

#### `API-071`: Xuất báo cáo công tháng ra file CSV chuẩn UTF-8 BOM
- **Method & Path:** `GET /api/v1/reports/export/csv`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`
- **Response Headers:**
  - `Content-Type: text/csv; charset=UTF-8`
  - `Content-Disposition: attachment; filename="Bao_Cao_Cham_Cong_11_2026.csv"`

---

### PHÂN HỆ 13: DASHBOARD - CHỈ SỐ KPI VÀ TỔNG QUAN HÔM NAY (`/api/v1/dashboard`)

#### `API-072`: Lấy chỉ số tổng quan trong ngày (Dashboard Overview)
- **Method & Path:** `GET /api/v1/dashboard/overview`
- **Quyền hạn:** Authenticated
- **Query Parameters:** `branch_id` (long, tùy chọn)
- **Phản hồi 200 OK:** Quân số, số lượng đi làm hôm nay, số đi muộn, số nghỉ phép có kế hoạch.

---

#### `API-073`: Lấy danh sách các đơn chờ phê duyệt (Pending Approvals)
- **Method & Path:** `GET /api/v1/dashboard/pending-approvals`
- **Quyền hạn:** `ROLE_DIRECTOR`, `ROLE_MANAGER`, `ROLE_ADMIN`
- **Query Parameters:** `branch_id` (long, tùy chọn)
- **Mô tả:** Tổng hợp danh sách đơn nghỉ phép `SUBMITTED` và đơn giải trình công `PENDING`.

---

#### `API-074`: Lấy xu hướng chuyên cần 7 ngày gần nhất (Attendance Trends)
- **Method & Path:** `GET /api/v1/dashboard/attendance-trends`
- **Quyền hạn:** Authenticated
- **Query Parameters:** `branch_id` (long, tùy chọn)

---

### PHÂN HỆ 14: SETTING - THAM SỐ CẤU HÌNH HỆ THỐNG (`/api/v1/settings`)

#### `API-075`: Lấy danh sách cấu hình hệ thống
- **Method & Path:** `GET /api/v1/settings`
- **Quyền hạn:** Authenticated
- **Mô tả:** Đọc các tham số chính sách lao động (`MIN_REST_HOURS_BETWEEN_SHIFTS`, `MAX_WEEKLY_HOURS`, `MAX_CONSECUTIVE_WORK_DAYS`, ...).

---

#### `API-076`: Lấy chi tiết một tham số cấu hình
- **Method & Path:** `GET /api/v1/settings/{key}`
- **Quyền hạn:** Authenticated

---

#### `API-077`: Cập nhật giá trị tham số cấu hình
- **Method & Path:** `PUT /api/v1/settings/{key}`
- **Quyền hạn:** `ROLE_DIRECTOR`
- **Request Body (`UpdateSettingRequest`):**
```json
{
  "setting_value": "12",
  "description": "Khoảng cách nghỉ tối thiểu giữa 2 ca liên tiếp (giờ)"
}
```

---

*Kết thúc Tài liệu 04.*
