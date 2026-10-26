package com.company.hrms.modules.availability.service;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import com.company.hrms.modules.availability.domain.EmployeePreferredShift;
import com.company.hrms.modules.availability.dto.EmployeeAvailabilityDto;
import com.company.hrms.modules.availability.dto.SaveAvailabilityRequest;
import com.company.hrms.modules.availability.repository.EmployeeAvailabilityRepository;
import com.company.hrms.modules.availability.repository.EmployeePreferredShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmployeeAvailabilityService {

    private final EmployeeAvailabilityRepository availabilityRepository;
    private final EmployeePreferredShiftRepository preferredShiftRepository;

    public EmployeeAvailabilityService(
            EmployeeAvailabilityRepository availabilityRepository,
            EmployeePreferredShiftRepository preferredShiftRepository) {
        this.availabilityRepository = availabilityRepository;
        this.preferredShiftRepository = preferredShiftRepository;
    }

    @Transactional(readOnly = true)
    public EmployeeAvailabilityDto getEmployeeAvailability(Long employeeId) {
        List<EmployeeAvailability> records = availabilityRepository.findAllByEmployeeId(employeeId);

        Map<Integer, List<Long>> resultMap = new HashMap<>();
        for (int day = 1; day <= 7; day++) {
            resultMap.put(day, new ArrayList<>());
        }

        for (EmployeeAvailability ea : records) {
            if (Boolean.TRUE.equals(ea.getIsAvailable()) && ea.getDayOfWeek() != null) {
                int day = ea.getDayOfWeek().intValue();
                if (day >= 1 && day <= 7) {
                    resultMap.get(day).add(ea.getWorkShiftId());
                }
            }
        }

        List<EmployeePreferredShift> prefList = preferredShiftRepository.findAllByEmployeeId(employeeId);
        List<Long> preferredShiftIds = prefList.stream()
                .map(EmployeePreferredShift::getWorkShiftId)
                .toList();

        return EmployeeAvailabilityDto.builder()
                .employeeId(employeeId)
                .availabilities(resultMap)
                .preferredShiftIds(preferredShiftIds)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<Long, Map<Integer, List<Long>>> getBranchAvailabilities(Long branchId) {
        List<EmployeeAvailability> records = availabilityRepository.findAllActiveByBranchId(branchId);

        Map<Long, Map<Integer, List<Long>>> branchMap = new HashMap<>();
        for (EmployeeAvailability ea : records) {
            if (Boolean.TRUE.equals(ea.getIsAvailable()) && ea.getDayOfWeek() != null) {
                int day = ea.getDayOfWeek().intValue();
                if (day >= 1 && day <= 7) {
                    branchMap.computeIfAbsent(ea.getEmployeeId(), empId -> {
                        Map<Integer, List<Long>> dayMap = new HashMap<>();
                        for (int d = 1; d <= 7; d++) {
                            dayMap.put(d, new ArrayList<>());
                        }
                        return dayMap;
                    }).get(day).add(ea.getWorkShiftId());
                }
            }
        }
        return branchMap;
    }

    @Transactional(readOnly = true)
    public Map<Long, List<Long>> getBranchPreferredShifts(Long branchId) {
        List<EmployeePreferredShift> records = preferredShiftRepository.findAllActiveByBranchId(branchId);
        Map<Long, List<Long>> branchMap = new HashMap<>();
        for (EmployeePreferredShift eps : records) {
            branchMap.computeIfAbsent(eps.getEmployeeId(), k -> new ArrayList<>()).add(eps.getWorkShiftId());
        }
        return branchMap;
    }

    @Transactional
    public void saveAvailability(Long employeeId, SaveAvailabilityRequest request) {
        availabilityRepository.deleteAllByEmployeeId(employeeId);
        preferredShiftRepository.deleteAllByEmployeeId(employeeId);

        if (request.getAvailabilities() != null && !request.getAvailabilities().isEmpty()) {
            List<EmployeeAvailability> entities = new ArrayList<>();
            for (Map.Entry<Integer, List<Long>> entry : request.getAvailabilities().entrySet()) {
                Integer dayOfWeek = entry.getKey();
                List<Long> shiftIds = entry.getValue();

                if (dayOfWeek < 1 || dayOfWeek > 7 || shiftIds == null) {
                    continue;
                }

                for (Long shiftId : shiftIds) {
                    entities.add(new EmployeeAvailability(employeeId, shiftId, dayOfWeek.byteValue(), true));
                }
            }
            availabilityRepository.saveAll(entities);
        }

        if (request.getPreferredShiftIds() != null && !request.getPreferredShiftIds().isEmpty()) {
            List<EmployeePreferredShift> prefEntities = new ArrayList<>();
            for (Long shiftId : request.getPreferredShiftIds()) {
                if (shiftId != null) {
                    prefEntities.add(EmployeePreferredShift.builder()
                            .employeeId(employeeId)
                            .workShiftId(shiftId)
                            .build());
                }
            }
            preferredShiftRepository.saveAll(prefEntities);
        }
    }
}
