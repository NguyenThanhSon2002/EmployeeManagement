# Phase 01: Xây Dựng Service workShiftService & Cập Nhật Store Actions

**Mục tiêu:** Tạo client API service kết nối `/api/v1/work-shifts` và nâng cấp các actions trong [`useScheduleStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/store/useScheduleStore.ts).

---

## 1. Xây Dựng `workShiftService.ts`
Tạo file [`frontend/src/features/shifts/api/workShiftService.ts`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/api/workShiftService.ts):
- `getAllWorkShifts(): Promise<ShiftTemplate[]>`: Gọi `GET /work-shifts`, map DTO snake_case từ Spring Boot về `ShiftTemplate` camelCase.
- `createWorkShift(template: Omit<ShiftTemplate, 'id'>): Promise<ShiftTemplate>`: Gọi `POST /work-shifts`. Chuẩn hóa giờ sang `HH:mm:ss` cho `LocalTime` của Java.
- `updateWorkShift(id: number, data: Partial<ShiftTemplate>): Promise<ShiftTemplate>`: Gọi `PUT /work-shifts/${id}`.
- `deleteWorkShift(id: number): Promise<void>`: Gọi `DELETE /work-shifts/${id}` (soft-delete).

---

## 2. Nâng Cấp `useScheduleStore.ts`
- Thêm action:
  ```ts
  fetchShiftTemplates: () => Promise<void>;
  ```
  Khi gọi, nếu `!isMockEnabled()`, thực thi `workShiftService.getAllWorkShifts()` và cập nhật `shiftTemplates`.
- Nâng cấp `addShiftTemplate`:
  ```ts
  addShiftTemplate: async (template: Omit<ShiftTemplate, 'id'>) => Promise<ShiftTemplate>;
  ```
  Nếu `!isMockEnabled()`, gọi `workShiftService.createWorkShift`, nhận ID thật từ MySQL, cập nhật store.
- Nâng cấp `updateShiftTemplate`:
  ```ts
  updateShiftTemplate: async (id: number, data: Partial<ShiftTemplate>) => Promise<void>;
  ```
  Nếu `!isMockEnabled()`, gọi `workShiftService.updateWorkShift(id, data)`, cập nhật store.
- Nâng cấp `deleteShiftTemplate`:
  ```ts
  deleteShiftTemplate: async (id: number) => Promise<{ success: boolean; error?: string }>;
  ```
  Nếu `!isMockEnabled()`, gọi `workShiftService.deleteWorkShift(id)`, lọc bỏ khỏi store.
- Đảm bảo fallback an toàn khi `isMockEnabled()` hoặc môi trường Vitest để test không bị lỗi mạng.
