# TÀI LIỆU 04: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)
**Dự án:** Employee Management System  
**Tiêu chuẩn:** RESTful, JSON API, OpenAPI 3.0  
**Gốc URL (Base URL):** `http://localhost:8080/api/v1` (hoặc `https://hrms.company.vn/api/v1`)  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái:** Confirmed / Baseline  

---

## 1. QUY CHUẨN THIẾT KẾ REST API & PHONG BÌ DỮ LIỆU (RESPONSE ENVELOPE)

### 1.1. Tiêu chuẩn Chung
1. Toàn bộ tài nguyên sử dụng danh từ số nhiều (ví dụ: `/employees`, `/schedules`, `/attendance-records`).
2. Mọi dữ liệu trao đổi sử dụng chuẩn mã hóa UTF-8, định dạng JSON (`Content-Type: application/json; charset=UTF-8`).
3. Chuẩn hóa ngày giờ: ISO-8601 UTC string (`YYYY-MM-DDTHH:mm:ssZ`) đối với timestamp; `YYYY-MM-DD` đối với ngày thuần túy; `HH:mm:ss` đối với giờ ca.
4. Mọi yêu cầu bảo vệ bắt buộc đính kèm Header: `Authorization: Bearer <access_token>`.

### 1.2. Cấu trúc Phong Bì Dữ liệu Thành Công (Standard Success Envelope)
Tất cả các API trả về thành công đều tuân thủ cấu trúc đồng nhất:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-13T08:15:30Z",
    "request_id": "req-9a8b7c6d-5e4f"
  }
}
```

### 1.3. Cấu trúc Phân Trang (Standard Pagination Envelope)
Áp dụng cho các danh sách có phân trang server-side (`/employees`, `/attendance-records`, `/leave-requests`):

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "size": 20,
      "total_elements": 142,
      "total_pages": 8,
      "has_next": true,
      "has_previous": false
    },
    "timestamp": "2026-10-13T08:15:30Z"
  }
}
```

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
        "field": "hire_date",
        "rejected_value": null,
        "message": "Ngày vào làm không được để trống."
      }
    ],
    "timestamp": "2026-10-13T08:15:30Z",
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
| `403` | `FORBIDDEN` | Người dùng không đủ quyền hạn hoặc truy cập ngoài phạm vi dữ liệu cho phép |
| `404` | `RESOURCE_NOT_FOUND` | Không tìm thấy bản ghi theo ID yêu cầu |
| `409` | `RESOURCE_CONFLICT` | Dữ liệu bị trùng khóa duy nhất (Email, Mã NV, CCCD đã tồn tại) |
| `409` | `OPTIMISTIC_LOCK_CONFLICT`| Bản ghi lịch đã bị người dùng khác sửa đổi (Version mismatch) |
| `422` | `ERR_SHIFT_OVERLAP` | [BR-001] Trùng ca làm việc của một nhân viên |
| `422` | `ERR_INVALID_EMPLOYEE_STATUS`| [BR-002] Nhân viên đã thôi việc hoặc bị vô hiệu hóa |
| `422` | `ERR_LEAVE_OVERLAP` | [BR-009] Trùng lặp đơn xin nghỉ phép |
| `429` | `TOO_MANY_REQUESTS` | Vượt quá giới hạn tần suất yêu cầu (Rate limiting) |
| `500` | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ nội bộ ngoài dự kiến |

---

## 2. DANH MỤC API THEO PHÂN HỆ CHỨC NĂNG

---

### PHÂN HỆ AUTH: XÁC THỰC VÀ TÀI KHOẢN CÁ NHÂN

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
      "department_id": 2,
      "department_name": "Phòng Vận hành Dịch vụ",
      "roles": ["ROLE_DEPT_MANAGER", "ROLE_EMPLOYEE"]
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

#### `API-004`: Lấy thông tin cá nhân hiện tại (Get Current Profile)
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
    "department_name": "Phòng Vận hành Dịch vụ",
    "position_name": "Trưởng nhóm Ca trực",
    "annual_leave_remaining": 8.5
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

### PHÂN HỆ EMPLOYEE: QUẢN LÝ HỒ SƠ NHÂN SỰ

#### `API-006`: Lấy danh sách nhân viên phân trang (Get Employees)
- **Method & Path:** `GET /api/v1/employees`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER` (Scope: Dept)
- **Query Parameters:**
  - `page` (int, default 1), `size` (int, default 20)
  - `search` (string, tìm mã, tên, email, sđt)
  - `department_id` (long, tùy chọn)
  - `employment_status` (string, `OFFICIAL`, `PROBATION`, `RESIGNED`)
  - `sort` (string, ví dụ: `id,desc` hoặc `full_name,asc`)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "full_name": "Nguyễn Văn An",
      "email": "an.nguyen@company.vn",
      "phone_number": "0912345678",
      "department_id": 2,
      "department_name": "Phòng Vận hành Dịch vụ",
      "position_name": "Trưởng nhóm Ca trực",
      "employment_status": "OFFICIAL",
      "employment_type": "FULL_TIME",
      "hire_date": "2023-03-15",
      "is_active": true
    }
  ],
  "meta": {
    "pagination": { "page": 1, "size": 20, "total_elements": 1, "total_pages": 1 }
  }
}
```

