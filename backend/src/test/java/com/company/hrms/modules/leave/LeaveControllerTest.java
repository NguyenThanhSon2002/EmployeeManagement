package com.company.hrms.modules.leave;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.leave.dto.CreateLeaveRequestDto;
import com.company.hrms.modules.leave.dto.ReviewLeaveRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.company.hrms.modules.leave.repository.LeaveRequestRepository leaveRequestRepository;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        leaveRequestRepository.deleteAll();

        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        this.adminToken = objectMapper.readTree(responseBody).path("data").path("access_token").asText();
    }

    @Test
    void testGetLeaveTypes() throws Exception {
        mockMvc.perform(get("/api/v1/leaves/types")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(5))));
    }

    @Test
    void testGetLeaveBalances() throws Exception {
        mockMvc.perform(get("/api/v1/leaves/balances?employee_id=1&year=2026")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())));
    }

    @Test
    void testSubmitLeaveRequest_Lifecycle_And_OverlapCheck() throws Exception {
        LocalDate start = LocalDate.of(2026, 12, 10);
        LocalDate end = LocalDate.of(2026, 12, 11);

        CreateLeaveRequestDto req = new CreateLeaveRequestDto();
        req.setLeaveTypeId(1L); // Annual leave
        req.setStartDate(start);
        req.setEndDate(end);
        req.setTotalDays(BigDecimal.valueOf(2.0));
        req.setReason("Nghỉ phép việc gia đình");

        // 1. Submit leave request
        String res = mockMvc.perform(post("/api/v1/leaves/requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SUBMITTED")))
                .andReturn().getResponse().getContentAsString();

        long requestId = objectMapper.readTree(res).path("data").path("id").asLong();

        // 2. Submit overlapping request -> Expect 422 ERR_LEAVE_OVERLAP (BR-009)
        mockMvc.perform(post("/api/v1/leaves/requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("ERR_LEAVE_OVERLAP")));

        // 3. Review (Approve)
        ReviewLeaveRequestDto reviewDto = new ReviewLeaveRequestDto("APPROVE", null);
        mockMvc.perform(put("/api/v1/leaves/requests/" + requestId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));
    }
}
