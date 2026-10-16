package com.company.hrms.modules.setting.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.setting.dto.SystemSettingDto;
import com.company.hrms.modules.setting.dto.UpdateSettingRequest;
import com.company.hrms.modules.setting.service.SystemSettingService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "Các API cấu hình tham số hệ thống và chính sách lao động")
public class SettingController {

    private final SystemSettingService settingService;

    public SettingController(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách cấu hình hệ thống", description = "Xem các cấu hình giờ nghỉ tối thiểu, giờ làm tối đa")
    public ApiResponse<List<SystemSettingDto>> getAllSettings() {
        List<SystemSettingDto> settings = settingService.getAllSettings();
        return ApiResponse.success(settings);
    }

    @GetMapping("/{key}")
    @Operation(summary = "Lấy chi tiết một tham số cấu hình", description = "Tra cứu giá trị theo setting_key")
    public ApiResponse<SystemSettingDto> getSettingByKey(@PathVariable String key) {
        SystemSettingDto setting = settingService.getSettingByKey(key);
        return ApiResponse.success(setting);
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật tham số cấu hình", description = "Chỉ Quản trị viên hệ thống có quyền sửa đổi")
    public ApiResponse<SystemSettingDto> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody UpdateSettingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : 1L;
        SystemSettingDto setting = settingService.updateSetting(key, request, userId);
        return ApiResponse.success(setting);
    }
}
