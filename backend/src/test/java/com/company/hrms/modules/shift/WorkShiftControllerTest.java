package com.company.hrms.modules.shift;

import com.company.hrms.common.exception.GlobalExceptionHandler;
import com.company.hrms.modules.shift.controller.WorkShiftController;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.service.WorkShiftService;
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

import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WorkShiftControllerTest {

    private MockMvc mockMvc;

    @Mock
    private WorkShiftService workShiftService;

    @InjectMocks
    private WorkShiftController workShiftController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter =
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(workShiftController)
                .setMessageConverters(converter)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private WorkShiftDto createSampleShift(Long id, String name, String code) {
        WorkShiftDto dto = new WorkShiftDto();
        dto.setId(id);
        dto.setShiftName(name);
        dto.setShiftCode(code);
        dto.setStartTime(LocalTime.of(8, 0));
        dto.setEndTime(LocalTime.of(17, 0));
        dto.setBreakMinutes(60);
        dto.setIsActive(true);
        return dto;
    }

    @Test
    void testGetAllWorkShifts_Success() throws Exception {
        WorkShiftDto shift = createSampleShift(1L, "Ca Hành Chính", "CA_HC");
        when(workShiftService.getAllWorkShifts()).thenReturn(List.of(shift));

        mockMvc.perform(get("/api/v1/work-shifts"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].shift_name", is("Ca Hành Chính")));
    }

    @Test
    void testCreateWorkShift_Success() throws Exception {
        WorkShiftDto request = createSampleShift(null, "Ca Tối", "CA_TOI");
        WorkShiftDto created = createSampleShift(2L, "Ca Tối", "CA_TOI");

        when(workShiftService.createWorkShift(any(WorkShiftDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/work-shifts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(2)))
                .andExpect(jsonPath("$.data.shift_code", is("CA_TOI")));
    }

    @Test
    void testDeleteWorkShift_Success() throws Exception {
        doNothing().when(workShiftService).deleteWorkShift(1L);

        mockMvc.perform(delete("/api/v1/work-shifts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(workShiftService, times(1)).deleteWorkShift(1L);
    }
}
