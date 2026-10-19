package com.company.hrms.modules.employee.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;

    public EmployeeService(EmployeeRepository employeeRepository, BranchRepository branchRepository) {
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDto> getEmployees(Long branchId, String status, String keyword, Pageable pageable) {
        return employeeRepository.findEmployeesWithFilter(branchId, status, keyword, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> getEmployeesByBranch(Long branchId) {
        return employeeRepository.findAllByBranchIdAndDeletedAtIsNull(branchId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));
        return toDto(employee);
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeDto request) {
        if (employeeRepository.existsByEmployeeCodeAndDeletedAtIsNull(request.getEmployeeCode())) {
            throw new ResourceConflictException("Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
        }
        if (employeeRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
            throw new ResourceConflictException("Email nhân viên đã tồn tại: " + request.getEmail());
        }

        Employee employee = new Employee();
        mapDtoToEntity(request, employee);

        Employee saved = employeeRepository.save(employee);
        return toDto(saved);
    }

    @Transactional
    public EmployeeDto updateEmployee(Long id, EmployeeDto request) {
        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));

        if (request.getVersion() != null && !employee.getVersion().equals(request.getVersion())) {
            throw new ObjectOptimisticLockingFailureException(Employee.class, id);
        }

        // Check unique constraints if changed
        if (!employee.getEmployeeCode().equalsIgnoreCase(request.getEmployeeCode()) &&
                employeeRepository.existsByEmployeeCodeAndDeletedAtIsNull(request.getEmployeeCode())) {
            throw new ResourceConflictException("Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
        }
        if (!employee.getEmail().equalsIgnoreCase(request.getEmail()) &&
                employeeRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
            throw new ResourceConflictException("Email nhân viên đã tồn tại: " + request.getEmail());
        }

        mapDtoToEntity(request, employee);
        Employee updated = employeeRepository.save(employee);
        return toDto(updated);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));

        List<Branch> managedBranches = branchRepository.findAllByManagerIdAndDeletedAtIsNull(id);
        if (!managedBranches.isEmpty()) {
            String branchNames = managedBranches.stream()
                    .map(Branch::getBranchName)
                    .collect(Collectors.joining(", "));
            throw new ResourceConflictException("Không thể xóa nhân sự đang là Quản lý chi nhánh (" + branchNames + "). Vui lòng chuyển giao chức vụ trước khi xóa.");
        }

        employee.softDelete();
        employeeRepository.save(employee);
    }

    private void mapDtoToEntity(EmployeeDto dto, Employee entity) {
        entity.setEmployeeCode(dto.getEmployeeCode());
        entity.setFullName(dto.getFullName());
        entity.setEmail(dto.getEmail());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setNationalId(dto.getNationalId());
        entity.setDateOfBirth(dto.getDateOfBirth());
        entity.setGender(dto.getGender());
        entity.setAddress(dto.getAddress());
        entity.setBranchId(dto.getBranchId());
        entity.setPositionId(dto.getPositionId());
        entity.setManagerId(dto.getManagerId());
        if (dto.getEmploymentStatus() != null) {
            entity.setEmploymentStatus(dto.getEmploymentStatus());
        }
        if (dto.getEmploymentType() != null) {
            entity.setEmploymentType(dto.getEmploymentType());
        }
        entity.setHireDate(dto.getHireDate());
        entity.setResignationDate(dto.getResignationDate());
        if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
    }

    public EmployeeDto toDto(Employee entity) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setEmployeeCode(entity.getEmployeeCode());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setNationalId(entity.getNationalId());
        dto.setDateOfBirth(entity.getDateOfBirth());
        dto.setGender(entity.getGender());
        dto.setAddress(entity.getAddress());
        dto.setBranchId(entity.getBranchId());
        dto.setPositionId(entity.getPositionId());
        dto.setManagerId(entity.getManagerId());
        dto.setEmploymentStatus(entity.getEmploymentStatus());
        dto.setEmploymentType(entity.getEmploymentType());
        dto.setHireDate(entity.getHireDate());
        dto.setResignationDate(entity.getResignationDate());
        dto.setIsActive(entity.getIsActive());
        dto.setVersion(entity.getVersion());
        return dto;
    }
}
