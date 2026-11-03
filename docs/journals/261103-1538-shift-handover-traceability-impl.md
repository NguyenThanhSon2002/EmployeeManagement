---
title: "Implementation: Lưu vết nhân sự ban đầu & hiển thị thu gọn khi nhường ca"
date: 2026-11-03
author: Antigravity
topic: schedule, handover, shift-cell, UI
---

# Technical Journal: Shift Handover Traceability Implementation

## Context
Hoàn thiện triển khai toàn diện giải pháp lưu vết nhân sự ban đầu khi nhường ca (`HANDOVER`) theo kế hoạch `plans/261103-1526-shift-handover-traceability/plan.md`.

## Key Implementations
1. **Database & Entity:**
   - Tạo Flyway migration `V24__add_transferred_from_employee_id_to_shift_assignments.sql`.
   - Bổ sung `transferredFromEmployeeId` vào Entity `ShiftAssignment.java` và DTO `ShiftAssignmentDto.java`.
2. **Backend Logic & DTO Mapping:**
   - Cập nhật `ShiftSwapService.approveSwap`: Khi duyệt `HANDOVER`, gán `reqAssign.setTransferredFromEmployeeId(swap.getRequesterId())`, `reqAssign.setEmployeeId(swap.getTargetId())`.
   - Chuẩn hóa format chuỗi ghi chú giải trình: `[Người nhường] ([Mã]) nhường ca cho [Người nhận] ([Mã]) theo [Mã đơn]: [Lý do]`.
   - Ánh xạ thông tin người nhường trong `ScheduleAssignmentService.toDto`.
3. **Frontend UI/UX:**
   - Cập nhật `domain.types.ts`, `scheduleService.ts`, `useScheduleStore.ts`.
   - `ShiftGridCell.tsx`:
     - Người nhận ca đi làm thực tế có huy hiệu `Nhận thay` kèm tooltip chi tiết.
     - Dưới danh sách nhân sự đi làm, xuất hiện nút thu gọn `▾ N NV đã nhường ca`.
     - Khi bấm mở rộng: Hiển thị chip mờ gạch ngang `~~Tên~~` kèm nhãn `Đã nhường` và tooltip chỉ rõ người nhường, người nhận và lý do giải trình.
   - `OverrideReasonModal.tsx`:
     - Bổ sung banner thông tin `Ca được chuyển nhượng từ: [Tên NV] ([Mã])`.
     - Phân định rõ lý do giải trình gốc và khóa chỉnh sửa với thông báo tự động.
4. **Kiểm thử:**
   - Backend `mvn test`: 21/21 tests passed (BUILD SUCCESS).
   - Frontend `npm run build`: tsc & vite bundle thành công 100%.
