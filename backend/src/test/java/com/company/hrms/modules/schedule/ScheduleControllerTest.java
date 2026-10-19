package com.company.hrms.modules.schedule;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.schedule.controller.ScheduleController;
import com.company.hrms.modules.schedule.dto.*;
import com.company.hrms.modules.schedule.service.ScheduleService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ScheduleControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ScheduleService scheduleService;

    @InjectMocks
    private ScheduleController scheduleController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(scheduleController)
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
    void testGetWeeklySchedule_Success() throws Exception {
        WeeklyScheduleResponse response = new WeeklyScheduleResponse();
        response.setScheduleId(1L);
        response.setBranchId(1L);
        response.setStartDate(LocalDate.of(2026, 10, 12));
        response.setEndDate(LocalDate.of(2026, 10, 18));
        response.setStatus("PUBLISHED");

        when(scheduleService.getWeeklySchedule(eq(1L), any(LocalDate.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/schedules/weekly?branch_id=1&start_date=2026-10-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.schedule_id", is(1)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));
    }

    @Test
    void testValidateConflicts_Success() throws Exception {
        ValidateConflictsRequest request = new ValidateConflictsRequest();
        request.setBranchId(1L);

        ValidateConflictsRequest.CandidateAssignmentItem item = new ValidateConflictsRequest.CandidateAssignmentItem();
        item.setEmployeeId(1L);
        item.setWorkShiftId(1L);
        item.setWorkDate(LocalDate.of(2026, 10, 15));
        request.setAssignments(List.of(item));

        ConflictValidationResult result = new ConflictValidationResult();

        when(scheduleService.validateConflicts(any(ValidateConflictsRequest.class))).thenReturn(result);

        mockMvc.perform(post("/api/v1/schedules/validate-conflicts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.is_valid", is(true)));
    }

    @Test
    void testAssignSingleShift_Success() throws Exception {
        AssignSingleShiftRequest request = new AssignSingleShiftRequest();
        request.setScheduleId(1L);
        request.setEmployeeId(1L);
        request.setWorkShiftId(1L);
        request.setWorkDate(LocalDate.of(2026, 10, 15));
        request.setScheduleVersion(0);

        ShiftAssignmentDto dto = new ShiftAssignmentDto();
        dto.setId(100L);
        dto.setScheduleId(1L);
        dto.setEmployeeId(1L);
        dto.setWorkDate(LocalDate.of(2026, 10, 15));

        when(scheduleService.assignSingleShift(any(), eq(1L))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/schedules/assignments")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(100)));
    }

    @Test
    void testPublishSchedule_Success() throws Exception {
        PublishScheduleRequest request = new PublishScheduleRequest();
        request.setVersion(0);

        WeeklyScheduleResponse response = new WeeklyScheduleResponse();
        response.setScheduleId(1L);
        response.setStatus("PUBLISHED");

        when(scheduleService.publishSchedule(eq(1L), eq(0), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/schedules/1/publish")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));
    }
}
