package com.company.hrms.modules.dashboard.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.dashboard.dto.AttendanceTrendDto;
import com.company.hrms.modules.dashboard.dto.DashboardOverviewDto;
import com.company.hrms.modules.dashboard.dto.PendingApprovalDto;
import com.company.hrms.modules.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Các API thống kê chỉ số và danh sách phê duyệt tổng quan")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy các chỉ số KPI tổng quan hôm nay", description = "Quân số, tỷ lệ có mặt, đi muộn, nghỉ phép")
    public ApiResponse<DashboardOverviewDto> getOverview(
            @RequestParam(value = "branch_id", required = false) Long branchId) {
        DashboardOverviewDto dto = dashboardService.getOverview(branchId);
        return ApiResponse.success(dto);
    }

    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'HR_MANAGER', 'DEPT_MANAGER', 'ADMIN')")
    @Operation(summary = "Lấy danh sách các đơn chờ phê duyệt", description = "Tổng hợp đơn nghỉ phép SUBMITTED và giải trình công PENDING")
    public ApiResponse<List<PendingApprovalDto>> getPendingApprovals(
            @RequestParam(value = "branch_id", required = false) Long branchId) {
        List<PendingApprovalDto> list = dashboardService.getPendingApprovals(branchId);
        return ApiResponse.success(list);
    }

    @GetMapping("/attendance-trends")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy xu hướng chuyên cần 7 ngày gần nhất", description = "Tỷ lệ đúng giờ, muộn, vắng theo từng ngày")
    public ApiResponse<List<AttendanceTrendDto>> getAttendanceTrends(
            @RequestParam(value = "branch_id", required = false) Long branchId) {
        List<AttendanceTrendDto> list = dashboardService.getAttendanceTrends(branchId);
        return ApiResponse.success(list);
    }
}