---

#### `API-007`: Tạo hồ sơ nhân viên mới (Create Employee)
- **Method & Path:** `POST /api/v1/employees`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`
- **Request Body:**
```json
{
  "employee_code": "EMP-002",
  "full_name": "Trần Thị Bích",
  "email": "bich.tran@company.vn",
  "phone_number": "0987654321",
  "national_id": "001199002233",
  "date_of_birth": "1995-08-20",
  "gender": "FEMALE",
  "address": "Số 45 Đường Giải Phóng, Hà Nội",
  "department_id": 2,
  "position_id": 4,
  "manager_id": 1,
  "employment_status": "OFFICIAL",
  "employment_type": "FULL_TIME",
  "hire_date": "2024-01-10"
}
```
- **Phản hồi 201 Created:** Trả về đối tượng nhân viên vừa tạo.

---

#### `API-008`: Lấy chi tiết hồ sơ nhân viên (Get Employee Detail)
- **Method & Path:** `GET /api/v1/employees/{id}`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER` (thuộc phòng), `ROLE_EMPLOYEE` (chính mình).

---

#### `API-009`: Cập nhật hồ sơ nhân viên (Update Employee)
- **Method & Path:** `PUT /api/v1/employees/{id}`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`

---

#### `API-010`: Vô hiệu hóa / Thôi việc nhân viên (Deactivate/Soft-delete Employee)
- **Method & Path:** `DELETE /api/v1/employees/{id}`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`
- **Hành động:** Gán `is_active = false`, `status = 'RESIGNED'`, `deleted_at = NOW()`. Tuyệt đối không xóa vật lý.

---

### PHÂN HỆ ORG: PHÒNG BAN VÀ CHỨC DANH

- `API-011`: `GET /api/v1/departments` (Lấy cây phòng ban phân cấp - Authenticated)
- `API-012`: `POST /api/v1/departments` (Tạo phòng ban mới - Admin/HR)
- `API-013`: `PUT /api/v1/departments/{id}` (Sửa phòng ban, kiểm tra circular hierarchy - Admin/HR)
- `API-014`: `DELETE /api/v1/departments/{id}` (Xóa mềm phòng ban, kiểm tra còn nhân viên không - Admin/HR)
- `API-015`: `GET /api/v1/positions` (Lấy danh mục chức danh - Authenticated)
- `API-016`: `POST /api/v1/positions` (Tạo chức danh mới - Admin/HR)
- `API-017`: `PUT /api/v1/positions/{id}` (Sửa chức danh - Admin/HR)
- `API-018`: `DELETE /api/v1/positions/{id}` (Xóa chức danh - Admin/HR)

---

### PHÂN HỆ WORK SHIFT: MẪU CA LÀM VIỆC (SHIFT TEMPLATES)

#### `API-019`: Lấy danh sách mẫu ca làm việc (Get Work Shifts)
- **Method & Path:** `GET /api/v1/work-shifts`
- **Quyền hạn:** Authenticated
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
      "applicable_days": "1,2,3,4,5,6"
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
      "applicable_days": "1,2,3,4,5,6,7"
    }
  ]
}
```

---

#### `API-020`: Tạo mẫu ca làm việc mới (Create Work Shift)
- **Method & Path:** `POST /api/v1/work-shifts`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`

---

#### `API-021`: Cập nhật mẫu ca làm việc (Update Work Shift)
- **Method & Path:** `PUT /api/v1/work-shifts/{id}`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`
- **Lưu ý:** Không làm ảnh hưởng tới các phân ca đã gán nhờ kiến trúc Snapshotting.

---

### PHÂN HỆ SCHEDULE: QUẢN LÝ PHÂN CA VÀ LỊCH LÀM VIỆC (CORE)

#### `API-022`: Lấy ma trận lịch làm việc tuần của phòng ban (Get Weekly Roster)
- **Method & Path:** `GET /api/v1/schedules/weekly`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Query Parameters:**
  - `department_id` (long, bắt buộc)
  - `start_date` (date string, ví dụ: `2026-10-12`)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "schedule_id": 101,
    "department_id": 2,
    "department_name": "Phòng Vận hành Dịch vụ",
    "start_date": "2026-10-12",
    "end_date": "2026-10-18",
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
            "work_date": "2026-10-12",
            "work_shift_id": 1,
            "shift_name": "Ca Sáng Tiêu Chuẩn",
            "start_time": "08:00:00",
            "end_time": "17:00:00",
            "is_cross_midnight": false,
            "color_code": "#E6F7FF",
            "warnings": []
          }
        ]
      }
    ],
    "holidays": [
      { "date": "2026-10-18", "name": "Ngày nghỉ lễ nội bộ" }
    ]
  }
}
```

