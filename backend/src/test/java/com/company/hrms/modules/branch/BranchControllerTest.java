package com.company.hrms.modules.branch;

import com.company.hrms.modules.branch.controller.BranchController;
import com.company.hrms.modules.branch.dto.BranchDto;
import com.company.hrms.modules.branch.service.BranchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BranchControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BranchService branchService;

    @InjectMocks
    private BranchController branchController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(branchController).build();
    }

    @Test
    void getAllBranches_ShouldReturnList() throws Exception {
        BranchDto dto = new BranchDto(1L, "CN01", "Cơ sở Cầu Giấy", "123 Cầu Giấy", "0987654321", null, true, 1);
        when(branchService.getAllBranches()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/branches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].branch_code").value("CN01"))
                .andExpect(jsonPath("$.data[0].branch_name").value("Cơ sở Cầu Giấy"));
    }

    @Test
    void getBranchById_ShouldReturnBranch() throws Exception {
        BranchDto dto = new BranchDto(1L, "CN01", "Cơ sở Cầu Giấy", "123 Cầu Giấy", "0987654321", null, true, 1);
        when(branchService.getBranchById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/branches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.branch_name").value("Cơ sở Cầu Giấy"));
    }

    @Test
    void createBranch_ShouldReturnCreatedBranch() throws Exception {
        BranchDto input = new BranchDto(null, "CN02", "Cơ sở Đống Đa", "456 Đống Đa", null, null, true, null);
        BranchDto created = new BranchDto(2L, "CN02", "Cơ sở Đống Đa", "456 Đống Đa", null, null, true, 1);
        when(branchService.createBranch(any(BranchDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/branches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(2L))
                .andExpect(jsonPath("$.data.branch_code").value("CN02"));
    }

    @Test
    void deleteBranch_ShouldCallService() throws Exception {
        mockMvc.perform(delete("/api/v1/branches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(branchService).deleteBranch(1L);
    }
}
