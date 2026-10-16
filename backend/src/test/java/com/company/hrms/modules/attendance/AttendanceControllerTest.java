package com.company.hrms.modules.attendance;

import com.company.hrms.modules.attendance.dto.AttendanceCorrectionDto;
import com.company.hrms.modules.attendance.dto.CheckInRequest;
import com.company.hrms.modules.attendance.dto.CheckOutRequest;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.company.hrms.modules.attendance.repository.AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private com.company.hrms.modules.attendance.repository.AttendanceCorrectionRepository attendanceCorrectionRepository;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        attendanceCorrectionRepository.deleteAll();
        attendanceRecordRepository.deleteAll();

        LoginRequest loginRequest = new LoginRequest("admin", "Admin@123");
        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        this.adminToken = objectMapper.readTree(responseBody).path("data").path("access_token").asText();
    }

    @Test
    void testCheckIn_And_CheckOut_Workflow() throws Exception {
        LocalDate workDate = LocalDate.of(2026, 12, 1);
        CheckInRequest checkInReq = new CheckInRequest("Đi làm đúng giờ");
        checkInReq.setWorkDate(workDate);

        // 1. Check In
        String inRes = mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkInReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.check_in_time", notNullValue()))
                .andReturn().getResponse().getContentAsString();

        long recordId = objectMapper.readTree(inRes).path("data").path("id").asLong();

        // 2. Duplicate Check In -> Conflict 409
        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkInReq)))
                .andExpect(status().isConflict());

        // 3. Check Out
        CheckOutRequest checkOutReq = new CheckOutRequest("Tan ca về nhà");
        checkOutReq.setWorkDate(workDate);

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkOutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.check_out_time", notNullValue()));

        // 4. Submit Correction
        AttendanceCorrectionDto corrDto = new AttendanceCorrectionDto();
        corrDto.setAttendanceRecordId(recordId);
        corrDto.setRequestedCheckIn(LocalDateTime.of(workDate, java.time.LocalTime.of(8, 0)));
        corrDto.setRequestedCheckOut(LocalDateTime.of(workDate, java.time.LocalTime.of(17, 0)));
        corrDto.setReason("Quên mang thẻ chấm công");

        mockMvc.perform(post("/api/v1/attendance/corrections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corrDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    void testGetAttendanceRecords_Filter() throws Exception {
        mockMvc.perform(get("/api/v1/attendance/records?page=1&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()));
    }
}
