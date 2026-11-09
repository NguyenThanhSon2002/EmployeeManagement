package com.company.hrms.modules.payroll.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.payroll.dto.CreateSalaryContractRequest;
import com.company.hrms.modules.payroll.dto.SalaryContractDto;
import com.company.hrms.modules.payroll.service.PayrollService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/salary-contracts")
@Tag(name = "Salary Contract", description = "Quản lý hợp đồng & cấu hình mức lương nhân sự")
public class SalaryContractController {

    private final PayrollService payrollService;

    public SalaryContractController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Thiết lập / Cập nhật hợp đồng mức lương cho nhân viên")
    public ApiResponse<SalaryContractDto> createOrUpdateContract(
            @Valid @RequestBody CreateSalaryContractRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        SalaryContractDto dto = payrollService.createOrUpdateContract(request, actorUserId);
        return ApiResponse.success(dto);
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Lấy hợp đồng mức lương hiện hành của nhân viên")
    public ApiResponse<SalaryContractDto> getContract(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long actorUserId = principal != null ? principal.getId() : 1L;
        SalaryContractDto dto = payrollService.getContractByEmployeeId(employeeId, actorUserId);
        return ApiResponse.success(dto);
    }
}
