package com.company.hrms.modules.shift;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WorkShiftControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        this.adminToken = objectMapper.readTree(responseBody).path("data").path("access_token").asText();
    }

    @Test
    void testGetAllWorkShifts() throws Exception {
        mockMvc.perform(get("/api/v1/work-shifts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    void testCreateAndSoftDeleteWorkShift() throws Exception {
        String shiftCode = "SHIFT_TEST_" + System.currentTimeMillis();
        WorkShiftDto dto = new WorkShiftDto();
        dto.setShiftCode(shiftCode);
        dto.setShiftName("Ca Kiểm Thử Mới");
        dto.setStartTime(LocalTime.of(9, 0));
        dto.setEndTime(LocalTime.of(18, 0));
        dto.setBreakMinutes(60);
        dto.setColorCode("#2F54EB");
        dto.setMinStaffing(2);
        dto.setMaxStaffing(5);

        // 1. Create
        String createRes = mockMvc.perform(post("/api/v1/work-shifts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.shift_code", is(shiftCode)))
                .andReturn().getResponse().getContentAsString();

        long shiftId = objectMapper.readTree(createRes).path("data").path("id").asLong();

        // 2. Delete
        mockMvc.perform(delete("/api/v1/work-shifts/" + shiftId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 3. Verify get by ID returns 404
        mockMvc.perform(get("/api/v1/work-shifts/" + shiftId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
