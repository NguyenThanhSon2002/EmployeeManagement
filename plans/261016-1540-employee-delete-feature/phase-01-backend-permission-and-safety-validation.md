# Phase 1: Mở Rộng Phân Quyền Backend & Kiểm Tra Ràng Buộc Trưởng Phòng

**Mã giai đoạn:** `PHASE-01`  
**Trạng thái:** Completed ✅  
**Thời lượng dự kiến:** 1.0 giờ  
**Mục tiêu chính:** Mở rộng quyền xóa nhân viên cho `HR_MANAGER` và bảo vệ toàn vẹn dữ liệu tổ chức bằng cách chặn xóa nhân viên đang là Trưởng phòng còn hoạt động.

---

## 1. Các File Cần Chỉnh Sửa

1. [`backend/src/main/java/com/company/hrms/modules/employee/controller/EmployeeController.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/controller/EmployeeController.java)
2. [`backend/src/main/java/com/company/hrms/modules/department/repository/DepartmentRepository.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/department/repository/DepartmentRepository.java)
3. [`backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java`](file:///D:/Project/Employee%20Management/backend/src/main/java/com/company/hrms/modules/employee/service/EmployeeService.java)
4. [`backend/src/test/java/com/company/hrms/modules/employee/EmployeeControllerTest.java`](file:///D:/Project/Employee%20Management/backend/src/test/java/com/company/hrms/modules/employee/EmployeeControllerTest.java)

---

## 2. Chi Tiết Thực Hiện

### Bước 1: Mở rộng phân quyền tại `EmployeeController.java`
Thay đổi annotation `@PreAuthorize` tại phương thức `deleteEmployee`:
```java
@DeleteMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
@Operation(summary = "Xóa mềm hồ sơ nhân viên")
public ApiResponse<Void> deleteEmployee(@PathVariable Long id) {
    employeeService.deleteEmployee(id);
    return ApiResponse.success(null);
}
```

### Bước 2: Bổ sung truy vấn kiểm tra Trưởng phòng tại `DepartmentRepository.java`
Thêm hàm tìm phòng ban theo `manager_id`:
```java
List<Department> findAllByManagerIdAndDeletedAtIsNull(Long managerId);
```

### Bước 3: Kiểm tra ràng buộc Trưởng phòng tại `EmployeeService.java`
Inject `DepartmentRepository` vào `EmployeeService` và cập nhật logic `deleteEmployee`:
```java
@Transactional
public void deleteEmployee(Long id) {
    Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));

    // Kiểm tra nhân viên có đang là Trưởng phòng không
    List<Department> managedDepartments = departmentRepository.findAllByManagerIdAndDeletedAtIsNull(id);
    if (!managedDepartments.isEmpty()) {
        String deptNames = managedDepartments.stream()
                .map(Department::getDepartmentName)
                .collect(Collectors.joining(", "));
        throw new ResourceConflictException("Không thể xóa nhân viên đang giữ vị trí Trưởng phòng (" + deptNames + "). Vui lòng chuyển giao chức vụ trước khi xóa.");
    }

    employee.softDelete();
    employeeRepository.save(employee);
}
```

### Bước 4: Kiểm thử Backend
- Chạy `mvn test -Dtest=EmployeeControllerTest` để xác nhận logic xóa và phân quyền hoạt động hoàn hảo.
- Đảm bảo trả về HTTP 409 khi nhân viên là Trưởng phòng và HTTP 200 khi xóa nhân viên hợp lệ.

---

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Endpoint `DELETE /api/v1/employees/{id}` chấp nhận token của cả `ROLE_ADMIN` và `ROLE_HR_MANAGER`.
- [ ] Chặn xóa và ném lỗi 409 Conflict kèm thông điệp tiếng Việt rõ ràng khi nhân viên đang quản lý phòng ban.
- [ ] Lệnh `mvn test-compile` và kiểm thử unit test backend đạt 100% Pass.
