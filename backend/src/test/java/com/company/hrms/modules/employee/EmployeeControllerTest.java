package com.company.hrms.modules.employee;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import org.springframework.dao.OptimisticLockingFailureException;
import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.employee.controller.EmployeeController;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.service.EmployeeService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EmployeeService employeeService;

    @InjectMocks
    private EmployeeController employeeController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(employeeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private EmployeeDto createSampleEmployee(Long id, String code, String name) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(id);
        dto.setEmployeeCode(code);
        dto.setFullName(name);
        dto.setEmail(code.toLowerCase() + "@company.com");
        dto.setPhoneNumber("0901234567");
        dto.setNationalId("001202001111");
        dto.setBranchId(1L);
        dto.setPositionId(1L);
        dto.setEmploymentStatus("OFFICIAL");
        dto.setEmploymentType("FULL_TIME");
        dto.setHireDate(LocalDate.of(2024, 1, 1));
        dto.setIsActive(true);
        dto.setVersion(0);
        return dto;
    }

    @Test
    void testGetEmployees_Pagination() throws Exception {
        EmployeeDto emp = createSampleEmployee(1L, "EMP-001", "Nguyễn Văn An");
        PageImpl<EmployeeDto> page = new PageImpl<>(List.of(emp), PageRequest.of(0, 5), 1);

        when(employeeService.getEmployees(any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/employees?page=1&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.meta.pagination.page", is(1)))
                .andExpect(jsonPath("$.meta.pagination.total_elements", is(1)));
    }

    @Test
    void testGetEmployeeById_Success() throws Exception {
        EmployeeDto emp = createSampleEmployee(1L, "EMP-001", "Nguyễn Văn An");
        when(employeeService.getEmployeeById(1L)).thenReturn(emp);

        mockMvc.perform(get("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.employee_code", is("EMP-001")))
                .andExpect(jsonPath("$.data.full_name", is("Nguyễn Văn An")));
    }

    @Test
    void testGetEmployeeById_NotFound() throws Exception {
        when(employeeService.getEmployeeById(999999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy nhân viên"));

        mockMvc.perform(get("/api/v1/employees/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    void testCreateEmployee_Success() throws Exception {
        EmployeeDto request = createSampleEmployee(null, "EMP-002", "Trần Thị Bích");
        EmployeeDto created = createSampleEmployee(2L, "EMP-002", "Trần Thị Bích");

        when(employeeService.createEmployee(any(EmployeeDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(2)))
                .andExpect(jsonPath("$.data.employee_code", is("EMP-002")));
    }

    @Test
    void testCreateEmployee_ConflictDuplicateCode() throws Exception {
        EmployeeDto request = createSampleEmployee(null, "EMP-001", "Người Trùng Mã");

        when(employeeService.createEmployee(any(EmployeeDto.class)))
                .thenThrow(new ResourceConflictException("Mã nhân viên đã tồn tại trên hệ thống"));

        mockMvc.perform(post("/api/v1/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("RESOURCE_CONFLICT")));
    }

    @Test
    void testUpdateEmployee_OptimisticLockFailure() throws Exception {
        EmployeeDto request = createSampleEmployee(1L, "EMP-001", "Nguyễn Văn An");

        when(employeeService.updateEmployee(eq(1L), any(EmployeeDto.class)))
                .thenThrow(new OptimisticLockingFailureException("Dữ liệu đã bị thay đổi bởi người dùng khác"));

        mockMvc.perform(put("/api/v1/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("OPTIMISTIC_LOCK_CONFLICT")));
    }

    @Test
    void testDeleteEmployee_Success() throws Exception {
        doNothing().when(employeeService).deleteEmployee(1L);

        mockMvc.perform(delete("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(employeeService, times(1)).deleteEmployee(1L);
    }

    @Test
    void testDeleteEmployee_BranchManager_Conflict() throws Exception {
        doThrow(new ResourceConflictException("Không thể xóa nhân sự đang là Quản lý chi nhánh (Chi nhánh Cầu Giấy)"))
                .when(employeeService).deleteEmployee(1L);

        mockMvc.perform(delete("/api/v1/employees/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.message", containsString("Quản lý chi nhánh")));
    }
}
