package com.company.hrms.modules.branch.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.branch.dto.BranchDto;
import com.company.hrms.modules.branch.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@Tag(name = "Branches", description = "Các API quản lý chi nhánh / cơ sở làm việc")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả chi nhánh")
    public ApiResponse<List<BranchDto>> getAllBranches() {
        return ApiResponse.success(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi nhánh theo ID")
    public ApiResponse<BranchDto> getBranchById(@PathVariable Long id) {
        return ApiResponse.success(branchService.getBranchById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Tạo mới chi nhánh")
    public ApiResponse<BranchDto> createBranch(@Valid @RequestBody BranchDto request) {
        return ApiResponse.success(branchService.createBranch(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Cập nhật thông tin chi nhánh")
    public ApiResponse<BranchDto> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchDto request) {
        return ApiResponse.success(branchService.updateBranch(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Xóa mềm chi nhánh")
    public ApiResponse<Void> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ApiResponse.success(null);
    }
}
