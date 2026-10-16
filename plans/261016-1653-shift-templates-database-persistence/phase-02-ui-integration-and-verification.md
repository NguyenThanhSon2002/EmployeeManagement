# Phase 02: Tích Hợp Giao Diện ShiftTemplatesPage & Kiểm Thử Toàn Diện

**Mục tiêu:** Cập nhật trang [`ShiftTemplatesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/shifts/ShiftTemplatesPage.tsx), xử lý async CRUD và đảm bảo 100% test suites passed (Zero regression).

---

## 1. Tích Hợp Vào `ShiftTemplatesPage.tsx`
- Bổ sung `useEffect` gọi `fetchShiftTemplates()` khi component mount để tải danh mục ca chuẩn từ MySQL:
  ```tsx
  useEffect(() => {
    fetchShiftTemplates();
  }, [fetchShiftTemplates]);
  ```
- Nâng cấp `handleSave` và `handleDelete` để xử lý async/await kèm Toast thông báo lỗi/thành công:
  - Khi lưu ca mới hoặc cập nhật ca: Gọi `await addShiftTemplate(...)` hoặc `await updateShiftTemplate(...)`.
  - Khi xóa ca: Gọi `await deleteShiftTemplate(...)`.
  - Hiển thị Toast thông báo trạng thái rõ ràng.

---

## 2. Kiểm Thử Unit Test & Build Verification
- Chạy toàn bộ test suites hiện có: `npm test -- --run`.
- Đảm bảo các unit tests trong `shifts.test.tsx`, `shift-modal.test.tsx`, `smart-time-picker.test.tsx`, `schedule-integration.test.tsx` đều đạt 100% Xanh.
- Chạy `npm run build` để kiểm tra compile TypeScript và bundle Vite không lỗi.
