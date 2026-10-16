package com.company.hrms.modules.employee;

import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EmployeeControllerTest {

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
    void testGetEmployees_Pagination() throws Exception {
        mockMvc.perform(get("/api/v1/employees?page=1&size=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(lessThanOrEqualTo(5))))
                .andExpect(jsonPath("$.meta.pagination.page", is(1)))
                .andExpect(jsonPath("$.meta.pagination.size", is(5)))
                .andExpect(jsonPath("$.meta.pagination.total_elements", greaterThan(0)));
    }

    @Test
    void testGetEmployeeById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/employees/1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.employee_code", is("EMP-001")))
                .andExpect(jsonPath("$.data.full_name", is("Nguyễn Văn An")));
    }

    @Test
    void testGetEmployeeById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/employees/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    void testCreateEmployee_ConflictDuplicateCode() throws Exception {
        EmployeeDto request = new EmployeeDto();
        request.setEmployeeCode("EMP-001"); // Already exists in V3 seed
        request.setFullName("Người Trùng Mã");
        request.setEmail("trungma@company.com");
        request.setPhoneNumber("0988776655");
        request.setDepartmentId(1L);
        request.setPositionId(1L);
        request.setHireDate(LocalDate.now());

        mockMvc.perform(post("/api/v1/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("RESOURCE_CONFLICT")));
    }

    @Test
    void testCreateAndSoftDeleteEmployee() throws Exception {
        String uniqueCode = "EMP-TEST-" + System.currentTimeMillis();
        EmployeeDto request = new EmployeeDto();
        request.setEmployeeCode(uniqueCode);
        request.setFullName("Nhân Viên Thử Nghiệm");
        request.setEmail("test." + System.currentTimeMillis() + "@company.com");
        request.setPhoneNumber("09" + String.valueOf(System.currentTimeMillis()).substring(5));
        request.setDepartmentId(1L);
        request.setPositionId(1L);
        request.setHireDate(LocalDate.now());

        // 1. Create
        String createRes = mockMvc.perform(post("/api/v1/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employee_code", is(uniqueCode)))
                .andReturn().getResponse().getContentAsString();

        long createdId = objectMapper.readTree(createRes).path("data").path("id").asLong();

        // 2. Soft Delete
        mockMvc.perform(delete("/api/v1/employees/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 3. Verify Not Found after soft delete
        mockMvc.perform(get("/api/v1/employees/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateEmployee_OptimisticLockFailure() throws Exception {
        // 1. Get employee 1
        String empRes = mockMvc.perform(get("/api/v1/employees/1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        EmployeeDto dto = objectMapper.readValue(
                objectMapper.readTree(empRes).path("data").toString(),
                EmployeeDto.class
        );

        // 2. Set outdated/wrong version
        int currentVersion = dto.getVersion() != null ? dto.getVersion() : 0;
        dto.setVersion(currentVersion + 99);

        // 3. Update employee with stale version
        mockMvc.perform(put("/api/v1/employees/1")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("OPTIMISTIC_LOCK_CONFLICT")));
    }
}
