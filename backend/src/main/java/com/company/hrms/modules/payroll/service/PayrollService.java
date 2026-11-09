package com.company.hrms.modules.payroll.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.common.util.SecurityUtils;
import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.attendance.repository.AttendanceRecordRepository;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.leave.repository.LeaveRequestRepository;
import com.company.hrms.modules.payroll.domain.Payroll;
import com.company.hrms.modules.payroll.domain.PayrollItem;
import com.company.hrms.modules.payroll.domain.SalaryContract;
import com.company.hrms.modules.payroll.dto.*;
import com.company.hrms.modules.payroll.engine.PayrollCalculationEngine;
import com.company.hrms.modules.payroll.repository.PayrollItemRepository;
import com.company.hrms.modules.payroll.repository.PayrollRepository;
import com.company.hrms.modules.payroll.repository.SalaryContractRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final PayrollItemRepository payrollItemRepository;
    private final SalaryContractRepository salaryContractRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollCalculationEngine calculationEngine;
    private final UserRepository userRepository;

    public PayrollService(
            PayrollRepository payrollRepository,
            PayrollItemRepository payrollItemRepository,
            SalaryContractRepository salaryContractRepository,
            EmployeeRepository employeeRepository,
            BranchRepository branchRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            LeaveRequestRepository leaveRequestRepository,
            PayrollCalculationEngine calculationEngine,
            UserRepository userRepository
    ) {
        this.payrollRepository = payrollRepository;
        this.payrollItemRepository = payrollItemRepository;
        this.salaryContractRepository = salaryContractRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.calculationEngine = calculationEngine;
        this.userRepository = userRepository;
    }

    @Transactional
    public PayrollDetailResponse generatePayroll(Long branchId, int month, int year, Long actorUserId) {
        Employee actor = getActorEmployee(actorUserId);
        if (isManager(actor) && branchId != null && !branchId.equals(actor.getBranchId())) {
            throw new BusinessException("FORBIDDEN", "Quản lý cơ sở không có quyền tính lương cho chi nhánh khác.", HttpStatus.FORBIDDEN);
        }

        // Kiểm tra bảng lương đã tồn tại và đã chốt hay chưa
        Payroll payroll = payrollRepository.findByPeriodAndBranch(month, year, branchId)
                .orElse(null);

        if (payroll != null && ("APPROVED".equalsIgnoreCase(payroll.getStatus()) || "LOCKED".equalsIgnoreCase(payroll.getStatus()))) {
            throw new BusinessException("PAYROLL_LOCKED", "Bảng lương kỳ này đã được phê duyệt chốt. Không thể tính toán lại.", HttpStatus.BAD_REQUEST);
        }

        if (payroll == null) {
            payroll = new Payroll();
            payroll.setBranchId(branchId);
            payroll.setPeriodMonth(month);
            payroll.setPeriodYear(year);
            payroll.setStatus("DRAFT");
            payroll = payrollRepository.save(payroll);
        } else {
            payrollItemRepository.deleteAllByPayrollId(payroll.getId());
        }

        // Lấy danh sách nhân viên cần tính lương
        List<Employee> targetEmployees;
        if (branchId != null) {
            targetEmployees = employeeRepository.findAllByBranchIdAndDeletedAtIsNull(branchId);
        } else {
            targetEmployees = employeeRepository.findAllByDeletedAtIsNull();
        }

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<PayrollItem> itemsToSave = new ArrayList<>();
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        for (Employee emp : targetEmployees) {
            List<SalaryContract> activeContracts = salaryContractRepository.findActiveContractByDate(emp.getId(), endDate);
            SalaryContract contract = !activeContracts.isEmpty() ? activeContracts.get(0) : null;

            List<AttendanceRecord> attendances = attendanceRecordRepository.findAllByEmployeeIdAndWorkDateBetween(emp.getId(), startDate, endDate);
            List<LeaveRequest> leaves = leaveRequestRepository.findApprovedLeavesForEmployeesInDateRange(List.of(emp.getId()), startDate, endDate);

            PayrollItem item = calculationEngine.calculatePayrollItem(
                    payroll.getId(),
                    emp,
                    contract,
                    attendances,
                    leaves
            );

            totalGross = totalGross.add(item.getGrossSalary());
            totalNet = totalNet.add(item.getNetSalary());
            itemsToSave.add(item);
        }

        payrollItemRepository.saveAll(itemsToSave);

        payroll.setTotalGross(totalGross);
        payroll.setTotalNet(totalNet);
        payroll.setTotalEmployees(itemsToSave.size());
        payrollRepository.save(payroll);

        return getPayrollDetails(payroll.getId(), actorUserId);
    }

    @Transactional
    public PayrollSummaryDto approvePayroll(Long payrollId, Long actorUserId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Bảng lương", payrollId));

        Employee actor = getActorEmployee(actorUserId);
        boolean isDirector = actor != null && actor.getPositionId() != null && actor.getPositionId() == 1;
        boolean isAdmin = (actorUserId != null && actorUserId == 1L);
        if (!isAdmin && !isDirector && !SecurityUtils.isDirectorOrAdmin()) {
            throw new BusinessException("FORBIDDEN", "Chỉ Giám đốc hoặc Quản trị viên (Admin) mới có quyền phê duyệt chốt bảng lương.", HttpStatus.FORBIDDEN);
        }

        payroll.setStatus("APPROVED");
        payroll.setApprovedBy(actorUserId);
        payroll.setApprovedAt(LocalDateTime.now());
        payrollRepository.save(payroll);

        return toSummaryDto(payroll);
    }

    @Transactional
    public PayrollSummaryDto reopenPayroll(Long payrollId, Long actorUserId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Bảng lương", payrollId));

        Employee actor = getActorEmployee(actorUserId);
        boolean isDirector = actor != null && actor.getPositionId() != null && actor.getPositionId() == 1;
        boolean isAdmin = (actorUserId != null && actorUserId == 1L);
        if (!isAdmin && !isDirector && !SecurityUtils.isDirectorOrAdmin()) {
            throw new BusinessException("FORBIDDEN", "Chỉ Giám đốc hoặc Quản trị viên (Admin) mới có quyền mở lại bảng lương đã duyệt.", HttpStatus.FORBIDDEN);
        }

        payroll.setStatus("DRAFT");
        payroll.setApprovedBy(null);
        payroll.setApprovedAt(null);
        payrollRepository.save(payroll);

        return toSummaryDto(payroll);
    }

    @Transactional
    public PayrollItemDto updatePayrollItem(Long itemId, UpdatePayrollItemRequest request, Long actorUserId) {
        PayrollItem item = payrollItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi tiết phiếu lương", itemId));

        Payroll payroll = payrollRepository.findById(item.getPayrollId())
                .orElseThrow(() -> new ResourceNotFoundException("Bảng lương", item.getPayrollId()));

        if ("APPROVED".equalsIgnoreCase(payroll.getStatus()) || "LOCKED".equalsIgnoreCase(payroll.getStatus())) {
            throw new BusinessException("PAYROLL_LOCKED", "Bảng lương kỳ này đã được phê duyệt chốt. Không thể chỉnh sửa.", HttpStatus.BAD_REQUEST);
        }

        Employee actor = getActorEmployee(actorUserId);
        boolean isDirector = actor != null && actor.getPositionId() != null && actor.getPositionId() == 1;
        boolean isAdmin = (actorUserId != null && actorUserId == 1L);
        if (!isAdmin && !isDirector && !SecurityUtils.isDirectorOrAdmin()) {
            throw new BusinessException("FORBIDDEN", "Chỉ Giám đốc hoặc Quản trị viên (Admin) mới có quyền chỉnh sửa phiếu lương.", HttpStatus.FORBIDDEN);
        }

        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(item.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", item.getEmployeeId()));

        LocalDate periodEnd = LocalDate.of(payroll.getPeriodYear(), payroll.getPeriodMonth(), 1).plusMonths(1).minusDays(1);
        List<SalaryContract> activeContracts = salaryContractRepository.findActiveContractByDate(employee.getId(), periodEnd);
        SalaryContract contract = !activeContracts.isEmpty() ? activeContracts.get(0) : null;

        calculationEngine.recalculateAdjustedPayrollItem(item, request, contract);
        payrollItemRepository.save(item);

        // Cập nhật lại tổng quỹ lương của bảng lương cha
        List<PayrollItem> allItems = payrollItemRepository.findAllByPayrollId(payroll.getId());
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        for (PayrollItem pi : allItems) {
            if (pi.getGrossSalary() != null) {
                totalGross = totalGross.add(pi.getGrossSalary());
            }
            if (pi.getNetSalary() != null) {
                totalNet = totalNet.add(pi.getNetSalary());
            }
        }
        payroll.setTotalGross(totalGross);
        payroll.setTotalNet(totalNet);
        payrollRepository.save(payroll);

        PayrollItemDto dto = toItemDto(item);
        dto.setEmployeeCode(employee.getEmployeeCode());
        dto.setFullName(employee.getFullName());
        if (employee.getBranchId() != null) {
            branchRepository.findByIdAndDeletedAtIsNull(employee.getBranchId())
                    .ifPresent(b -> dto.setBranchName(b.getBranchName()));
        }
        dto.setPositionTitle(getPositionTitle(employee.getPositionId()));
        return dto;
    }

    @Transactional(readOnly = true)
    public PayrollDetailResponse getPayrollDetails(Long payrollId, Long actorUserId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Bảng lương", payrollId));

        Employee actor = getActorEmployee(actorUserId);
        if (isManager(actor) && payroll.getBranchId() != null && !payroll.getBranchId().equals(actor.getBranchId())) {
            throw new BusinessException("FORBIDDEN", "Quản lý cơ sở không có quyền xem bảng lương của chi nhánh khác.", HttpStatus.FORBIDDEN);
        }

        List<PayrollItem> items = payrollItemRepository.findAllByPayrollId(payroll.getId());
        List<Long> empIds = items.stream().map(PayrollItem::getEmployeeId).collect(Collectors.toList());
        Map<Long, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        Map<Long, String> branchNameMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, Branch::getBranchName));

        List<PayrollItemDto> itemDtos = items.stream().map(item -> {
            Employee emp = empMap.get(item.getEmployeeId());
            PayrollItemDto dto = toItemDto(item);
            if (emp != null) {
                dto.setEmployeeCode(emp.getEmployeeCode());
                dto.setFullName(emp.getFullName());
                dto.setBranchName(branchNameMap.get(emp.getBranchId()));
                dto.setPositionTitle(getPositionTitle(emp.getPositionId()));
            }
            return dto;
        }).collect(Collectors.toList());

        PayrollDetailResponse response = new PayrollDetailResponse();
        response.setId(payroll.getId());
        response.setBranchId(payroll.getBranchId());
        response.setBranchName(payroll.getBranchId() != null ? branchNameMap.get(payroll.getBranchId()) : "Toàn hệ thống");
        response.setPeriodMonth(payroll.getPeriodMonth());
        response.setPeriodYear(payroll.getPeriodYear());
        response.setStatus(payroll.getStatus());
        response.setTotalGross(payroll.getTotalGross());
        response.setTotalNet(payroll.getTotalNet());
        response.setTotalEmployees(payroll.getTotalEmployees());
        response.setApprovedAt(payroll.getApprovedAt());
        if (payroll.getApprovedBy() != null) {
            userRepository.findById(payroll.getApprovedBy()).ifPresent(u -> response.setApprovedByName(u.getUsername()));
        }
        response.setItems(itemDtos);

        return response;
    }

    @Transactional(readOnly = true)
    public List<PayrollSummaryDto> getPayrolls(Integer year, Long branchId, Long actorUserId) {
        Employee actor = getActorEmployee(actorUserId);
        Long targetBranchId = branchId;
        if (isManager(actor)) {
            targetBranchId = actor.getBranchId();
        }

        List<Payroll> list = payrollRepository.findPayrolls(year, targetBranchId);
        return list.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MyPayslipResponse getMyPayslip(int month, int year, Long actorUserId) {
        Employee employee = employeeRepository.findByUserIdAndDeletedAtIsNull(actorUserId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy hồ sơ nhân viên liên kết với tài khoản này.", HttpStatus.NOT_FOUND));

        List<PayrollItem> items = payrollItemRepository.findEmployeePayslips(employee.getId(), month, year);
        if (items.isEmpty()) {
            throw new BusinessException("NOT_FOUND", "Chưa có phiếu lương cho kỳ tháng " + month + "/" + year + ".", HttpStatus.NOT_FOUND);
        }
        PayrollItem item = items.get(0);

        Payroll payroll = payrollRepository.findById(item.getPayrollId()).orElse(null);
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(employee.getBranchId()).orElse(null);

        MyPayslipResponse res = new MyPayslipResponse();
        res.setItemId(item.getId());
        res.setPayrollId(item.getPayrollId());
        res.setPeriodMonth(month);
        res.setPeriodYear(year);
        res.setPayrollStatus(payroll != null ? payroll.getStatus() : "DRAFT");
        res.setApprovedAt(payroll != null ? payroll.getApprovedAt() : null);

        res.setEmployeeId(employee.getId());
        res.setEmployeeCode(employee.getEmployeeCode());
        res.setFullName(employee.getFullName());
        res.setBranchName(branch != null ? branch.getBranchName() : "");
        res.setPositionTitle(getPositionTitle(employee.getPositionId()));
        res.setEmploymentType(item.getEmploymentType());
        res.setSalaryType(item.getSalaryType());

        res.setStandardHours(item.getStandardHours());
        res.setActualHours(item.getActualHours());
        res.setNightHours(item.getNightHours());
        res.setLateMinutes(item.getLateMinutes());
        res.setUnpaidLeaveDays(item.getUnpaidLeaveDays());

        res.setBasePay(item.getBasePay());
        res.setNightPay(item.getNightPay());
        res.setAttendanceBonus(item.getAttendanceBonus());
        res.setAllowancesTotal(item.getAllowancesTotal());
        res.setGrossSalary(item.getGrossSalary());

        res.setDeductionLate(item.getDeductionLate());
        res.setDeductionUnpaidLeave(item.getDeductionUnpaidLeave());
        res.setInsuranceDeduction(item.getInsuranceDeduction());
        res.setTaxDeduction(item.getTaxDeduction());
        res.setTotalDeductions(item.getDeductionLate()
                .add(item.getDeductionUnpaidLeave())
                .add(item.getInsuranceDeduction())
                .add(item.getTaxDeduction()));

        res.setNetSalary(item.getNetSalary());
        res.setNote(item.getNote());

        return res;
    }

    @Transactional
    public SalaryContractDto createOrUpdateContract(CreateSalaryContractRequest request, Long actorUserId) {
        Employee targetEmp = employeeRepository.findByIdAndDeletedAtIsNull(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", request.getEmployeeId()));

        Employee actor = getActorEmployee(actorUserId);
        if (isManager(actor) && !targetEmp.getBranchId().equals(actor.getBranchId())) {
            throw new BusinessException("FORBIDDEN", "Quản lý cơ sở không có quyền thiết lập lương cho nhân viên chi nhánh khác.", HttpStatus.FORBIDDEN);
        }

        salaryContractRepository.findByEmployeeIdAndIsActiveTrue(targetEmp.getId()).ifPresent(old -> {
            old.setIsActive(false);
            old.setEffectiveTo(request.getEffectiveFrom().minusDays(1));
            salaryContractRepository.save(old);
        });

        SalaryContract contract = new SalaryContract();
        contract.setEmployeeId(targetEmp.getId());
        contract.setSalaryType(request.getSalaryType());
        contract.setBaseSalary(request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO);
        contract.setHourlyRate(request.getHourlyRate() != null ? request.getHourlyRate() : BigDecimal.ZERO);
        contract.setAllowanceLunch(request.getAllowanceLunch() != null ? request.getAllowanceLunch() : BigDecimal.ZERO);
        contract.setAllowanceTravel(request.getAllowanceTravel() != null ? request.getAllowanceTravel() : BigDecimal.ZERO);
        contract.setInsuranceSalary(request.getInsuranceSalary() != null ? request.getInsuranceSalary() : BigDecimal.ZERO);
        contract.setTaxDependents(request.getTaxDependents() != null ? request.getTaxDependents() : 0);
        contract.setEffectiveFrom(request.getEffectiveFrom());
        contract.setEffectiveTo(request.getEffectiveTo());
        contract.setIsActive(true);

        SalaryContract saved = salaryContractRepository.save(contract);
        return toContractDto(saved, targetEmp);
    }

    @Transactional(readOnly = true)
    public SalaryContractDto getContractByEmployeeId(Long employeeId, Long actorUserId) {
        Employee targetEmp = employeeRepository.findByIdAndDeletedAtIsNull(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", employeeId));

        Employee actor = getActorEmployee(actorUserId);
        if (actor != null && !actor.getId().equals(employeeId) && isManager(actor) && !targetEmp.getBranchId().equals(actor.getBranchId())) {
            throw new BusinessException("FORBIDDEN", "Không có quyền xem hợp đồng lương của nhân sự này.", HttpStatus.FORBIDDEN);
        }

        SalaryContract contract = salaryContractRepository.findByEmployeeIdAndIsActiveTrue(employeeId)
                .orElse(null);

        return contract != null ? toContractDto(contract, targetEmp) : null;
    }

    private Employee getActorEmployee(Long actorUserId) {
        if (actorUserId == null || actorUserId == 1L) return null; // Admin
        return employeeRepository.findByUserIdAndDeletedAtIsNull(actorUserId).orElse(null);
    }

    private boolean isManager(Employee actor) {
        return actor != null && actor.getPositionId() != null && actor.getPositionId() == 2;
    }

    private String getPositionTitle(Long positionId) {
        if (positionId == null) return "Nhân viên";
        if (positionId == 1) return "Giám đốc";
        if (positionId == 2) return "Quản lý cơ sở";
        return "Nhân viên";
    }

    private PayrollSummaryDto toSummaryDto(Payroll p) {
        PayrollSummaryDto dto = new PayrollSummaryDto();
        dto.setId(p.getId());
        dto.setBranchId(p.getBranchId());
        if (p.getBranchId() != null) {
            branchRepository.findByIdAndDeletedAtIsNull(p.getBranchId()).ifPresent(b -> dto.setBranchName(b.getBranchName()));
        } else {
            dto.setBranchName("Toàn hệ thống");
        }
        dto.setPeriodMonth(p.getPeriodMonth());
        dto.setPeriodYear(p.getPeriodYear());
        dto.setStatus(p.getStatus());
        dto.setTotalGross(p.getTotalGross());
        dto.setTotalNet(p.getTotalNet());
        dto.setTotalEmployees(p.getTotalEmployees());
        dto.setApprovedAt(p.getApprovedAt());
        dto.setCreatedAt(p.getCreatedAt());
        if (p.getApprovedBy() != null) {
            userRepository.findById(p.getApprovedBy()).ifPresent(u -> dto.setApprovedByName(u.getUsername()));
        }
        return dto;
    }

    private PayrollItemDto toItemDto(PayrollItem item) {
        PayrollItemDto dto = new PayrollItemDto();
        dto.setId(item.getId());
        dto.setPayrollId(item.getPayrollId());
        dto.setEmployeeId(item.getEmployeeId());
        dto.setEmploymentType(item.getEmploymentType());
        dto.setSalaryType(item.getSalaryType());
        dto.setStandardHours(item.getStandardHours());
        dto.setActualHours(item.getActualHours());
        dto.setNightHours(item.getNightHours());
        dto.setLateMinutes(item.getLateMinutes());
        dto.setUnpaidLeaveDays(item.getUnpaidLeaveDays());
        dto.setBasePay(item.getBasePay());
        dto.setNightPay(item.getNightPay());
        dto.setAttendanceBonus(item.getAttendanceBonus());
        dto.setAllowancesTotal(item.getAllowancesTotal());
        dto.setDeductionLate(item.getDeductionLate());
        dto.setDeductionUnpaidLeave(item.getDeductionUnpaidLeave());
        dto.setInsuranceDeduction(item.getInsuranceDeduction());
        dto.setTaxDeduction(item.getTaxDeduction());
        dto.setGrossSalary(item.getGrossSalary());
        dto.setNetSalary(item.getNetSalary());
        dto.setStatus(item.getStatus());
        dto.setNote(item.getNote());
        return dto;
    }

    private SalaryContractDto toContractDto(SalaryContract c, Employee emp) {
        SalaryContractDto dto = new SalaryContractDto();
        dto.setId(c.getId());
        dto.setEmployeeId(c.getEmployeeId());
        dto.setEmployeeCode(emp.getEmployeeCode());
        dto.setFullName(emp.getFullName());
        dto.setSalaryType(c.getSalaryType());
        dto.setBaseSalary(c.getBaseSalary());
        dto.setHourlyRate(c.getHourlyRate());
        dto.setAllowanceLunch(c.getAllowanceLunch());
        dto.setAllowanceTravel(c.getAllowanceTravel());
        dto.setInsuranceSalary(c.getInsuranceSalary());
        dto.setTaxDependents(c.getTaxDependents());
        dto.setEffectiveFrom(c.getEffectiveFrom());
        dto.setEffectiveTo(c.getEffectiveTo());
        dto.setIsActive(c.getIsActive());
        return dto;
    }
}
