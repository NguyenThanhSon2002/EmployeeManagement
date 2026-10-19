package com.company.hrms.modules.attendance;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.attendance.controller.AttendanceController;
import com.company.hrms.modules.attendance.dto.AttendanceCorrectionDto;
import com.company.hrms.modules.attendance.dto.AttendanceRecordDto;
import com.company.hrms.modules.attendance.dto.CheckInRequest;
import com.company.hrms.modules.attendance.dto.CheckOutRequest;
import com.company.hrms.modules.attendance.service.AttendanceService;
import com.company.hrms.security.service.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AttendanceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AttendanceService attendanceService;

    @InjectMocks
    private AttendanceController attendanceController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(attendanceController)
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
    void testCheckIn_And_CheckOut_Workflow() throws Exception {
        LocalDate workDate = LocalDate.of(2026, 12, 1);
        AttendanceRecordDto inDto = new AttendanceRecordDto();
        inDto.setId(100L);
        inDto.setEmployeeId(1L);
        inDto.setWorkDate(workDate);
        inDto.setCheckInTime(LocalDateTime.of(workDate, java.time.LocalTime.of(8, 0)));
        inDto.setStatus("PRESENT");

        when(attendanceService.checkIn(eq(1L), any(), any())).thenReturn(inDto);

        CheckInRequest checkInReq = new CheckInRequest("Đi làm đúng giờ");
        checkInReq.setWorkDate(workDate);

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkInReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(100)));

        AttendanceRecordDto outDto = new AttendanceRecordDto();
        outDto.setId(100L);
        outDto.setEmployeeId(1L);
        outDto.setWorkDate(workDate);
        outDto.setCheckOutTime(LocalDateTime.of(workDate, java.time.LocalTime.of(17, 0)));
        outDto.setStatus("PRESENT");

        when(attendanceService.checkOut(eq(1L), any(), any())).thenReturn(outDto);

        CheckOutRequest checkOutReq = new CheckOutRequest("Tan ca");
        checkOutReq.setWorkDate(workDate);

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkOutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.check_out_time", notNullValue()));
    }

    @Test
    void testGetAttendanceRecords_Filter() throws Exception {
        AttendanceRecordDto record = new AttendanceRecordDto();
        record.setId(1L);
        record.setEmployeeId(1L);
        record.setStatus("PRESENT");

        PageImpl<AttendanceRecordDto> page = new PageImpl<>(List.of(record), PageRequest.of(0, 10), 1);
        when(attendanceService.getAttendanceRecords(any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/attendance/records?page=1&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void testSubmitCorrection_Success() throws Exception {
        AttendanceCorrectionDto corrDto = new AttendanceCorrectionDto();
        corrDto.setId(50L);
        corrDto.setAttendanceRecordId(100L);
        corrDto.setRequestedCheckIn(LocalDateTime.of(2026, 12, 1, 8, 0));
        corrDto.setRequestedCheckOut(LocalDateTime.of(2026, 12, 1, 17, 0));
        corrDto.setStatus("PENDING");
        corrDto.setReason("Quên mang thẻ");

        when(attendanceService.submitCorrection(eq(1L), any())).thenReturn(corrDto);

        mockMvc.perform(post("/api/v1/attendance/corrections")
                        .principal(createMockAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corrDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }
}
