# Journal: Bổ Sung Trường Ngày Hoạt Động (opened_date) Cho Chi Nhánh

- **Ngày ghi nhận:** 2026-10-26
- **Chủ đề:** Thêm trường nghiệp vụ `opened_date` cho Chi nhánh (bảng `branches`), cập nhật Backend, DTO, Modal tạo/sửa chi nhánh và bảng danh sách.

## 1. Vấn Đề Ghi Nhận
- Hồ sơ nhân viên đã có `hire_date` (ngày vào làm), nhưng bảng chi nhánh (`branches`) hiện chỉ có `created_at` (ngày tạo record trong DB) mà chưa có trường nghiệp vụ `opened_date` (ngày chính thức hoạt động/khai trương).
- Cần bổ sung trường này để:
  1. Hiển thị ngày hoạt động của cơ sở trên danh sách và form quản trị chi nhánh.
  2. Chuẩn hóa nghiệp vụ chặn dưới bộ lọc lịch ca của nhân viên: `minMonth = max(employee.hireDate, branch.openedDate)`.

## 2. Quyết Định Thống Nhất (Sau Khi Brainstorm)
- **Database:** Tạo migration Flyway `V12__add_opened_date_to_branches.sql` thêm cột `opened_date DATE NOT NULL DEFAULT (CURRENT_DATE)`. Backfill ngày `2026-01-01` cho 3 chi nhánh ban đầu.
- **Backend:** Cập nhật Entity `Branch`, `BranchDto`, ánh xạ trong `BranchService` và liên kết với `ScheduleService`.
- **Frontend:**
  - Cập nhật interface `Branch` trong `domain.types.ts`.
  - Cập nhật `BranchFormModal.tsx`: Thêm trường chọn Ngày hoạt động (bắt buộc, mặc định ngày hiện tại khi tạo mới).
  - Cập nhật `BranchesPage.tsx`: Hiển thị ngày hoạt động của chi nhánh dưới tên cơ sở.

## 3. Kết Quả Triển Khai & Kiểm Thử
- **Migration Flyway `V12__add_opened_date_to_branches.sql`:** Đã khởi chạy thành công trên cơ sở dữ liệu `hrms_db`. Cột `opened_date DATE NOT NULL DEFAULT (CURRENT_DATE)` đã được thêm và 3 chi nhánh mặc định cập nhật ngày hoạt động `2026-01-01`.
- **Backend Domain & Services:**
  - [`Branch.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/branch/domain/Branch.java): Bổ sung `openedDate` với ánh xạ `@Column(name = "opened_date", nullable = false)`.
  - [`BranchDto.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/branch/dto/BranchDto.java): Bổ sung `@NotNull` và `@JsonProperty("opened_date")`.
  - [`BranchService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/branch/service/BranchService.java): Ánh xạ chính xác `openedDate` khi tạo, sửa và chuyển đổi sang DTO.
  - [`ScheduleService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/schedule/service/ScheduleService.java): Tận dụng `branch.openedDate` làm mốc chặn dưới lịch ca (`earliest_available_month`).
- **Frontend UI & Data Model:**
  - [`domain.types.ts`](file:///D:/Project/Employee%20Management/frontend/src/types/domain.types.ts): Bổ sung `openedDate` và `opened_date` trong interface `Branch`.
  - [`BranchFormModal.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/branches/components/BranchFormModal.tsx): Bổ sung input chọn ngày hoạt động (bắt buộc, mặc định hôm nay khi tạo mới).
  - [`BranchesPage.tsx`](file:///D:/Project/Employee%20Management/frontend/src/features/branches/BranchesPage.tsx): Hiển thị badge `Hoạt động từ: DD/MM/YYYY` kèm icon lịch dưới tên mỗi chi nhánh.
  - [`useDirectoryStore.ts`](file:///D:/Project/Employee%20Management/frontend/src/shared/directory/useDirectoryStore.ts): Bổ sung giá trị mẫu cho các chi nhánh seed.
- **Verification & Hotfix:**
  - `mvn test-compile` thành công 100%.
  - `npm run build` thành công 100%, không phát sinh lỗi TypeScript.
  - Sửa lỗi `VALIDATION_FAILED` khi cập nhật chi nhánh: Bổ sung `opened_date: data.openedDate || data.opened_date` vào payload `createBranch` và `updateBranch` trong [`branchService.ts`](file:///D:/Project/Employee%20Management/frontend/src/shared/branch/branchService.ts), đồng thời ánh xạ `openedDate` trong `toBranch()` và `useDirectoryStore.ts`.
  - API `GET /api/v1/branches`, `POST /api/v1/branches`, `PUT /api/v1/branches/1`, `DELETE /api/v1/branches` và `GET /api/v1/employees/1/shifts` đã được kiểm thử trả về dữ liệu `opened_date` và `earliest_available_month: "2026-01"` chính xác 100%.

## 4. Tài Liệu Kế Hoạch & Báo Cáo Liên Quan
- Kế hoạch triển khai: [`plans/261026-1630-branch-opened-date/plan.md`](file:///D:/Project/Employee%20Management/plans/261026-1630-branch-opened-date/plan.md)
- Báo cáo brainstorm: [`plans/reports/261026-1628-brainstorm-branch-opened-date.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1628-brainstorm-branch-opened-date.md)
- Báo cáo phân tích lỗi cập nhật: [`plans/reports/261026-1642-brainstorm-branch-update-validation-error.md`](file:///D:/Project/Employee%20Management/plans/reports/261026-1642-brainstorm-branch-update-validation-error.md)

