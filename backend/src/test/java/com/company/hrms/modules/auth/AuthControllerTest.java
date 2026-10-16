package com.company.hrms.modules.auth;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("admin", "Admin@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.access_token", notNullValue()))
                .andExpect(jsonPath("$.data.token_type", is("Bearer")))
                .andExpect(jsonPath("$.data.user.username", is("admin")))
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_ADMIN")));
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("admin", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_CREDENTIALS")));
    }

    @Test
    void testGetMe_WithToken() throws Exception {
        // 1. Login to get token
        LoginRequest request = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(responseBody).path("data").path("access_token").asText();

        // 2. Call /api/v1/auth/me with Bearer token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("admin")))
                .andExpect(jsonPath("$.data.email", is("admin@company.com")));
    }

    @Test
    void testRefreshToken_Success() throws Exception {
        // 1. Login to get refresh token
        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String refreshToken = objectMapper.readTree(responseBody).path("data").path("refresh_token").asText();

        // 2. Refresh token
        com.company.hrms.modules.auth.dto.RefreshTokenRequest refreshRequest =
                new com.company.hrms.modules.auth.dto.RefreshTokenRequest(refreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.access_token", notNullValue()))
                .andExpect(jsonPath("$.data.refresh_token", notNullValue()));
    }

    @Test
    void testRefreshToken_UsingAccessToken_ShouldFail() throws Exception {
        // 1. Login to get access token
        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(responseBody).path("data").path("access_token").asText();

        // 2. Try to refresh using access token
        com.company.hrms.modules.auth.dto.RefreshTokenRequest refreshRequest =
                new com.company.hrms.modules.auth.dto.RefreshTokenRequest(accessToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testBearerAuth_UsingRefreshToken_ShouldFail() throws Exception {
        // 1. Login to get refresh token
        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String refreshToken = objectMapper.readTree(responseBody).path("data").path("refresh_token").asText();

        // 2. Present refresh token in Bearer authorization header
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isForbidden());
    }
}
