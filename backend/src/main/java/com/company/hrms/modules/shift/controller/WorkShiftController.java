package com.company.hrms.modules.shift.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.service.WorkShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/work-shifts")
@Tag(name = "Work Shift", description = "Các API quản lý danh mục mẫu ca làm việc (Shift Templates)")
public class WorkShiftController {

    private final WorkShiftService workShiftService;

    public WorkShiftController(WorkShiftService workShiftService) {
        this.workShiftService = workShiftService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách mẫu ca làm việc", description = "Trả về danh sách tất cả các ca làm việc đang hoạt động")
    public ApiResponse<List<WorkShiftDto>> getAllWorkShifts() {
        List<WorkShiftDto> shifts = workShiftService.getAllWorkShifts();
        return ApiResponse.success(shifts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một ca làm việc", description = "Trả về chi tiết ca theo ID")
    public ApiResponse<WorkShiftDto> getWorkShiftById(@PathVariable Long id) {
        WorkShiftDto shift = workShiftService.getWorkShiftById(id);
        return ApiResponse.success(shift);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Tạo mẫu ca làm việc mới", description = "Dành riêng cho Admin và Quản lý nhân sự")
    public ApiResponse<WorkShiftDto> createWorkShift(@Valid @RequestBody WorkShiftDto request) {
        WorkShiftDto created = workShiftService.createWorkShift(request);
        return ApiResponse.success(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Cập nhật mẫu ca làm việc", description = "Sửa thông tin ca (không làm sai lệch lịch sử nhờ snapshotting)")
    public ApiResponse<WorkShiftDto> updateWorkShift(
            @PathVariable Long id,
            @Valid @RequestBody WorkShiftDto request) {
        WorkShiftDto updated = workShiftService.updateWorkShift(id, request);
        return ApiResponse.success(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Xóa mềm mẫu ca làm việc", description = "Ẩn mẫu ca khỏi danh sách phân ca mới")
    public ApiResponse<Void> deleteWorkShift(@PathVariable Long id) {
        workShiftService.deleteWorkShift(id);
        return ApiResponse.success(null);
    }
}
