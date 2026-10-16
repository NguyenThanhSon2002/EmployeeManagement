package com.company.hrms.modules.employee.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.common.response.PageResponse;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employees", description = "Các API quản lý thông tin hồ sơ nhân sự")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhân viên có phân trang và bộ lọc")
    public PageResponse<EmployeeDto> getEmployees(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "department_id", required = false) Long departmentId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "keyword", required = false) String keyword) {

        // Note: Spring Data is 0-indexed, incoming query is 1-indexed
        int pageIndex = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by("id").ascending());

        Page<EmployeeDto> employeePage = employeeService.getEmployees(departmentId, status, keyword, pageable);
        return PageResponse.from(employeePage);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết nhân viên theo ID")
    public ApiResponse<EmployeeDto> getEmployeeById(@PathVariable Long id) {
        return ApiResponse.success(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Tạo mới hồ sơ nhân viên")
    public ApiResponse<EmployeeDto> createEmployee(@Valid @RequestBody EmployeeDto request) {
        return ApiResponse.success(employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Cập nhật hồ sơ nhân viên")
    public ApiResponse<EmployeeDto> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDto request) {
        return ApiResponse.success(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Xóa mềm hồ sơ nhân viên")
    public ApiResponse<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ApiResponse.success(null);
    }
}
