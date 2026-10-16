package com.company.hrms.modules.report;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerTest {

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
    void testGetAttendanceSummary_Success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/attendance-summary?year=2026&month=12")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void testExportExcel_Success() throws Exception {
        byte[] excelBytes = mockMvc.perform(get("/api/v1/reports/export/excel?year=2026&month=12")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Bao_Cao_Cham_Cong_12_2026.xlsx")))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn().getResponse().getContentAsByteArray();

        assertTrue(excelBytes.length > 0, "Excel export should produce non-empty byte array");
        // Check standard ZIP / OOXML magic bytes: PK (0x50, 0x4B)
        assertTrue(excelBytes[0] == 0x50 && excelBytes[1] == 0x4B, "Excel file should start with PK zip header");
    }

    @Test
    void testExportCsv_Success() throws Exception {
        byte[] csvBytes = mockMvc.perform(get("/api/v1/reports/export/csv?year=2026&month=12")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Bao_Cao_Cham_Cong_12_2026.csv")))
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andReturn().getResponse().getContentAsByteArray();

        assertTrue(csvBytes.length > 0, "CSV export should produce non-empty byte array");
        String content = new String(csvBytes, StandardCharsets.UTF_8);
        assertTrue(content.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM for Vietnamese character encoding in Excel");
        assertTrue(content.contains("Mã nhân viên"), "CSV header must contain Vietnamese text columns");
    }

    @Test
    void testUnauthorized_ShouldReturnUnauthorizedOrForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/attendance-summary?year=2026&month=12"))
                .andExpect(status().isForbidden());
    }
}
