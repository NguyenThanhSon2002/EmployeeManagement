package com.company.hrms.modules.setting;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.setting.controller.SettingController;
import com.company.hrms.modules.setting.dto.SystemSettingDto;
import com.company.hrms.modules.setting.dto.UpdateSettingRequest;
import com.company.hrms.modules.setting.service.SystemSettingService;
import com.company.hrms.security.service.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SettingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SystemSettingService settingService;

    @InjectMocks
    private SettingController settingController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(settingController)
                .setCustomArgumentResolvers(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private UsernamePasswordAuthenticationToken createMockAuth() {
        UserPrincipal principal = new UserPrincipal(
                1L, 1L, "admin", "admin@company.com", "hash", true,
                List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR"))
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void testGetAllSettings_Success() throws Exception {
        SystemSettingDto dto = new SystemSettingDto();
        dto.setSettingKey("SCHEDULE_MIN_REST_HOURS");
        dto.setSettingValue("11.0");

        when(settingService.getAllSettings()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].setting_key", is("SCHEDULE_MIN_REST_HOURS")));
    }

    @Test
    void testGetSettingByKey_Success() throws Exception {
        SystemSettingDto dto = new SystemSettingDto();
        dto.setSettingKey("SCHEDULE_MIN_REST_HOURS");
        dto.setSettingValue("11.0");

        when(settingService.getSettingByKey("SCHEDULE_MIN_REST_HOURS")).thenReturn(dto);

        mockMvc.perform(get("/api/v1/settings/SCHEDULE_MIN_REST_HOURS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.setting_value", is("11.0")));
    }

    @Test
    void testUpdateSetting_Success() throws Exception {
        UpdateSettingRequest request = new UpdateSettingRequest();
        request.setSettingValue("12.0");

        SystemSettingDto updated = new SystemSettingDto();
        updated.setSettingKey("SCHEDULE_MIN_REST_HOURS");
        updated.setSettingValue("12.0");

        when(settingService.updateSetting(eq("SCHEDULE_MIN_REST_HOURS"), any(), eq(1L))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/settings/SCHEDULE_MIN_REST_HOURS")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.setting_value", is("12.0")));
    }
}
