package com.company.hrms.modules.auth;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.auth.controller.AuthController;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.dto.RefreshTokenRequest;
import com.company.hrms.modules.auth.service.AuthService;
import com.company.hrms.security.service.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setCustomArgumentResolvers(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testLogin_Success() throws Exception {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                1L, "admin", "admin@company.com", List.of("ROLE_DIRECTOR"), 1L, "Nguyễn Văn An", false
        );
        AuthResponse mockResponse = new AuthResponse("mock-access-token", "mock-refresh-token", "Bearer", 86400L, userInfo);

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        LoginRequest request = new LoginRequest("admin", "Admin@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.access_token", is("mock-access-token")))
                .andExpect(jsonPath("$.data.token_type", is("Bearer")))
                .andExpect(jsonPath("$.data.user.username", is("admin")))
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_DIRECTOR")));
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessException("INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED));

        LoginRequest request = new LoginRequest("admin", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_CREDENTIALS")));
    }

    @Test
    void testGetMe_Success() throws Exception {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                1L, "admin", "admin@company.com", List.of("ROLE_DIRECTOR"), 1L, "Nguyễn Văn An", false
        );

        when(authService.getCurrentUser(any())).thenReturn(userInfo);

        UserPrincipal principal = new UserPrincipal(
                1L, 1L, "admin", "admin@company.com", "hash", true,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_DIRECTOR"))
        );
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        mockMvc.perform(get("/api/v1/auth/me").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("admin")))
                .andExpect(jsonPath("$.data.email", is("admin@company.com")))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_DIRECTOR")));
    }

    @Test
    void testRefreshToken_Success() throws Exception {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                1L, "admin", "admin@company.com", List.of("ROLE_DIRECTOR"), 1L, "Nguyễn Văn An", false
        );
        AuthResponse mockResponse = new AuthResponse("new-access-token", "new-refresh-token", "Bearer", 86400L, userInfo);

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(mockResponse);

        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.access_token", is("new-access-token")))
                .andExpect(jsonPath("$.data.refresh_token", is("new-refresh-token")));
    }

    @Test
    void testRefreshToken_InvalidToken_ThrowsException() throws Exception {
        when(authService.refreshToken(any(RefreshTokenRequest.class)))
                .thenThrow(new BusinessException("INVALID_TOKEN", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED));

        RefreshTokenRequest request = new RefreshTokenRequest("invalid-refresh-token");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_TOKEN")));
    }

    @Test
    void testRefreshTokenAlias_Success() throws Exception {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                1L, "admin", "admin@company.com", List.of("ROLE_DIRECTOR"), 1L, "Nguyễn Văn An", false
        );
        AuthResponse mockResponse = new AuthResponse("new-access-token", "new-refresh-token", "Bearer", 86400L, userInfo);

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(mockResponse);

        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.access_token", is("new-access-token")));
    }
}
