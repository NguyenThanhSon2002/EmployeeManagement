package com.company.hrms.modules.auth.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.dto.RefreshTokenRequest;
import com.company.hrms.modules.auth.dto.RegisterRequest;
import com.company.hrms.modules.auth.dto.RegisterResponse;
import com.company.hrms.modules.auth.service.AuthService;
import com.company.hrms.modules.branch.dto.BranchDto;
import com.company.hrms.modules.branch.service.BranchService;
import com.company.hrms.modules.employee.service.EmployeeService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Các API xác thực tài khoản và phiên đăng nhập")
public class AuthController {

    private final AuthService authService;
    private final EmployeeService employeeService;
    private final BranchService branchService;

    public AuthController(AuthService authService, EmployeeService employeeService, BranchService branchService) {
        this.authService = authService;
        this.employeeService = employeeService;
        this.branchService = branchService;
    }

    @GetMapping("/branches")
    @Operation(summary = "Lấy danh sách chi nhánh công khai", description = "Dành cho form đăng ký tài khoản nhân viên mới")
    public ApiResponse<List<BranchDto>> getPublicBranches() {
        return ApiResponse.success(branchService.getAllBranches());
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản nhân viên mới", description = "Tự động tạo nhân viên và tài khoản với role/vị trí là Nhân viên và hợp đồng Thử việc")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = employeeService.registerEmployee(request);
        return ApiResponse.success(response);
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
