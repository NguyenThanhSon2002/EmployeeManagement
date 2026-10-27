package com.company.hrms.modules.shift.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WorkShiftService {

    private final WorkShiftRepository workShiftRepository;
    private final BranchRepository branchRepository;

    public WorkShiftService(WorkShiftRepository workShiftRepository, BranchRepository branchRepository) {
        this.workShiftRepository = workShiftRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkShiftDto> getAllWorkShifts() {
        return getAllWorkShifts(null);
    }

    @Transactional(readOnly = true)
    public List<WorkShiftDto> getAllWorkShifts(Long branchId) {
        List<WorkShift> shifts;
        if (branchId != null) {
            shifts = workShiftRepository.findAllActiveByBranchIdOrGlobal(branchId);
        } else {
            shifts = workShiftRepository.findAllByDeletedAtIsNullOrderByStartTimeAsc();
        }

        Map<Long, String> branchNames = branchRepository.findAllByDeletedAtIsNullOrderByBranchNameAsc().stream()
                .collect(Collectors.toMap(Branch::getId, Branch::getBranchName, (k1, k2) -> k1));

        return shifts.stream()
                .map(s -> toDto(s, branchNames))
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
        Long branchId = request.getBranchId();
        if (branchId != null && !branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Chi nhánh", branchId);
        }

        if (workShiftRepository.existsByShiftCodeAndBranchIdAndDeletedAtIsNull(request.getShiftCode(), branchId)) {
            String scope = branchId == null ? "toàn hệ thống" : "chi nhánh #" + branchId;
            throw new ResourceConflictException("Mã ca làm việc đã tồn tại trong " + scope + ": " + request.getShiftCode());
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

        Long targetBranchId = request.getBranchId();
        if (targetBranchId != null && !branchRepository.existsById(targetBranchId)) {
            throw new ResourceNotFoundException("Chi nhánh", targetBranchId);
        }

        boolean codeChanged = !entity.getShiftCode().equalsIgnoreCase(request.getShiftCode());
        boolean branchChanged = (entity.getBranchId() == null && targetBranchId != null) ||
                                (entity.getBranchId() != null && !entity.getBranchId().equals(targetBranchId));

        if ((codeChanged || branchChanged) &&
                workShiftRepository.existsByShiftCodeAndBranchIdAndDeletedAtIsNull(request.getShiftCode(), targetBranchId)) {
            String scope = targetBranchId == null ? "toàn hệ thống" : "chi nhánh #" + targetBranchId;
            throw new ResourceConflictException("Mã ca làm việc đã tồn tại trong " + scope + ": " + request.getShiftCode());
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
        entity.setBranchId(dto.getBranchId());
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
        String branchName = null;
        if (entity.getBranchId() != null) {
            branchName = branchRepository.findById(entity.getBranchId())
                    .map(Branch::getBranchName)
                    .orElse(null);
        }
        return toDto(entity, branchName);
    }

    public WorkShiftDto toDto(WorkShift entity, Map<Long, String> branchNames) {
        String branchName = entity.getBranchId() != null ? branchNames.get(entity.getBranchId()) : null;
        return toDto(entity, branchName);
    }

    public WorkShiftDto toDto(WorkShift entity, String branchName) {
        WorkShiftDto dto = new WorkShiftDto();
        dto.setId(entity.getId());
        dto.setShiftCode(entity.getShiftCode());
        dto.setShiftName(entity.getShiftName());
        dto.setBranchId(entity.getBranchId());
        dto.setBranchName(branchName);
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
