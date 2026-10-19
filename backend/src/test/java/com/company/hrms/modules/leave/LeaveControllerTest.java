package com.company.hrms.modules.leave;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.leave.controller.LeaveController;
import com.company.hrms.modules.leave.dto.CreateLeaveRequestDto;
import com.company.hrms.modules.leave.dto.LeaveRequestDto;
import com.company.hrms.modules.leave.dto.LeaveTypeDto;
import com.company.hrms.modules.leave.dto.ReviewLeaveRequestDto;
import com.company.hrms.modules.leave.service.LeaveService;
import com.company.hrms.security.service.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LeaveControllerTest {

    private MockMvc mockMvc;

    @Mock
    private LeaveService leaveService;

    @InjectMocks
    private LeaveController leaveController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(leaveController)
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
    void testGetLeaveTypes_Success() throws Exception {
        LeaveTypeDto typeDto = new LeaveTypeDto();
        typeDto.setId(1L);
        typeDto.setTypeName("Nghỉ phép năm");
        typeDto.setIsPaid(true);

        when(leaveService.getLeaveTypes()).thenReturn(List.of(typeDto));

        mockMvc.perform(get("/api/v1/leaves/types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].type_name", is("Nghỉ phép năm")));
    }

    @Test
    void testSubmitLeaveRequest_Success() throws Exception {
        CreateLeaveRequestDto request = new CreateLeaveRequestDto();
        request.setLeaveTypeId(1L);
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 12));
        request.setTotalDays(new java.math.BigDecimal("3.0"));
        request.setReason("Nghỉ phép thường niên");

        LeaveRequestDto responseDto = new LeaveRequestDto();
        responseDto.setId(10L);
        responseDto.setEmployeeId(1L);
        responseDto.setStatus("PENDING");

        when(leaveService.submitLeaveRequest(eq(1L), any())).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/leaves/requests")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(10)))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    void testReviewLeaveRequest_Success() throws Exception {
        ReviewLeaveRequestDto reviewDto = new ReviewLeaveRequestDto();
        reviewDto.setAction("APPROVE");
        reviewDto.setRejectionReason(null);

        LeaveRequestDto responseDto = new LeaveRequestDto();
        responseDto.setId(10L);
        responseDto.setStatus("APPROVED");

        when(leaveService.reviewLeaveRequest(eq(10L), any(), eq(1L))).thenReturn(responseDto);

        mockMvc.perform(put("/api/v1/leaves/requests/10/review")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("APPROVED")));
    }
}
