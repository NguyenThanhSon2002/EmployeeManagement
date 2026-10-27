package com.company.hrms.modules.employee.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.common.response.PageResponse;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.service.EmployeeService;
import com.company.hrms.modules.schedule.dto.EmployeeMonthlyScheduleDto;
import com.company.hrms.modules.schedule.service.ScheduleService;
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
    private final ScheduleService scheduleService;
    private final com.company.hrms.modules.auth.service.AuthService authService;

    public EmployeeController(EmployeeService employeeService,
                              ScheduleService scheduleService,
                              com.company.hrms.modules.auth.service.AuthService authService) {
        this.employeeService = employeeService;
        this.scheduleService = scheduleService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhân viên có phân trang và bộ lọc")
    public PageResponse<EmployeeDto> getEmployees(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "branch_id", required = false) Long branchId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "keyword", required = false) String keyword) {

        // Note: Spring Data is 0-indexed, incoming query is 1-indexed
        int pageIndex = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by("id").ascending());

        Page<EmployeeDto> employeePage = employeeService.getEmployees(branchId, status, keyword, pageable);
        return PageResponse.from(employeePage);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết nhân viên theo ID")
    public ApiResponse<EmployeeDto> getEmployeeById(@PathVariable Long id) {
        return ApiResponse.success(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Tạo mới hồ sơ nhân viên")
    public ApiResponse<EmployeeDto> createEmployee(@Valid @RequestBody EmployeeDto request) {
        return ApiResponse.success(employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Cập nhật hồ sơ nhân viên")
    public ApiResponse<EmployeeDto> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDto request) {
        return ApiResponse.success(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Xóa mềm hồ sơ nhân viên")
    public ApiResponse<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/shifts")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Lấy lịch ca làm việc theo tháng và thống kê của nhân viên")
    public ApiResponse<EmployeeMonthlyScheduleDto> getEmployeeMonthlySchedule(
            @PathVariable Long id,
            @RequestParam(name = "month", required = false) String month) {
        return ApiResponse.success(scheduleService.getEmployeeMonthlySchedule(id, month));
    }

    @PostMapping(value = "/{id}/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Tải lên ảnh đại diện cho nhân viên")
    public ApiResponse<EmployeeDto> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ApiResponse.success(employeeService.uploadAvatar(id, file));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Quản trị viên đặt lại mật khẩu cho nhân viên")
    public ApiResponse<Void> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody com.company.hrms.modules.auth.dto.ResetPasswordRequest request) {
        authService.resetEmployeePassword(id, request);
        return ApiResponse.success(null);
    }
}
