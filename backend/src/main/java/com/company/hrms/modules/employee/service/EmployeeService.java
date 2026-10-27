package com.company.hrms.modules.employee.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.auth.domain.Role;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.repository.RoleRepository;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.hrms.modules.employee.domain.EmployeeSecondaryBranch;
import com.company.hrms.modules.employee.dto.SecondaryBranchAssignmentDto;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
import com.company.hrms.modules.position.domain.Position;
import com.company.hrms.modules.position.repository.PositionRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final PositionRepository positionRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeSecondaryBranchRepository secondaryBranchRepository;
    private final com.company.hrms.common.service.FileStorageService fileStorageService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            BranchRepository branchRepository,
            PositionRepository positionRepository,
            ShiftAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EmployeeSecondaryBranchRepository secondaryBranchRepository,
            com.company.hrms.common.service.FileStorageService fileStorageService) {
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.positionRepository = positionRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.secondaryBranchRepository = secondaryBranchRepository;
        this.fileStorageService = fileStorageService;
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

    public static String deriveDefaultPassword(String employeeCode) {
        if (employeeCode == null || employeeCode.isBlank()) {
            return "123456@123";
        }
        String cleanCode = employeeCode.trim().toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
        return cleanCode + "@123";
    }

    public static String resolveRoleCode(Long positionId) {
        if (positionId != null && positionId == 1L) {
            return "ROLE_DIRECTOR";
        } else if (positionId != null && positionId == 2L) {
            return "ROLE_MANAGER";
        }
        return "ROLE_EMPLOYEE";
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeDto request) {
        if (employeeRepository.existsByEmployeeCodeAndDeletedAtIsNull(request.getEmployeeCode())) {
            throw new ResourceConflictException("Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
        }
        if (employeeRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
            throw new ResourceConflictException("Email nhân viên đã tồn tại: " + request.getEmail());
        }
        if (userRepository.existsByUsername(request.getEmployeeCode())) {
            throw new ResourceConflictException("Tài khoản người dùng đã tồn tại: " + request.getEmployeeCode());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email tài khoản đã tồn tại: " + request.getEmail());
        }

        // Provision User account
        User user = new User();
        user.setUsername(request.getEmployeeCode().trim());
        user.setEmail(request.getEmail().trim());
        String defaultPassword = deriveDefaultPassword(request.getEmployeeCode());
        user.setPasswordHash(passwordEncoder.encode(defaultPassword));
        user.setMustChangePassword(false);
        user.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        user.setFailedLoginAttempts(0);

        String roleCode = resolveRoleCode(request.getPositionId());
        Role role = roleRepository.findByRoleCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò", roleCode));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        Employee employee = new Employee();
        mapDtoToEntity(request, employee);
        employee.setUserId(savedUser.getId());

        Employee saved = employeeRepository.save(employee);

        if (request.getSecondaryBranches() != null && !request.getSecondaryBranches().isEmpty()) {
            for (SecondaryBranchAssignmentDto item : request.getSecondaryBranches()) {
                if (item.getBranchId() != null && !item.getBranchId().equals(saved.getBranchId())) {
                    EmployeeSecondaryBranch esb = new EmployeeSecondaryBranch();
                    esb.setEmployeeId(saved.getId());
                    esb.setBranchId(item.getBranchId());
                    esb.setPositionId(item.getPositionId());
                    esb.setNotes("Chi nhánh kiêm nhiệm / hỗ trợ");
                    secondaryBranchRepository.save(esb);
                }
            }
        } else if (request.getSecondaryBranchIds() != null && !request.getSecondaryBranchIds().isEmpty()) {
            for (Long branchId : request.getSecondaryBranchIds()) {
                if (branchId != null && !branchId.equals(saved.getBranchId())) {
                    EmployeeSecondaryBranch esb = new EmployeeSecondaryBranch();
                    esb.setEmployeeId(saved.getId());
                    esb.setBranchId(branchId);
                    esb.setNotes("Chi nhánh kiêm nhiệm / hỗ trợ");
                    secondaryBranchRepository.save(esb);
                }
            }
        }

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
        if (!employee.getEmployeeCode().equalsIgnoreCase(request.getEmployeeCode())) {
            if (employeeRepository.existsByEmployeeCodeAndDeletedAtIsNull(request.getEmployeeCode())) {
                throw new ResourceConflictException("Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
            }
            if (userRepository.existsByUsername(request.getEmployeeCode())) {
                throw new ResourceConflictException("Tài khoản người dùng đã tồn tại: " + request.getEmployeeCode());
            }
        }
        if (!employee.getEmail().equalsIgnoreCase(request.getEmail())) {
            if (employeeRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
                throw new ResourceConflictException("Email nhân viên đã tồn tại: " + request.getEmail());
            }
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceConflictException("Email tài khoản đã tồn tại: " + request.getEmail());
            }
        }

        mapDtoToEntity(request, employee);
        Employee updated = employeeRepository.save(employee);

        // Sync linked User account if exists
        if (updated.getUserId() != null) {
            userRepository.findById(updated.getUserId()).ifPresent(user -> {
                // If code changed, update username and default password
                if (!user.getUsername().equalsIgnoreCase(updated.getEmployeeCode())) {
                    user.setUsername(updated.getEmployeeCode().trim());
                    String newDefaultPassword = deriveDefaultPassword(updated.getEmployeeCode());
                    user.setPasswordHash(passwordEncoder.encode(newDefaultPassword));
                }
                // If email changed, update user email
                if (!user.getEmail().equalsIgnoreCase(updated.getEmail())) {
                    user.setEmail(updated.getEmail().trim());
                }
                // If position changed, update role
                String expectedRoleCode = resolveRoleCode(updated.getPositionId());
                boolean isExactRoleMatch = user.getRoles().size() == 1 &&
                        user.getRoles().stream().anyMatch(r -> expectedRoleCode.equals(r.getRoleCode()));
                if (!isExactRoleMatch) {
                    roleRepository.findByRoleCode(expectedRoleCode).ifPresent(r -> {
                        Set<Role> newRoles = new HashSet<>();
                        newRoles.add(r);
                        user.setRoles(newRoles);
                    });
                }
                // Sync active status
                if ("RESIGNED".equalsIgnoreCase(updated.getEmploymentStatus()) || Boolean.FALSE.equals(updated.getIsActive())) {
                    user.setIsActive(false);
                } else if (Boolean.TRUE.equals(updated.getIsActive())) {
                    user.setIsActive(true);
                }
                userRepository.save(user);
            });
        }

        // If employee has resigned, cancel all future shift assignments
        if ("RESIGNED".equalsIgnoreCase(updated.getEmploymentStatus()) || Boolean.FALSE.equals(updated.getIsActive())) {
            List<ShiftAssignment> futureShifts = assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(
                    id, LocalDate.now(), LocalDate.now().plusYears(1)
            );
            for (ShiftAssignment shift : futureShifts) {
                if (!"CANCELLED".equalsIgnoreCase(shift.getStatus())) {
                    shift.setStatus("CANCELLED");
                    assignmentRepository.save(shift);
                }
            }
        }

        // Update secondary branches if provided
        if (request.getSecondaryBranches() != null) {
            secondaryBranchRepository.deleteAllByEmployeeId(updated.getId());
            for (com.company.hrms.modules.employee.dto.SecondaryBranchAssignmentDto sec : request.getSecondaryBranches()) {
                if (sec.getBranchId() != null && !sec.getBranchId().equals(updated.getBranchId())) {
                    EmployeeSecondaryBranch esb = new EmployeeSecondaryBranch();
                    esb.setEmployeeId(updated.getId());
                    esb.setBranchId(sec.getBranchId());
                    esb.setPositionId(sec.getPositionId());
                    esb.setNotes("Chi nhánh kiêm nhiệm / hỗ trợ");
                    secondaryBranchRepository.save(esb);
                }
            }
        } else if (request.getSecondaryBranchIds() != null) {
            secondaryBranchRepository.deleteAllByEmployeeId(updated.getId());
            for (Long branchId : request.getSecondaryBranchIds()) {
                if (branchId != null && !branchId.equals(updated.getBranchId())) {
                    EmployeeSecondaryBranch esb = new EmployeeSecondaryBranch();
                    esb.setEmployeeId(updated.getId());
                    esb.setBranchId(branchId);
                    esb.setNotes("Chi nhánh kiêm nhiệm / hỗ trợ");
                    secondaryBranchRepository.save(esb);
                }
            }
        }

        return toDto(updated);
    }

    @Transactional
    public EmployeeDto uploadAvatar(Long id, org.springframework.web.multipart.MultipartFile file) {
        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", id));

        String avatarUrl = fileStorageService.storeAvatar(id, file);
        employee.setAvatarUrl(avatarUrl);
        Employee saved = employeeRepository.save(employee);
        return toDto(saved);
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

        // Deactivate linked User account
        if (employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(user -> {
                user.setIsActive(false);
                user.setDeletedAt(LocalDateTime.now());
                userRepository.save(user);
            });
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
            if ("RESIGNED".equalsIgnoreCase(dto.getEmploymentStatus())) {
                entity.setIsActive(false);
            } else if (dto.getIsActive() != null) {
                entity.setIsActive(dto.getIsActive());
            } else {
                entity.setIsActive(true);
            }
        } else if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
        if (dto.getEmploymentType() != null) {
            entity.setEmploymentType(dto.getEmploymentType());
        }
        if (dto.getAvatarUrl() != null) {
            entity.setAvatarUrl(dto.getAvatarUrl());
        }
        entity.setHireDate(dto.getHireDate());
        entity.setResignationDate(dto.getResignationDate());
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
        dto.setAvatarUrl(entity.getAvatarUrl());
        dto.setResignationDate(entity.getResignationDate());
        dto.setIsActive(entity.getIsActive());
        dto.setVersion(entity.getVersion());

        List<EmployeeSecondaryBranch> secondaries = secondaryBranchRepository.findAllByEmployeeId(entity.getId());
        if (!secondaries.isEmpty()) {
            dto.setSecondaryBranchIds(secondaries.stream()
                    .map(EmployeeSecondaryBranch::getBranchId)
                    .collect(Collectors.toList()));
            List<com.company.hrms.modules.employee.dto.SecondaryBranchAssignmentDto> secList = new java.util.ArrayList<>();
            for (EmployeeSecondaryBranch esb : secondaries) {
                String branchName = branchRepository.findByIdAndDeletedAtIsNull(esb.getBranchId())
                        .map(Branch::getBranchName).orElse(null);
                String positionName = esb.getPositionId() != null
                        ? positionRepository.findByIdAndDeletedAtIsNull(esb.getPositionId()).map(Position::getPositionName).orElse(null)
                        : null;
                secList.add(new com.company.hrms.modules.employee.dto.SecondaryBranchAssignmentDto(
                        esb.getBranchId(), esb.getPositionId(), branchName, positionName
                ));
            }
            dto.setSecondaryBranches(secList);
        } else {
            dto.setSecondaryBranchIds(new java.util.ArrayList<>());
            dto.setSecondaryBranches(new java.util.ArrayList<>());
        }

        return dto;
    }
}
