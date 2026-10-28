package com.company.hrms.modules.shift;

import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import com.company.hrms.modules.shift.service.WorkShiftService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkShiftServiceTest {

    @Mock
    private WorkShiftRepository workShiftRepository;

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private WorkShiftService workShiftService;

    private WorkShift sampleShift;

    @BeforeEach
    void setUp() {
        sampleShift = new WorkShift();
        sampleShift.setShiftCode("CA_SANG");
        sampleShift.setShiftName("Ca Sáng");
        sampleShift.setBranchId(1L);
        sampleShift.setStartTime(LocalTime.of(8, 0));
        sampleShift.setEndTime(LocalTime.of(16, 0));
        sampleShift.setBreakMinutes(60);
        sampleShift.setIsCrossMidnight(false);
        sampleShift.setColorCode("#1677FF");
        sampleShift.setTextColor("#FFFFFF");
        sampleShift.setMinStaffing(2);
        sampleShift.setMaxStaffing(5);
        sampleShift.setApplicableDays("1,2,3,4,5,6,7");
        sampleShift.setIsActive(true);
    }

    @Test
    @DisplayName("getAllWorkShifts với branchId chỉ gọi query của chi nhánh đó, không gọi ca dùng chung")
    void testGetAllWorkShiftsWithBranchId() {
        when(workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(1L))
                .thenReturn(List.of(sampleShift));
        when(branchRepository.findAllByDeletedAtIsNullOrderByBranchNameAsc())
                .thenReturn(Collections.emptyList());

        List<WorkShiftDto> result = workShiftService.getAllWorkShifts(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getBranchId());
        verify(workShiftRepository, times(1)).findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(1L);
    }

    @Test
    @DisplayName("createWorkShift ném ResourceNotFoundException nếu branchId là null")
    void testCreateWorkShiftRequiresBranchId() {
        WorkShiftDto dto = new WorkShiftDto();
        dto.setShiftCode("CA_TEST");
        dto.setShiftName("Ca Test");
        dto.setBranchId(null);

        assertThrows(ResourceNotFoundException.class, () -> {
            workShiftService.createWorkShift(dto);
        });

        verify(workShiftRepository, never()).save(any());
    }

    @Test
    @DisplayName("createWorkShift lưu thành công khi có branchId hợp lệ")
    void testCreateWorkShiftSuccess() {
        WorkShiftDto dto = new WorkShiftDto();
        dto.setShiftCode("CA_TEST");
        dto.setShiftName("Ca Test");
        dto.setBranchId(1L);
        dto.setStartTime(LocalTime.of(8, 0));
        dto.setEndTime(LocalTime.of(17, 0));

        when(branchRepository.existsById(1L)).thenReturn(true);
        when(workShiftRepository.existsByShiftCodeAndBranchIdAndDeletedAtIsNull("CA_TEST", 1L)).thenReturn(false);
        when(workShiftRepository.save(any(WorkShift.class))).thenReturn(sampleShift);

        WorkShiftDto created = workShiftService.createWorkShift(dto);

        assertNotNull(created);
        verify(workShiftRepository, times(1)).save(any(WorkShift.class));
    }
}
