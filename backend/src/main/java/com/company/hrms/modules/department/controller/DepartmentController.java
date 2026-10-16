package com.company.hrms.modules.department.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.department.dto.DepartmentDto;
import com.company.hrms.modules.department.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@Tag(name = "Departments", description = "Các API quản lý sơ đồ cơ cấu tổ chức và phòng ban")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả phòng ban")
    public ApiResponse<List<DepartmentDto>> getAllDepartments() {
        return ApiResponse.success(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin phòng ban theo ID")
    public ApiResponse<DepartmentDto> getDepartmentById(@PathVariable Long id) {
        return ApiResponse.success(departmentService.getDepartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Tạo mới phòng ban")
    public ApiResponse<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentDto request) {
        return ApiResponse.success(departmentService.createDepartment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Cập nhật thông tin phòng ban")
    public ApiResponse<DepartmentDto> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDto request) {
        return ApiResponse.success(departmentService.updateDepartment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa mềm phòng ban")
    public ApiResponse<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ApiResponse.success(null);
    }
}
