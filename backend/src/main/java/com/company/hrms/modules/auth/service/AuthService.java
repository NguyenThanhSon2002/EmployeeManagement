package com.company.hrms.modules.auth.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.modules.auth.domain.Role;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.dto.RefreshTokenRequest;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.security.jwt.JwtTokenProvider;
import com.company.hrms.security.service.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final JwtTokenProvider tokenProvider;

    @Value("${security.jwt.access-token-expiration-seconds:86400}")
    private long accessTokenExpirationSeconds;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy thông tin tài khoản", HttpStatus.NOT_FOUND));

        if (!user.getIsActive() || user.getDeletedAt() != null) {
            throw new BusinessException("FORBIDDEN", "Tài khoản của bạn đã bị vô hiệu hóa hoặc xóa", HttpStatus.FORBIDDEN);
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                accessTokenExpirationSeconds,
                buildUserInfo(user)
        );
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("UNAUTHORIZED", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        String tokenType = tokenProvider.getTokenType(refreshToken);
        if (!"REFRESH".equalsIgnoreCase(tokenType)) {
            throw new BusinessException("UNAUTHORIZED", "Token cung cấp không phải là refresh token", HttpStatus.UNAUTHORIZED);
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
                .orElseThrow(() -> new BusinessException("UNAUTHORIZED", "Tài khoản không tồn tại hoặc đã bị xóa", HttpStatus.UNAUTHORIZED));

        if (!user.getIsActive()) {
            throw new BusinessException("FORBIDDEN", "Tài khoản của bạn đã bị vô hiệu hóa", HttpStatus.FORBIDDEN);
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);
        String newRefreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                "Bearer",
                accessTokenExpirationSeconds,
                buildUserInfo(user)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy thông tin người dùng", HttpStatus.NOT_FOUND));

        return buildUserInfo(user);
    }

    private AuthResponse.UserInfo buildUserInfo(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getRoleCode)
                .collect(Collectors.toList());

        Optional<Employee> empOpt = employeeRepository.findByUserIdAndDeletedAtIsNull(user.getId());
        Long employeeId = empOpt.map(Employee::getId).orElse(null);
        String fullName = empOpt.map(Employee::getFullName).orElse(user.getUsername());

        return new AuthResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles,
                employeeId,
                fullName,
                user.getMustChangePassword()
        );
    }
}
