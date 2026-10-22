package com.company.hrms.modules.availability.service;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import com.company.hrms.modules.availability.dto.SaveAvailabilityRequest;
import com.company.hrms.modules.availability.repository.EmployeeAvailabilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmployeeAvailabilityService {

    private final EmployeeAvailabilityRepository availabilityRepository;

    public EmployeeAvailabilityService(EmployeeAvailabilityRepository availabilityRepository) {
        this.availabilityRepository = availabilityRepository;
    }

    @Transactional(readOnly = true)
    public Map<Integer, List<Long>> getEmployeeAvailability(Long employeeId) {
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

        return resultMap;
    }

    @Transactional(readOnly = true)
    public Map<Long, Map<Integer, List<Long>>> getBranchAvailabilities(Long branchId) {
        List<EmployeeAvailability> records = availabilityRepository.findAllActiveByBranchId(branchId);

        Map<Long, Map<Integer, List<Long>>> branchMap = new HashMap<>();
        for (EmployeeAvailability ea : records) {
            // Kiểm tra active và ép Byte sang int để lấy đúng key Integer trong Map
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

    @Transactional
    public void saveAvailability(Long employeeId, SaveAvailabilityRequest request) {
        availabilityRepository.deleteAllByEmployeeId(employeeId);

        if (request.getAvailabilities() == null || request.getAvailabilities().isEmpty()) {
            return;
        }

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
}
