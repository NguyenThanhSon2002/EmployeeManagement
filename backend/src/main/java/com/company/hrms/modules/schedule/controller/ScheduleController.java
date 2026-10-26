package com.company.hrms.modules.schedule.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.schedule.dto.*;
import com.company.hrms.modules.schedule.service.ScheduleService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/schedules")
@Tag(name = "Schedule", description = "Các API xếp ca, ma trận lịch tuần và kiểm soát xung đột")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/weekly")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Lấy ma trận lịch tuần", description = "Lấy dữ liệu đầy đủ một tuần gồm nhân sự, ca phân công, mẫu ca và ngày lễ theo chi nhánh")
    public ApiResponse<WeeklyScheduleResponse> getWeeklySchedule(
            @RequestParam(value = "branch_id", defaultValue = "1") Long branchId,
            @RequestParam("start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        WeeklyScheduleResponse response = scheduleService.getWeeklySchedule(branchId, startDate);
        return ApiResponse.success(response);
    }

    @GetMapping("/week")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Lấy ma trận lịch tuần (Alias)", description = "Hỗ trợ alias param date")
    public ApiResponse<WeeklyScheduleResponse> getWeeklyScheduleAlias(
            @RequestParam(value = "branch_id", defaultValue = "1") Long branchId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        LocalDate targetDate = date != null ? date : (startDate != null ? startDate : LocalDate.now());
        WeeklyScheduleResponse response = scheduleService.getWeeklySchedule(branchId, targetDate);
        return ApiResponse.success(response);
    }

    @PostMapping("/validate-conflicts")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Kiểm tra xung đột xếp ca (Dry-run)", description = "Đánh giá các quy tắc BR-001 -> BR-007 mà không lưu dữ liệu")
    public ApiResponse<ConflictValidationResult> validateConflicts(@Valid @RequestBody ValidateConflictsRequest request) {
        ConflictValidationResult result = scheduleService.validateConflicts(request);
        return ApiResponse.success(result);
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Gán hoặc cập nhật phân ca đơn lẻ", description = "Xác thực xung đột, kiểm tra khóa lạc quan và ghi nhật ký")
    public ApiResponse<ShiftAssignmentDto> assignSingleShift(
            @Valid @RequestBody AssignSingleShiftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        ShiftAssignmentDto assignment = scheduleService.assignSingleShift(request, userId);
        return ApiResponse.success(assignment);
    }

    @DeleteMapping("/assignments/{id}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Xóa một ca phân công", description = "Xóa phân ca và ghi nhận lịch sử nếu lịch đã công bố")
    public ApiResponse<Void> deleteAssignment(
            @PathVariable Long id,
            @RequestParam(value = "schedule_version", required = false) Integer scheduleVersion,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        scheduleService.deleteAssignment(id, scheduleVersion, userId);
        return ApiResponse.success(null);
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Gán ca hàng loạt", description = "Gán ca cho nhiều nhân sự trên một khoảng ngày trong một transaction")
    public ApiResponse<List<ShiftAssignmentDto>> bulkAssign(
            @Valid @RequestBody BulkAssignRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        List<ShiftAssignmentDto> assignments = scheduleService.bulkAssign(request, userId);
        return ApiResponse.success(assignments);
    }

    @PostMapping("/assignments/batch")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Lưu phân ca hàng loạt", description = "Lưu danh sách phân ca tự động trong 1 transaction")
    public ApiResponse<List<ShiftAssignmentDto>> batchAssignShifts(
            @Valid @RequestBody BatchAssignItemsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        List<ShiftAssignmentDto> dtos = scheduleService.batchAssignShifts(request, userId);
        return ApiResponse.success(dtos);
    }

    @PostMapping("/copy-week")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Sao chép lịch tuần", description = "Sao chép toàn bộ phân ca từ tuần nguồn sang tuần đích trong 1 transaction")
    public ApiResponse<CopyWeekResponse> copyScheduleWeek(
            @Valid @RequestBody CopyWeekRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        CopyWeekResponse response = scheduleService.copyScheduleWeek(request, userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Công bố lịch làm việc chính thức", description = "Chuyển trạng thái lịch sang PUBLISHED")
    public ApiResponse<WeeklyScheduleResponse> publishSchedule(
            @PathVariable Long id,
            @Valid @RequestBody PublishScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        WeeklyScheduleResponse response = scheduleService.publishSchedule(id, request.getVersion(), userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Hủy công bố lịch", description = "Chuyển trạng thái lịch làm việc về DRAFT")
    public ApiResponse<WeeklyScheduleResponse> unpublishSchedule(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        WeeklyScheduleResponse response = scheduleService.unpublishSchedule(id, userId);
        return ApiResponse.success(response);
    }
}
