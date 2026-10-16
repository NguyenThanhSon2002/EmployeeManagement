package com.company.hrms.modules.department.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.department.domain.Department;
import com.company.hrms.modules.department.dto.DepartmentDto;
import com.company.hrms.modules.department.repository.DepartmentRepository;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAllByDeletedAtIsNullOrderByDepartmentNameAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        Department dept = departmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng ban", id));
        return toDto(dept);
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto request) {
        if (departmentRepository.existsByDepartmentCodeAndDeletedAtIsNull(request.getDepartmentCode())) {
            throw new ResourceConflictException("Mã phòng ban đã tồn tại: " + request.getDepartmentCode());
        }

        Department department = new Department(
                request.getDepartmentCode(),
                request.getDepartmentName(),
                request.getParentDepartmentId(),
                request.getManagerId()
        );

        Department saved = departmentRepository.save(department);
        return toDto(saved);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto request) {
        Department department = departmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng ban", id));

        if (request.getVersion() != null && !department.getVersion().equals(request.getVersion())) {
            throw new ObjectOptimisticLockingFailureException(Department.class, id);
        }

        department.setDepartmentName(request.getDepartmentName());
        department.setParentDepartmentId(request.getParentDepartmentId());
        department.setManagerId(request.getManagerId());
        if (request.getIsActive() != null) {
            department.setIsActive(request.getIsActive());
        }

        Department updated = departmentRepository.save(department);
        return toDto(updated);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng ban", id));
        department.softDelete();
        departmentRepository.save(department);
    }

    public DepartmentDto toDto(Department dept) {
        return new DepartmentDto(
                dept.getId(),
                dept.getDepartmentCode(),
                dept.getDepartmentName(),
                dept.getParentDepartmentId(),
                dept.getManagerId(),
                dept.getIsActive(),
                dept.getVersion()
        );
    }
}
