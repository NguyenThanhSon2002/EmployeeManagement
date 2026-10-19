package com.company.hrms.modules.leave.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.common.response.PageResponse;
import com.company.hrms.modules.leave.dto.*;
import com.company.hrms.modules.leave.service.LeaveService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
@Tag(name = "Leave", description = "Các API quản lý nghỉ phép, quỹ phép năm và phê duyệt đơn phép")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping("/types")
    @Operation(summary = "Lấy danh mục loại nghỉ phép", description = "Danh sách loại phép có lương, không lương, ốm đau, thai sản")
    public ApiResponse<List<LeaveTypeDto>> getLeaveTypes() {
        List<LeaveTypeDto> types = leaveService.getLeaveTypes();
        return ApiResponse.success(types);
    }

    @GetMapping("/balances")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem quỹ phép năm", description = "Lấy tổng ngày phép cấp, số ngày đã dùng, đang chờ duyệt và còn lại")
    public ApiResponse<List<LeaveBalanceDto>> getLeaveBalances(
            @RequestParam(value = "employee_id", required = false) Long employeeId,
            @RequestParam(value = "year", required = false) Integer year,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = employeeId != null ? employeeId : (principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L));
        List<LeaveBalanceDto> balances = leaveService.getLeaveBalances(empId, year);
        return ApiResponse.success(balances);
    }

    @PostMapping("/requests")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Nộp đơn xin nghỉ phép", description = "Tự động kiểm tra trùng lặp (BR-009) và khấu trừ số ngày vào pending")
    public ApiResponse<LeaveRequestDto> submitLeaveRequest(
            @Valid @RequestBody CreateLeaveRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L);
        LeaveRequestDto dto = leaveService.submitLeaveRequest(empId, request);
        return ApiResponse.success(dto);
    }

    @GetMapping("/requests")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem danh sách đơn nghỉ phép của bản thân", description = "Hỗ trợ phân trang danh sách đơn")
    public PageResponse<LeaveRequestDto> getEmployeeLeaveRequests(
            @RequestParam(value = "employee_id", required = false) Long employeeId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = employeeId != null ? employeeId : (principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L));
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), size);
        Page<LeaveRequestDto> resultPage = leaveService.getEmployeeLeaveRequests(empId, pageRequest);
        return PageResponse.of(resultPage);
    }

    @PutMapping("/requests/{id}/review")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Phê duyệt hoặc từ chối đơn nghỉ phép", description = "Nếu duyệt sẽ chính thức trừ ngày vào used_days của quỹ phép")
    public ApiResponse<LeaveRequestDto> reviewLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody ReviewLeaveRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long reviewerId = principal != null ? principal.getId() : 1L;
        LeaveRequestDto dto = leaveService.reviewLeaveRequest(id, request, reviewerId);
        return ApiResponse.success(dto);
    }
}
