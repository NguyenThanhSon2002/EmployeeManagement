package com.company.hrms.modules.employee.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.auth.domain.Role;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.dto.RegisterRequest;
import com.company.hrms.modules.auth.dto.RegisterResponse;
import com.company.hrms.modules.auth.repository.RoleRepository;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import com.company.hrms.modules.availability.domain.EmployeePreferredShift;
import com.company.hrms.modules.availability.repository.EmployeeAvailabilityRepository;
import com.company.hrms.modules.availability.repository.EmployeePreferredShiftRepository;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final PositionRepository positionRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final WorkShiftRepository workShiftRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeSecondaryBranchRepository secondaryBranchRepository;
    private final com.company.hrms.common.service.FileStorageService fileStorageService;
    private final EmployeeAvailabilityRepository availabilityRepository;
    private final EmployeePreferredShiftRepository preferredShiftRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            BranchRepository branchRepository,
            PositionRepository positionRepository,
            ShiftAssignmentRepository assignmentRepository,
            ScheduleRepository scheduleRepository,
            WorkShiftRepository workShiftRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EmployeeSecondaryBranchRepository secondaryBranchRepository,
            com.company.hrms.common.service.FileStorageService fileStorageService,
            EmployeeAvailabilityRepository availabilityRepository,
            EmployeePreferredShiftRepository preferredShiftRepository) {
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.positionRepository = positionRepository;
        this.assignmentRepository = assignmentRepository;
        this.scheduleRepository = scheduleRepository;
        this.workShiftRepository = workShiftRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.secondaryBranchRepository = secondaryBranchRepository;
        this.fileStorageService = fileStorageService;
        this.availabilityRepository = availabilityRepository;
        this.preferredShiftRepository = preferredShiftRepository;
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

    public synchronized String generateNextEmployeeCode() {
        List<String> codes = employeeRepository.findAllEmpCodes();
        int max = 0;
        for (String code : codes) {
            if (code != null && code.startsWith("EMP-")) {
                try {
                    int num = Integer.parseInt(code.substring(4));
                    if (num > max) {
                        max = num;
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return String.format("EMP-%03d", max + 1);
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
        if (request.getEmployeeCode() == null || request.getEmployeeCode().isBlank() || "AUTO".equalsIgnoreCase(request.getEmployeeCode().trim())) {
            request.setEmployeeCode(generateNextEmployeeCode());
        }

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

        Long oldBranchId = employee.getBranchId();
        mapDtoToEntity(request, employee);
        Employee updated = employeeRepository.save(employee);

        // Chuyển toàn bộ phân ca hiện tại và tương lai sang chi nhánh mới nếu nhân sự được điều chuyển
        if (oldBranchId != null && updated.getBranchId() != null && !oldBranchId.equals(updated.getBranchId())) {
            migrateEmployeeShiftsToNewBranch(updated.getId(), oldBranchId, updated.getBranchId());
            migrateEmployeeAvailabilityToNewBranch(updated.getId(), oldBranchId, updated.getBranchId());
        }

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

    @Transactional
    public RegisterResponse registerEmployee(RegisterRequest request) {
        // Validate Branch
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", request.getBranchId()));

        String cleanEmail = request.getEmail().trim();
        String cleanPhone = request.getPhoneNumber().trim();

        // Validate uniqueness
        if (employeeRepository.existsByEmailAndDeletedAtIsNull(cleanEmail)) {
            throw new ResourceConflictException("Email nhân viên đã tồn tại trên hệ thống: " + cleanEmail);
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ResourceConflictException("Email tài khoản đã tồn tại: " + cleanEmail);
        }
        if (employeeRepository.existsByPhoneNumberAndDeletedAtIsNull(cleanPhone)) {
            throw new ResourceConflictException("Số điện thoại đã được đăng ký: " + cleanPhone);
        }

        // Auto increment employee code (e.g. EMP-022)
        String employeeCode = generateNextEmployeeCode();
        String defaultPassword = deriveDefaultPassword(employeeCode);

        // Provision User account with ROLE_EMPLOYEE
        User user = new User();
        user.setUsername(employeeCode);
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(defaultPassword));
        user.setMustChangePassword(false);
        user.setIsActive(true);
        user.setFailedLoginAttempts(0);

        Role role = roleRepository.findByRoleCode("ROLE_EMPLOYEE")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò", "ROLE_EMPLOYEE"));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Provision Employee record
        Employee employee = new Employee();
        employee.setUserId(savedUser.getId());
        employee.setEmployeeCode(employeeCode);
        employee.setFullName(request.getFullName().trim());
        employee.setEmail(cleanEmail);
        employee.setPhoneNumber(cleanPhone);
        employee.setBranchId(branch.getId());
        employee.setPositionId(3L); // Mặc định Vị trí: Nhân viên
        employee.setEmploymentStatus("PROBATION"); // Mặc định Hợp đồng: Thử việc
        employee.setEmploymentType("FULL_TIME");
        employee.setHireDate(LocalDate.now());
        employee.setIsActive(true);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            employee.setAddress(request.getNotes().trim());
        }

        employeeRepository.save(employee);

        return new RegisterResponse(
                employeeCode,
                employee.getFullName(),
                employee.getEmail(),
                branch.getId(),
                branch.getBranchName(),
                defaultPassword,
                "Đăng ký tài khoản thành công! Bạn có thể sử dụng Mã nhân viên để đăng nhập ngay."
        );
    }

    /**
     * Tự động chuyển các phân công ca (từ tuần hiện tại trở đi) sang Lịch tuần và Mẫu ca tương ứng của chi nhánh mới
     * khi nhân viên được điều chuyển chi nhánh.
     */
    public void migrateEmployeeShiftsToNewBranch(Long employeeId, Long oldBranchId, Long newBranchId) {
        if (oldBranchId == null || newBranchId == null || oldBranchId.equals(newBranchId)) {
            return;
        }

        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<ShiftAssignment> futureAssignments = assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(
                employeeId, currentMonday, currentMonday.plusYears(1)
        );

        if (futureAssignments.isEmpty()) {
            return;
        }

        List<WorkShift> newBranchShifts = workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId);
        if (newBranchShifts.isEmpty()) {
            return;
        }

        for (ShiftAssignment sa : futureAssignments) {
            if ("CANCELLED".equalsIgnoreCase(sa.getStatus())) {
                continue;
            }

            Schedule oldSched = scheduleRepository.findById(sa.getScheduleId()).orElse(null);
            if (oldSched == null || !oldBranchId.equals(oldSched.getBranchId())) {
                continue; // Chỉ chuyển ca thuộc về chi nhánh cũ sở tại của nhân viên
            }

            LocalDate workDate = sa.getWorkDate();
            LocalDate weekMonday = workDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate weekSunday = weekMonday.plusDays(6);

            // Tìm hoặc tạo Schedule tuần của chi nhánh mới
            Schedule targetSchedule = scheduleRepository.findByBranchIdAndStartDate(newBranchId, weekMonday)
                    .orElseGet(() -> {
                        Schedule newSched = new Schedule();
                        newSched.setBranchId(newBranchId);
                        newSched.setStartDate(weekMonday);
                        newSched.setEndDate(weekSunday);
                        newSched.setStatus("DRAFT");
                        newSched.setVersion(1);
                        return scheduleRepository.save(newSched);
                    });

            // Khớp mẫu ca tương ứng ở chi nhánh mới
            WorkShift oldWs = workShiftRepository.findById(sa.getWorkShiftId()).orElse(null);
            WorkShift matchedWs = findMatchingWorkShift(oldWs, sa.getSnapshotShiftName(), newBranchShifts);

            if (matchedWs != null) {
                sa.setScheduleId(targetSchedule.getId());
                sa.setWorkShiftId(matchedWs.getId());
                sa.setSnapshotShiftName(matchedWs.getShiftName());
                sa.setSnapshotStartTime(matchedWs.getStartTime());
                sa.setSnapshotEndTime(matchedWs.getEndTime());
                sa.setSnapshotBreakMinutes(matchedWs.getBreakMinutes() != null ? matchedWs.getBreakMinutes() : 0);
                sa.setSnapshotCrossMidnight(Boolean.TRUE.equals(matchedWs.getIsCrossMidnight()));
                sa.setSnapshotColorCode(matchedWs.getColorCode() != null ? matchedWs.getColorCode() : "#1677FF");

                LocalDateTime plannedStart = LocalDateTime.of(workDate, matchedWs.getStartTime());
                LocalDateTime plannedEnd = Boolean.TRUE.equals(matchedWs.getIsCrossMidnight())
                        ? LocalDateTime.of(workDate.plusDays(1), matchedWs.getEndTime())
                        : LocalDateTime.of(workDate, matchedWs.getEndTime());
                sa.setPlannedStartTime(plannedStart);
                sa.setPlannedEndTime(plannedEnd);

                assignmentRepository.save(sa);
            }
        }
    }

    private void migrateEmployeeAvailabilityToNewBranch(Long employeeId, Long oldBranchId, Long newBranchId) {
        List<WorkShift> newBranchShifts = workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId);
        if (newBranchShifts.isEmpty()) {
            return;
        }

        // 1. Remap employee_availabilities
        List<EmployeeAvailability> oldAvailabilities = availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId);
        List<EmployeeAvailability> currentNewAvailabilities = availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId);

        for (EmployeeAvailability ea : oldAvailabilities) {
            WorkShift oldWs = workShiftRepository.findById(ea.getWorkShiftId()).orElse(null);
            if (oldWs == null) continue;

            WorkShift matchedWs = findMatchingWorkShift(oldWs, oldWs.getShiftName(), newBranchShifts);
            if (matchedWs != null) {
                Long targetShiftId = matchedWs.getId();
                boolean alreadyExists = currentNewAvailabilities.stream()
                        .anyMatch(existing -> existing.getWorkShiftId().equals(targetShiftId) && existing.getDayOfWeek().equals(ea.getDayOfWeek()));

                if (alreadyExists) {
                    availabilityRepository.delete(ea);
                } else {
                    ea.setWorkShiftId(targetShiftId);
                    availabilityRepository.save(ea);
                }
            }
        }

        // 2. Remap employee_preferred_shifts
        List<EmployeePreferredShift> oldPreferred = preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId);
        List<EmployeePreferredShift> currentNewPreferred = preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId);

        for (EmployeePreferredShift eps : oldPreferred) {
            WorkShift oldWs = workShiftRepository.findById(eps.getWorkShiftId()).orElse(null);
            if (oldWs == null) continue;

            WorkShift matchedWs = findMatchingWorkShift(oldWs, oldWs.getShiftName(), newBranchShifts);
            if (matchedWs != null) {
                Long targetShiftId = matchedWs.getId();
                boolean alreadyExists = currentNewPreferred.stream()
                        .anyMatch(existing -> existing.getWorkShiftId().equals(targetShiftId));

                if (alreadyExists) {
                    preferredShiftRepository.delete(eps);
                } else {
                    eps.setWorkShiftId(targetShiftId);
                    preferredShiftRepository.save(eps);
                }
            }
        }
    }

    private WorkShift findMatchingWorkShift(WorkShift oldWs, String fallbackShiftName, List<WorkShift> newBranchShifts) {
        if (newBranchShifts == null || newBranchShifts.isEmpty()) {
            return null;
        }

        // 1. Khớp theo shiftCode
        if (oldWs != null && oldWs.getShiftCode() != null && !oldWs.getShiftCode().isBlank()) {
            for (WorkShift ws : newBranchShifts) {
                if (oldWs.getShiftCode().equalsIgnoreCase(ws.getShiftCode())) {
                    return ws;
                }
            }
        }

        // 2. Khớp theo shiftName
        String shiftName = "";
        if (oldWs != null && oldWs.getShiftName() != null && !oldWs.getShiftName().isBlank()) {
            shiftName = oldWs.getShiftName().trim();
        } else if (fallbackShiftName != null && !fallbackShiftName.isBlank()) {
            shiftName = fallbackShiftName.trim();
        }

        if (!shiftName.isBlank()) {
            final String targetName = shiftName;
            for (WorkShift ws : newBranchShifts) {
                String wsName = ws.getShiftName() != null ? ws.getShiftName().trim() : "";
                if (wsName.equalsIgnoreCase(targetName)
                        || targetName.toLowerCase().startsWith(wsName.toLowerCase())
                        || wsName.toLowerCase().startsWith(targetName.toLowerCase())) {
                    return ws;
                }
            }
        }

        return null;
    }
}
