package com.company.hrms.modules.availability.controller;


import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.availability.dto.EmployeeAvailabilityDto;
import com.company.hrms.modules.availability.dto.SaveAvailabilityRequest;
import com.company.hrms.modules.availability.service.EmployeeAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeAvailabilityController {

    private final EmployeeAvailabilityService availabilityService;

    public EmployeeAvailabilityController(EmployeeAvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/{employeeId}/availability")
    @PreAuthorize("hasAnyRole('ROLE_DIRECTOR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE')")
    public ResponseEntity<ApiResponse<EmployeeAvailabilityDto>> getEmployeeAvailability(
            @PathVariable Long employeeId) {
        EmployeeAvailabilityDto data = availabilityService.getEmployeeAvailability(employeeId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasAnyRole('ROLE_DIRECTOR', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<Map<Long, Map<Integer, List<Long>>>>> getBranchAvailabilities(
            @RequestParam("branch_id") Long branchId) {
        Map<Long, Map<Integer, List<Long>>> data = availabilityService.getBranchAvailabilities(branchId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/preferred-shifts")
    @PreAuthorize("hasAnyRole('ROLE_DIRECTOR', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<Map<Long, List<Long>>>> getBranchPreferredShifts(
            @RequestParam("branch_id") Long branchId) {
        Map<Long, List<Long>> data = availabilityService.getBranchPreferredShifts(branchId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping("/{employeeId}/availability")
    @PreAuthorize("hasAnyRole('ROLE_DIRECTOR', 'ROLE_MANAGER', 'ROLE_EMPLOYEE')")
    public ResponseEntity<ApiResponse<String>> saveAvailability(
            @PathVariable Long employeeId,
            @Valid @RequestBody SaveAvailabilityRequest request) {
        availabilityService.saveAvailability(employeeId, request);
        return ResponseEntity.ok(ApiResponse.success("Lưu lịch đăng ký ca thành công", null));
    }
}