---

#### `API-023`: Kiểm tra xung đột trước khi lưu (Dry-Run Conflict Check)
- **Method & Path:** `POST /api/v1/schedules/validate-conflicts`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "department_id": 2,
  "assignments": [
    {
      "employee_id": 2,
      "work_shift_id": 1,
      "work_date": "2026-10-13"
    }
  ]
}
```
- **Phản hồi 200 OK khi phát hiện xung đột:**
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "has_mandatory_errors": false,
    "has_warnings": true,
    "mandatory_errors": [],
    "warnings": [
      {
        "employee_id": 2,
        "employee_name": "Trần Thị Bích",
        "rule_code": "WARN_INSUFFICIENT_REST_TIME",
        "message": "Khoảng cách nghỉ ngơi giữa 2 ca liên tiếp là 8.0 giờ (dưới mức tối thiểu 12.0 giờ).",
        "work_date": "2026-10-13"
      }
    ]
  }
}
```

---

#### `API-024`: Gán ca đơn lẻ hoặc cập nhật phân ca (Assign / Update Single Shift)
- **Method & Path:** `POST /api/v1/schedules/assignments`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "schedule_id": 101,
  "employee_id": 2,
  "work_shift_id": 1,
  "work_date": "2026-10-13",
  "override_rule": "WARN_INSUFFICIENT_REST_TIME",
  "override_reason": "Nhân viên đồng ý đổi ca hỗ trợ khẩn cấp",
  "schedule_version": 4
}
```
- **Error Codes:** `ERR_SHIFT_OVERLAP` (422), `OPTIMISTIC_LOCK_CONFLICT` (409).

---

#### `API-024B`: Gán ca hàng loạt (Bulk Assign Shifts)
- **Method & Path:** `POST /api/v1/schedules/bulk-assign`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "schedule_id": 101,
  "employee_ids": [1, 2, 3, 4],
  "work_shift_id": 1,
  "from_date": "2026-10-12",
  "to_date": "2026-10-16",
  "schedule_version": 4
}
```

---

#### `API-024C`: Sao chép lịch từ tuần trước (Copy Previous Week)
- **Method & Path:** `POST /api/v1/schedules/copy-week`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "department_id": 2,
  "source_start_date": "2026-10-05",
  "target_start_date": "2026-10-12",
  "target_schedule_id": 101,
  "schedule_version": 4
}
```

---

#### `API-024D`: Công bố lịch làm việc chính thức (Publish Schedule)
- **Method & Path:** `POST /api/v1/schedules/{id}/publish`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "version": 4
}
```
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "schedule_id": 101,
    "status": "PUBLISHED",
    "published_at": "2026-10-13T08:30:00Z",
    "version": 5
  }
}
```

---

#### `API-024E`: Hủy công bố lịch làm việc (Unpublish Schedule)
- **Method & Path:** `POST /api/v1/schedules/{id}/unpublish`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`

---

### PHÂN HỆ ATTENDANCE: QUẢN LÝ CHẤM CÔNG VÀ GIẢI TRÌNH

#### `API-025`: Nhân viên bấm Check-in (Web Check-in)
- **Method & Path:** `POST /api/v1/attendance/check-in`
- **Quyền hạn:** Authenticated (`ROLE_EMPLOYEE`)
- **Request Body:**
```json
{
  "note": "Đi làm tại sảnh chính"
}
```
- **Phản hồi 201 Created:**
```json
{
  "success": true,
  "data": {
    "attendance_id": 8801,
    "employee_id": 1,
    "work_date": "2026-10-13",
    "check_in_time": "2026-10-13T07:55:12Z",
    "status": "PRESENT",
    "late_minutes": 0,
    "source": "WEB_PORTAL"
  }
}
```

---

#### `API-026`: Nhân viên bấm Check-out (Web Check-out)
- **Method & Path:** `POST /api/v1/attendance/check-out`
- **Quyền hạn:** Authenticated (`ROLE_EMPLOYEE`)
- **Phản hồi 200 OK:**
```json
{
  "success": true,
  "data": {
    "attendance_id": 8801,
    "check_out_time": "2026-10-13T17:05:40Z",
    "actual_hours": 8.08,
    "night_hours": 0.0,
    "status": "PRESENT"
  }
}
```

---

