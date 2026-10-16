# Phase 3: Đồng Bộ Toàn Cục useDirectoryStore & Kiểm Thử Toàn Diện

**Mã giai đoạn:** `PHASE-03`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.5 giờ  
**Mục tiêu chính:** Đảm bảo khi một nhân viên bị xóa, toàn bộ ứng dụng (Xếp ca, Chấm công, Báo cáo) đều lập tức đồng bộ thông qua `useDirectoryStore`, và toàn bộ hệ thống kiểm thử Vitest + JUnit đạt 100% Pass.

---

## 1. Các File Cần Chỉnh Sửa & Kiểm Thử

1. [`frontend/src/shared/directory/useDirectoryStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/shared/directory/useDirectoryStore.ts)
2. [`frontend/src/features/employees/EmployeeListPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeListPage.tsx)
3. [`frontend/src/features/employees/EmployeeDetailPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/employees/EmployeeDetailPage.tsx)
4. [`frontend/src/features/schedule/__tests__/schedule-integration.test.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/schedule/__tests__/schedule-integration.test.tsx)
5. [`backend/src/test/java/com/company/hrms/modules/employee/EmployeeControllerTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/employee/EmployeeControllerTest.java)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Nâng cấp `useDirectoryStore.ts`
- Thêm action `removeEmployeeFromDirectory(id: number)` để cập nhật lạc quan (Optimistic Update) tức thì:
  ```typescript
  removeEmployeeFromDirectory: (id: number) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
  },
  ```
- Kết hợp gọi `removeEmployeeFromDirectory(id)` và `refreshEmployees()` trong luồng xử lý xóa nhân viên.

### Bước 2: Kiểm tra phản ứng liên thông trên các màn hình khác
- **Xếp ca (`SchedulePage`):** Sau khi xóa nhân viên, bộ lọc nhân viên theo phòng ban không còn hiển thị người đã xóa.
- **Chấm công (`AttendanceOverviewPage`):** Không còn hiển thị nhân viên đã xóa trong danh sách điểm danh ngày hôm nay.
- **Báo cáo (`ReportsPage`):** Xuất báo cáo chấm công tháng tự động loại trừ nhân viên đã xóa mềm.

### Bước 3: Chạy Kiểm Thử Toàn Diện & Build Verification
1. **Frontend Vitest:**
   ```powershell
   cd frontend
   npm test -- --run
   ```
   - Mục tiêu: Toàn bộ 11 test suites, 35+ tests đều Pass 100%.
2. **Frontend Production Build:**
   ```powershell
   npm run build
   ```
   - Mục tiêu: 0 lỗi TypeScript, build thành công dưới 1 giây.
3. **Backend Test Suite:**
   ```powershell
   cd ../backend
   mvn test
   ```
   - Mục tiêu: 36+ tests JUnit 5 và Spring Boot Test đều Pass.

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Không xuất hiện lỗi console hoặc giật lag giao diện khi xóa nhân viên.
- [ ] Toàn bộ các màn hình Xếp ca, Chấm công và Báo cáo tự động phản ánh danh sách nhân sự mới.
- [ ] CSDL MySQL cập nhật chính xác `deleted_at` và `is_active = 0`.
- [ ] Build Frontend và Backend hoàn toàn xanh, 0 cảnh báo hồi quy (Zero Regression).
