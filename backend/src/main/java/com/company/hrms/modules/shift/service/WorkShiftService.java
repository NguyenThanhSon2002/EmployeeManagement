package com.company.hrms.modules.shift.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkShiftService {

    private final WorkShiftRepository workShiftRepository;

    public WorkShiftService(WorkShiftRepository workShiftRepository) {
        this.workShiftRepository = workShiftRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkShiftDto> getAllWorkShifts() {
        return workShiftRepository.findAllByDeletedAtIsNullOrderByStartTimeAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkShiftDto getWorkShiftById(Long id) {
        WorkShift shift = workShiftRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", id));
        return toDto(shift);
    }

    @Transactional
    public WorkShiftDto createWorkShift(WorkShiftDto request) {
        if (workShiftRepository.existsByShiftCodeAndDeletedAtIsNull(request.getShiftCode())) {
            throw new ResourceConflictException("Mã ca làm việc đã tồn tại: " + request.getShiftCode());
        }

        WorkShift entity = new WorkShift();
        mapDtoToEntity(request, entity);

        WorkShift saved = workShiftRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public WorkShiftDto updateWorkShift(Long id, WorkShiftDto request) {
        WorkShift entity = workShiftRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", id));

        if (!entity.getShiftCode().equalsIgnoreCase(request.getShiftCode()) &&
                workShiftRepository.existsByShiftCodeAndDeletedAtIsNull(request.getShiftCode())) {
            throw new ResourceConflictException("Mã ca làm việc đã tồn tại: " + request.getShiftCode());
        }

        mapDtoToEntity(request, entity);
        WorkShift updated = workShiftRepository.save(entity);
        return toDto(updated);
    }

    @Transactional
    public void deleteWorkShift(Long id) {
        WorkShift entity = workShiftRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", id));
        entity.softDelete();
        workShiftRepository.save(entity);
    }

    private void mapDtoToEntity(WorkShiftDto dto, WorkShift entity) {
        entity.setShiftCode(dto.getShiftCode());
        entity.setShiftName(dto.getShiftName());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setBreakMinutes(dto.getBreakMinutes() != null ? dto.getBreakMinutes() : 0);

        // Auto-detect cross-midnight if not explicitly set
        boolean crossMidnight = dto.getIsCrossMidnight() != null
                ? dto.getIsCrossMidnight()
                : (dto.getEndTime().isBefore(dto.getStartTime()) || dto.getEndTime().equals(dto.getStartTime()));
        entity.setIsCrossMidnight(crossMidnight);

        if (dto.getColorCode() != null) entity.setColorCode(dto.getColorCode());
        if (dto.getTextColor() != null) entity.setTextColor(dto.getTextColor());
        if (dto.getMinStaffing() != null) entity.setMinStaffing(dto.getMinStaffing());
        if (dto.getMaxStaffing() != null) entity.setMaxStaffing(dto.getMaxStaffing());
        if (dto.getApplicableDays() != null) entity.setApplicableDays(dto.getApplicableDays());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());
    }

    public WorkShiftDto toDto(WorkShift entity) {
        WorkShiftDto dto = new WorkShiftDto();
        dto.setId(entity.getId());
        dto.setShiftCode(entity.getShiftCode());
        dto.setShiftName(entity.getShiftName());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setBreakMinutes(entity.getBreakMinutes());
        dto.setIsCrossMidnight(entity.getIsCrossMidnight());
        dto.setColorCode(entity.getColorCode());
        dto.setTextColor(entity.getTextColor());
        dto.setMinStaffing(entity.getMinStaffing());
        dto.setMaxStaffing(entity.getMaxStaffing());
        dto.setApplicableDays(entity.getApplicableDays());
        dto.setIsActive(entity.getIsActive());
        return dto;
    }
}
