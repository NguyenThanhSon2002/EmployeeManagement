package com.company.hrms.modules.schedule;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.schedule.dto.AssignSingleShiftRequest;
import com.company.hrms.modules.schedule.dto.PublishScheduleRequest;
import com.company.hrms.modules.schedule.dto.ValidateConflictsRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleControllerTest {

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
    void testGetWeeklySchedule() throws Exception {
        mockMvc.perform(get("/api/v1/schedules/weekly?department_id=1&start_date=2026-10-12")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.schedule_id", notNullValue()))
                .andExpect(jsonPath("$.data.department_id", is(1)))
                .andExpect(jsonPath("$.data.employees", notNullValue()))
                .andExpect(jsonPath("$.data.shift_templates", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    void testValidateConflicts_DryRun() throws Exception {
        ValidateConflictsRequest.CandidateAssignmentItem item = new ValidateConflictsRequest.CandidateAssignmentItem();
        item.setEmployeeId(1L);
        item.setWorkShiftId(1L);
        item.setWorkDate(LocalDate.of(2026, 10, 14));

        ValidateConflictsRequest request = new ValidateConflictsRequest();
        request.setDepartmentId(1L);
        request.setAssignments(List.of(item));

        mockMvc.perform(post("/api/v1/schedules/validate-conflicts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.has_mandatory_errors", notNullValue()));
    }

    @Test
    void testAssignSingleShift_Lifecycle_And_OptimisticLock() throws Exception {
        // 1. Get weekly schedule for department 2 (IT/Operations)
        String weekRes = mockMvc.perform(get("/api/v1/schedules/weekly?department_id=2&start_date=2026-11-02")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode weekData = objectMapper.readTree(weekRes).path("data");
        long scheduleId = weekData.path("schedule_id").asLong();
        int initialVersion = weekData.path("version").asInt();

        // 2. Assign shift (Ca Sáng on 2026-11-02 for Employee 1)
        AssignSingleShiftRequest assignReq = new AssignSingleShiftRequest();
        assignReq.setScheduleId(scheduleId);
        assignReq.setEmployeeId(1L);
        assignReq.setWorkShiftId(1L); // Ca Sáng
        assignReq.setWorkDate(LocalDate.of(2026, 11, 2));
        assignReq.setScheduleVersion(initialVersion);

        String assignRes = mockMvc.perform(post("/api/v1/schedules/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.shift_name", notNullValue()))
                .andExpect(jsonPath("$.data.start_time", notNullValue()))
                .andReturn().getResponse().getContentAsString();

        long createdAssignmentId = objectMapper.readTree(assignRes).path("data").path("id").asLong();

        // 3. Try to assign with outdated version -> Expect 409 Conflict
        assignReq.setWorkDate(LocalDate.of(2026, 11, 3));
        assignReq.setScheduleVersion(initialVersion); // Stale version!
        mockMvc.perform(post("/api/v1/schedules/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code", is("OPTIMISTIC_LOCK_CONFLICT")));

        // 4. Try overlapping shift on 2026-11-02 -> Expect 422 ERR_SHIFT_OVERLAP
        assignReq.setWorkDate(LocalDate.of(2026, 11, 2));
        assignReq.setScheduleVersion(initialVersion + 1); // Current version
        mockMvc.perform(post("/api/v1/schedules/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("ERR_SHIFT_OVERLAP")));

        // 5. Delete the created assignment
        mockMvc.perform(delete("/api/v1/schedules/assignments/" + createdAssignmentId + "?schedule_version=" + (initialVersion + 1))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testPublishAndUnpublishSchedule() throws Exception {
        // 1. Get weekly schedule
        String weekRes = mockMvc.perform(get("/api/v1/schedules/weekly?department_id=3&start_date=2026-11-09")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode weekData = objectMapper.readTree(weekRes).path("data");
        long scheduleId = weekData.path("schedule_id").asLong();
        int version = weekData.path("version").asInt();

        // 2. Publish
        PublishScheduleRequest pubReq = new PublishScheduleRequest(version);
        mockMvc.perform(post("/api/v1/schedules/" + scheduleId + "/publish")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pubReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));

        // 3. Unpublish back to DRAFT
        mockMvc.perform(post("/api/v1/schedules/" + scheduleId + "/unpublish")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }
}
