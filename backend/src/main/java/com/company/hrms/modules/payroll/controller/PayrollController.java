package com.company.hrms.modules.payroll.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.payroll.dto.*;
import com.company.hrms.modules.payroll.service.PayrollService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payrolls")
@Tag(name = "Payroll", description = "Tính lương tự động, duyệt bảng lương và phiếu lương điện tử")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Khởi tạo / Tính toán lại bảng lương tháng theo chi nhánh", description = "Tự động gom giờ công, phụ cấp ca đêm 30%, thưởng chuyên cần, trừ đi muộn, BHXH và Thuế TNCN")
    public ApiResponse<PayrollDetailResponse> generatePayroll(
            @Valid @RequestBody GeneratePayrollRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        PayrollDetailResponse response = payrollService.generatePayroll(
                request.getBranchId(),
                request.getMonth(),
                request.getYear(),
                actorUserId
        );
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")
    @Operation(summary = "Phê duyệt chốt bảng lương", description = "Chốt bảng lương sang trạng thái APPROVED/LOCKED, không cho phép tính toán lại")
    public ApiResponse<PayrollSummaryDto> approvePayroll(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        PayrollSummaryDto dto = payrollService.approvePayroll(id, actorUserId);
        return ApiResponse.success(dto);
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")
    @Operation(summary = "Mở lại bảng lương", description = "Chuyển bảng lương từ APPROVED về DRAFT để Giám đốc/Admin có thể chỉnh sửa lại")
    public ApiResponse<PayrollSummaryDto> reopenPayroll(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        PayrollSummaryDto dto = payrollService.reopenPayroll(id, actorUserId);
        return ApiResponse.success(dto);
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ADMIN')")
    @Operation(summary = "Điều chỉnh thông tin chi tiết phiếu lương nhân viên", description = "Chỉ Giám đốc / Admin có quyền điều chỉnh giờ công, phụ cấp, thưởng phạt và ghi chú; hệ thống tự động tính lại thuế và lương thực nhận")
    public ApiResponse<PayrollItemDto> updatePayrollItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdatePayrollItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        PayrollItemDto dto = payrollService.updatePayrollItem(itemId, request, actorUserId);
        return ApiResponse.success(dto);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Danh sách bảng lương theo năm và chi nhánh")
    public ApiResponse<List<PayrollSummaryDto>> getPayrolls(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "branch_id", required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        List<PayrollSummaryDto> list = payrollService.getPayrolls(year, branchId, actorUserId);
        return ApiResponse.success(list);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Xem chi tiết bảng lương và danh sách chi trả của từng nhân viên")
    public ApiResponse<PayrollDetailResponse> getPayrollDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        PayrollDetailResponse response = payrollService.getPayrollDetails(id, actorUserId);
        return ApiResponse.success(response);
    }

    @GetMapping("/my-payslip")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem phiếu lương điện tử cá nhân của người dùng đang đăng nhập")
    public ApiResponse<MyPayslipResponse> getMyPayslip(
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        MyPayslipResponse response = payrollService.getMyPayslip(month, year, actorUserId);
        return ApiResponse.success(response);
    }
}
