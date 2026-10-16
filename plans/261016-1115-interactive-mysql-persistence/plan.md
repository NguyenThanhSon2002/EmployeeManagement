---
title: "Kế Hoạch Khắc Phục Tương Tác 2 Chiều & Lưu Trữ Dữ Liệu Thực Tế Vào CSDL MySQL"
description: "Kế hoạch toàn diện giải quyết triệt để vấn đề giao diện không lưu tương tác và chưa liên kết DB: cấp JWT Token tự động, kết nối RoleSwitcher với Auth thật, sửa 8 lỗi TypeScript, và đảm bảo 100% tương tác CRUD lưu thẳng vào MySQL."
status: completed
priority: P1
effort: 8h
branch: main
tags: [interaction, persistence, mysql, auth, role-switcher, schedule, attendance, leave]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Kế Hoạch Khắc Phục Tương Tác 2 Chiều & Lưu Trữ Dữ Liệu Thực Tế Vào CSDL MySQL

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

Người dùng phản ánh: *"Các thông tin chưa liên kết với dữ liệu trong db và mọi sự tương tác đều chưa được lưu thay đổi (tất cả các tính năng)"*.

### Nguyên nhân kỹ thuật cốt lõi:
1. **Khoảng trống Token (Auth Token Gap):** Spring Boot chặn mọi API với `403 Forbidden` do Frontend chưa có JWT token trong `localStorage`. Khi bị 403, giao diện tự lùi về dữ liệu mẫu (Mock Data) trong RAM. Mọi thao tác gán ca, check-in, duyệt phép chỉ đổi RAM và biến mất khi bấm F5.
2. **RoleSwitcher chưa kết nối Auth thật:** Đổi vai trò trên Topbar chỉ đổi state FE, chưa gọi `POST /api/v1/auth/login` để cấp JWT token thực tế của các tài khoản có sẵn trong DB (`admin`, `manager`, `employee`).
3. **Lỗi TypeScript:** 8 lỗi biên dịch TypeScript đang ngăn cản `npm run build` và gây lệch chuẩn DTO giữa Backend và Frontend.
4. **Thiếu phản hồi lưu DB (Toast):** Chưa có thông báo trực quan khi lưu thành công vào MySQL hoặc khi bị chặn bởi luật lao động (BR-001 -> BR-008).

---

## 2. Mục Tiêu Kế Hoạch

- **100% Tương tác được lưu vào MySQL:** Thao tác xếp ca, xóa ca, check-in, check-out, nộp đơn phép, duyệt đơn phép đều được ghi nhận trực tiếp vào các bảng `shift_assignments`, `attendance_records`, `leave_requests` trong MySQL. Bấm F5 dữ liệu vẫn giữ nguyên vẹn.
- **Tự động cấp Token & Live RoleSwitcher:** Khi vào web, tự động cấp JWT Token thực của `admin / Admin@123`. Khi đổi vai trò trên Topbar, tự động đổi sang Token thật của `manager / Admin@123` hoặc `employee / Admin@123`.
- **Sửa dứt điểm 8 lỗi TypeScript:** Lệnh `npm run build` hoàn thành với 0 lỗi, 0 cảnh báo.
- **Bảo toàn 71/71 Automated Tests:** Bộ kiểm thử Backend (36 tests) và Frontend (35 tests) tiếp tục đạt 100% Pass.

---

## 3. Các Giai Đoạn Thực Hiện

| Giai đoạn | Tên Giai Đoạn & Nhiệm Vụ Trọng Tâm | Trạng Thái | Thời Lượng | Chi Tiết |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | [Sửa Lỗi TypeScript, Auto-Auth Bootstrap & Live RoleSwitcher](./phase-01-auth-bootstrap-and-type-fixes.md) | Completed ✅ | 2.5h | Cấp token tự động, đổi vai trò gọi API thật, sửa 8 lỗi type |
| **Phase 2** | [Đấu Nối Tương Tác & Lưu Trữ Bảng Phân Ca Tuần Vào MySQL](./phase-02-schedule-matrix-persistence.md) | Completed ✅ | 3.0h | Gán ca, đổi ca, xóa ca, công bố lịch lưu trực tiếp vào DB, báo Toast |
| **Phase 3** | [Đấu Nối Tương Tác Chấm Công, Nghỉ Phép & Nghiệm Thu Toàn Diện](./phase-03-attendance-leave-employee-persistence.md) | Completed ✅ | 2.5h | Check-in, check-out, duyệt đơn phép, cập nhật nhân viên, test 71/71 |

---

## 4. Tiêu Chuẩn Kỹ Thuật (Architecture Standards)

1. **Token Auto-Refresh & Injection:** `apiClient.ts` luôn tự động gắn `Authorization: Bearer <token>` vào mọi HTTP request.
2. **Dual-Mode Graceful Fallback:** Khi chạy Vitest (`MODE === 'test'`), hệ thống tự động cách ly và dùng Mock; khi chạy trình duyệt (`MODE !== 'test'`), hệ thống gọi 100% API MySQL thật.
3. **Bi-directional Feedback:** Bất kỳ thao tác lưu DB nào cũng kích hoạt Toast:
   - 🟢 `Thành công`: *"Đã lưu ca làm việc vào CSDL MySQL"* / *"Check-in thành công"*.
   - 🔴 `Lỗi nghiệp vụ`: Hiển thị chi tiết lỗi vi phạm (ví dụ: *"Trùng ca làm việc BR-001"*).
