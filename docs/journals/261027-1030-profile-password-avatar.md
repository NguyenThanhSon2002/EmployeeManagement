# Technical Journal: Profile Password Change & Avatar Upload Implementation

**Date:** 2026-10-27  
**Branch:** `dev`  
**Plan:** `plans/261027-1030-profile-password-avatar/plan.md`  

---

## 1. Summary of Changes

Implemented full-stack capability for updating user password and employee avatar on the Employee Detail Page (`/employees/:id`):

1. **Avatar Upload & Static Storage:**
   - **Database:** Created Flyway migration `V9__add_employee_avatar.sql` adding `avatar_url` (VARCHAR 500) to `employees`.
   - **Domain & DTO:** Added `avatarUrl` to `Employee` entity and `EmployeeDto`.
   - **File Storage:** Added `FileStorageService.java` with validation (< 5MB, JPG/PNG/WEBP), storing to `uploads/avatars/`.
   - **Static Resource Serving:** Configured `WebMvcConfig.java` to map `/uploads/**` and enabled permitAll in `SecurityConfig.java`.
   - **Frontend UI:** Added interactive Camera hover overlay on avatar in `EmployeeDetailPage.tsx`, instant preview/upload, and synchronized with `useAuthStore` (updating Topbar immediately) and `useDirectoryStore`.

2. **Password Change & Admin Reset:**
   - **DTOs:** Created `ChangePasswordRequest.java` and `ResetPasswordRequest.java`.
   - **Backend Endpoints:**
     - `POST /api/v1/auth/change-password`: Self password update verifying old password via BCrypt.
     - `POST /api/v1/employees/{id}/reset-password`: Director reset without needing old password.
   - **Frontend UI:**
     - Created `ChangePasswordModal.tsx` supporting self-change and admin-reset modes.
     - Added `[Đổi mật khẩu]` / `[Đặt lại mật khẩu]` action button to Header Card on `EmployeeDetailPage.tsx`.

## 2. Verification
- `mvn test-compile`: BUILD SUCCESS (0 compile errors).
- `npm run build`: SUCCESS (TypeScript & Vite build passed cleanly).