#### `API-027`: Lấy bảng tổng quan chấm công theo ngày (Get Daily Attendance Overview)
- **Method & Path:** `GET /api/v1/attendance/daily`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Query Parameters:** `date` (bắt buộc), `department_id`, `status`, `page`, `size`.

---

#### `API-028`: Tạo đơn giải trình / điều chỉnh chấm công (Create Correction Request)
- **Method & Path:** `POST /api/v1/attendance/corrections`
- **Quyền hạn:** Authenticated
- **Request Body:**
```json
{
  "attendance_record_id": 8790,
  "requested_check_in": "2026-10-12T08:00:00Z",
  "requested_check_out": "2026-10-12T17:05:00Z",
  "reason": "Máy tính sập nguồn cuối ca nên quên quét trên web portal.",
  "attachment_url": null
}
```

---

#### `API-029`: Phê duyệt đơn giải trình chấm công (Approve Correction)
- **Method & Path:** `POST /api/v1/attendance/corrections/{id}/approve`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`

---

#### `API-030`: Từ chối đơn giải trình chấm công (Reject Correction)
- **Method & Path:** `POST /api/v1/attendance/corrections/{id}/reject`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Request Body:**
```json
{
  "rejection_reason": "Không có camera xác thực người có mặt tại văn phòng."
}
```

---

### PHÂN HỆ LEAVE: NGHỈ PHÉP VÀ NGÀY LỄ

#### `API-031`: Nộp đơn xin nghỉ phép (Submit Leave Request)
- **Method & Path:** `POST /api/v1/leaves/requests`
- **Quyền hạn:** Authenticated
- **Request Body:**
```json
{
  "leave_type_id": 1,
  "start_date": "2026-10-20",
  "end_date": "2026-10-21",
  "total_days": 2.0,
  "reason": "Giải quyết việc gia đình riêng."
}
```
- **Error Codes:** `ERR_LEAVE_OVERLAP` (422), `ERR_INSUFFICIENT_BALANCE` (422).

---

#### `API-032`: Lấy danh sách đơn nghỉ phép (Get Leave Requests)
- **Method & Path:** `GET /api/v1/leaves/requests`
- **Quyền hạn:** Authenticated (lọc scope theo role)

---

#### `API-033`: Phê duyệt đơn nghỉ phép (Approve Leave Request)
- **Method & Path:** `POST /api/v1/leaves/requests/{id}/approve`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`

---

#### `API-034`: Lấy số dư phép năm của nhân viên (Get Leave Balances)
- **Method & Path:** `GET /api/v1/leaves/balances/me`
- **Quyền hạn:** Authenticated

---

### PHÂN HỆ REPORT: BÁO CÁO VÀ XUẤT DỮ LIỆU EXCEL/CSV

#### `API-035`: Báo cáo tổng hợp công tháng (Monthly Attendance Report)
- **Method & Path:** `GET /api/v1/reports/monthly-attendance`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Query Parameters:** `month` (1-12), `year` (2026), `department_id`.

---

#### `API-036`: Báo cáo đối chiếu Kế hoạch vs Thực tế (Scheduled vs Actual Report)
- **Method & Path:** `GET /api/v1/reports/scheduled-vs-actual`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`

---

#### `API-037`: Xuất báo cáo ra file Excel (.xlsx) (Export Excel)
- **Method & Path:** `GET /api/v1/reports/export/excel`
- **Quyền hạn:** `ROLE_ADMIN`, `ROLE_HR_MANAGER`, `ROLE_DEPT_MANAGER`
- **Query Parameters:** `report_type` (`MONTHLY_ATTENDANCE`, `DAILY_OVERVIEW`, `SCHEDULED_VS_ACTUAL`), `month`, `year`, `department_id`.
- **Response Headers:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="Bao_Cao_Cong_Thang_10_2026.xlsx"`

---

#### `API-037B`: Xuất báo cáo ra file CSV (Export CSV)
- **Method & Path:** `GET /api/v1/reports/export/csv`
- **Response Headers:** `Content-Type: text/csv; charset=UTF-8`

---

### PHÂN HỆ SYSTEM: CÀI ĐẶT VÀ QUẢN TRỊ TÀI KHOẢN

- `API-038`: `GET /api/v1/users` (Danh sách tài khoản người dùng - Admin)
- `API-039`: `PUT /api/v1/users/{id}/status` (Khóa / Mở khóa tài khoản - Admin)
- `API-040`: `GET /api/v1/settings` (Lấy danh mục tham số chính sách - Admin/HR)
- `API-041`: `PUT /api/v1/settings` (Cập nhật tham số chính sách hệ thống - Admin)
- `API-042`: `GET /api/v1/audit-logs` (Xem nhật ký kiểm toán hệ thống - Admin)

---
*Kết thúc Tài liệu 04.*
