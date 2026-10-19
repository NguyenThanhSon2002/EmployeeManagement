package com.company.hrms.modules.report;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.report.controller.ReportController;
import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import com.company.hrms.modules.report.service.ExcelExportService;
import com.company.hrms.modules.report.service.ReportService;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReportService reportService;

    @Mock
    private ExcelExportService exportService;

    @InjectMocks
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private AttendanceSummaryDto createSampleSummary(Long empId, String empName) {
        AttendanceSummaryDto dto = new AttendanceSummaryDto();
        dto.setEmployeeId(empId);
        dto.setEmployeeCode("EMP-00" + empId);
        dto.setFullName(empName);
        dto.setBranchName("Chi nhánh Cầu Giấy");
        dto.setTotalWorkingDays(22L);
        dto.setTotalRegularHours(new java.math.BigDecimal("176.0"));
        dto.setTotalOvertimeHours(new java.math.BigDecimal("10.0"));
        return dto;
    }

    @Test
    void testGetAttendanceSummary_Success() throws Exception {
        AttendanceSummaryDto summary = createSampleSummary(1L, "Nguyễn Văn An");
        when(reportService.getAttendanceSummary(eq(null), anyInt(), anyInt()))
                .thenReturn(List.of(summary));

        mockMvc.perform(get("/api/v1/reports/attendance-summary?year=2026&month=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].full_name", is("Nguyễn Văn An")));
    }

    @Test
    void testGetAttendanceSummary_WithBranchFilter() throws Exception {
        AttendanceSummaryDto summary = createSampleSummary(1L, "Nguyễn Văn An");
        when(reportService.getAttendanceSummary(eq(1L), anyInt(), anyInt()))
                .thenReturn(List.of(summary));

        mockMvc.perform(get("/api/v1/reports/attendance-summary?branch_id=1&year=2026&month=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].branch_name", is("Chi nhánh Cầu Giấy")));
    }

    @Test
    void testExportExcel_Success() throws Exception {
        when(reportService.getAttendanceSummary(eq(1L), anyInt(), anyInt())).thenReturn(List.of());
        when(exportService.exportAttendanceToExcel(org.mockito.ArgumentMatchers.any(), anyInt(), anyInt())).thenReturn(new byte[]{1, 2, 3});

        mockMvc.perform(get("/api/v1/reports/export/excel?branch_id=1&year=2026&month=10"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"Bao_Cao_Cham_Cong_10_2026.xlsx\"")))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void testExportCsv_Success() throws Exception {
        when(reportService.getAttendanceSummary(eq(null), anyInt(), anyInt())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/reports/export/csv?year=2026&month=10"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"Bao_Cao_Cham_Cong_10_2026.csv\"")))
                .andExpect(content().contentType("text/csv;charset=UTF-8"));
    }
}
