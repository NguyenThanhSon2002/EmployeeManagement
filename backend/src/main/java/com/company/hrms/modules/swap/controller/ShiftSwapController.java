package com.company.hrms.modules.swap.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.swap.dto.*;
import com.company.hrms.modules.swap.service.ShiftSwapService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shift-swaps")
@Tag(name = "Shift Swap", description = "Các API đổi ca và nhường ca giữa nhân sự")
public class ShiftSwapController {

    private final ShiftSwapService swapService;

    public ShiftSwapController(ShiftSwapService swapService) {
        this.swapService = swapService;
    }

    private Long getEffectiveEmpId(UserPrincipal principal) {
        return principal != null && principal.getEmployeeId() != null
                ? principal.getEmployeeId()
                : (principal != null ? principal.getId() : 1L);
    }

    private boolean isDirectorOrAdmin(UserPrincipal principal) {
        return principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_DIRECTOR".equalsIgnoreCase(a.getAuthority())
                        || "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()));
    }

    private boolean isManager(UserPrincipal principal) {
        return principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_MANAGER".equalsIgnoreCase(a.getAuthority()));
    }

    @PostMapping("/simulate")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mô phỏng đổi ca kiểm tra xung đột", description = "Chạy thử nghiệm thuật toán kiểm tra luật lao động trước khi tạo đơn")
    public ApiResponse<SimulateSwapResponse> simulateSwap(
            @Valid @RequestBody SimulateSwapRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        return ApiResponse.success(swapService.simulateSwap(request, empId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tạo yêu cầu đổi/nhường ca", description = "Nhân viên khởi tạo yêu cầu đổi ca chéo hoặc nhường ca")
    public ApiResponse<ShiftSwapResponse> createSwapRequest(
            @Valid @RequestBody CreateSwapRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        boolean directorOrAdmin = isDirectorOrAdmin(principal);
        boolean manager = isManager(principal);
        return ApiResponse.success(swapService.createSwapRequest(request, empId, directorOrAdmin, manager));
    }

    @PutMapping("/{id}/peer-respond")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đồng nghiệp phản hồi yêu cầu đổi ca", description = "Chấp nhận (ACCEPT) hoặc từ chối (REJECT) yêu cầu từ đồng nghiệp")
    public ApiResponse<ShiftSwapResponse> peerRespond(
            @PathVariable Long id,
            @Valid @RequestBody PeerRespondRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        return ApiResponse.success(swapService.peerRespond(id, request, empId));
    }

    @PutMapping("/{id}/manager-review")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Quản lý xét duyệt đơn đổi ca", description = "Phê duyệt (APPROVE) hoặc bác bỏ (REJECT) đơn đổi ca")
    public ApiResponse<ShiftSwapResponse> managerReview(
            @PathVariable Long id,
            @Valid @RequestBody ManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        boolean directorOrAdmin = isDirectorOrAdmin(principal);
        return ApiResponse.success(swapService.managerReview(id, request, empId, directorOrAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy yêu cầu đổi ca", description = "Người khởi tạo tự hủy yêu cầu khi chưa được duyệt")
    public ApiResponse<ShiftSwapResponse> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        boolean directorOrAdmin = isDirectorOrAdmin(principal);
        return ApiResponse.success(swapService.cancelRequest(id, empId, directorOrAdmin));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy danh sách yêu cầu của tôi", description = "Danh sách các đơn tôi đã tạo hoặc đồng nghiệp nhờ tôi đổi")
    public ApiResponse<List<ShiftSwapResponse>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = getEffectiveEmpId(principal);
        return ApiResponse.success(swapService.getMyRequests(empId));
    }

    @GetMapping("/pending-manager")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Lấy danh sách đơn cần Quản lý duyệt", description = "Danh sách các đơn đã được đồng nghiệp đồng ý và chờ duyệt")
    public ApiResponse<List<ShiftSwapResponse>> getPendingManagerRequests(
            @RequestParam Long branchId) {
        return ApiResponse.success(swapService.getPendingManagerRequests(branchId));
    }

    @GetMapping("/branch-history")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Lấy toàn bộ lịch sử đơn đổi ca của chi nhánh", description = "Xem lịch sử tất cả các đơn đổi ca tại chi nhánh")
    public ApiResponse<List<ShiftSwapResponse>> getAllBranchRequests(
            @RequestParam Long branchId) {
        return ApiResponse.success(swapService.getAllBranchRequests(branchId));
    }
}
