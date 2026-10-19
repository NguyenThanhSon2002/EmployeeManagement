package com.company.hrms.modules.position.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.position.dto.PositionDto;
import com.company.hrms.modules.position.service.PositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/positions")
@Tag(name = "Positions", description = "Các API danh mục vị trí và chức danh công việc")
public class PositionController {

    private final PositionService positionService;

    public PositionController(PositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả chức danh")
    public ApiResponse<List<PositionDto>> getAllPositions() {
        return ApiResponse.success(positionService.getAllPositions());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chức danh theo ID")
    public ApiResponse<PositionDto> getPositionById(@PathVariable Long id) {
        return ApiResponse.success(positionService.getPositionById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Tạo mới chức danh")
    public ApiResponse<PositionDto> createPosition(@Valid @RequestBody PositionDto request) {
        return ApiResponse.success(positionService.createPosition(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Cập nhật chức danh")
    public ApiResponse<PositionDto> updatePosition(@PathVariable Long id, @Valid @RequestBody PositionDto request) {
        return ApiResponse.success(positionService.updatePosition(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTOR')")
    @Operation(summary = "Xóa mềm chức danh")
    public ApiResponse<Void> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ApiResponse.success(null);
    }
}
