package com.company.hrms.modules.auth.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.dto.RefreshTokenRequest;
import com.company.hrms.modules.auth.service.AuthService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Các API xác thực tài khoản và phiên đăng nhập")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Xác thực bằng username/password và nhận cặp JWT Token")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token", description = "Sử dụng Refresh Token hợp lệ để cấp phát cặp token mới")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ApiResponse.success(response);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Làm mới Access Token (Alias)", description = "Sử dụng Refresh Token hợp lệ để cấp phát cặp token mới")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ApiResponse.success(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại", description = "Trả về thông tin chi tiết của người dùng đang đăng nhập")
    public ApiResponse<AuthResponse.UserInfo> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        AuthResponse.UserInfo userInfo = authService.getCurrentUser(principal);
        return ApiResponse.success(userInfo);
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu người dùng hiện tại", description = "Cho phép người dùng đang đăng nhập đổi mật khẩu tài khoản")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.company.hrms.modules.auth.dto.ChangePasswordRequest request) {
        authService.changePassword(principal, request);
        return ApiResponse.success(null);
    }
}
