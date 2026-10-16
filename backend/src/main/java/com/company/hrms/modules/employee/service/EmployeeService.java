package com.company.hrms.modules.employee.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.department.domain.Department;
import com.company.hrms.modules.department.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDto> getEmployees(Long departmentId, String status, String keyword, Pageable pageable) {
        return employeeRepository.findEmployeesWithFilter(departmentId, status, keyword, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> getEmployeesByDepartment(Long departmentId) {
        return employeeRepository.findAllByDepartmentIdAndDeletedAtIsNull(departmentId).stream()
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

        List<Department> managedDepartments = departmentRepository.findAllByManagerIdAndDeletedAtIsNull(id);
        if (!managedDepartments.isEmpty()) {
            String deptNames = managedDepartments.stream()
                    .map(Department::getDepartmentName)
                    .collect(Collectors.joining(", "));
            throw new ResourceConflictException("Không thể xóa nhân viên đang giữ vị trí Trưởng phòng (" + deptNames + "). Vui lòng chuyển giao chức vụ trước khi xóa.");
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
        entity.setDepartmentId(dto.getDepartmentId());
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
        dto.setDepartmentId(entity.getDepartmentId());
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
