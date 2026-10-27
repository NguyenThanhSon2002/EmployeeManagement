package com.company.hrms.modules.dashboard.service.impl;

import com.company.hrms.modules.attendance.domain.AttendanceCorrection;
import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.attendance.repository.AttendanceCorrectionRepository;
import com.company.hrms.modules.attendance.repository.AttendanceRecordRepository;
import com.company.hrms.modules.dashboard.dto.AttendanceTrendDto;
import com.company.hrms.modules.dashboard.dto.DashboardOverviewDto;
import com.company.hrms.modules.dashboard.dto.PendingApprovalDto;
import com.company.hrms.modules.dashboard.service.DashboardService;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.leave.domain.LeaveType;
import com.company.hrms.modules.leave.repository.LeaveRequestRepository;
import com.company.hrms.modules.leave.repository.LeaveTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceCorrectionRepository attendanceCorrectionRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    public DashboardServiceImpl(
            EmployeeRepository employeeRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            AttendanceCorrectionRepository attendanceCorrectionRepository,
            LeaveRequestRepository leaveRequestRepository,
            LeaveTypeRepository leaveTypeRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceCorrectionRepository = attendanceCorrectionRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @Override
    public DashboardOverviewDto getOverview(Long branchId) {
        List<Employee> employees = getActiveEmployees(branchId);
        long totalEmployees = employees.size();
        Set<Long> empIds = employees.stream().map(Employee::getId).collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        List<AttendanceRecord> todayRecords = attendanceRecordRepository.findAllByWorkDate(today);

        long presentCount = 0;
        long lateCount = 0;

        for (AttendanceRecord r : todayRecords) {
            if (empIds.contains(r.getEmployeeId())) {
                if (r.getCheckInTime() != null) {
                    presentCount++;
                }
                if ((r.getLateMinutes() != null && r.getLateMinutes() > 0) || "LATE".equalsIgnoreCase(r.getStatus())) {
                    lateCount++;
                }
            }
        }

        long onLeaveCount = 0;
        if (!empIds.isEmpty()) {
            List<LeaveRequest> activeLeaves = leaveRequestRepository.findApprovedLeavesForEmployeesInDateRange(
                    new ArrayList<>(empIds), today, today
            );
            onLeaveCount = activeLeaves.stream().map(LeaveRequest::getEmployeeId).distinct().count();
        }

        double activeContractRate = totalEmployees > 0 ? 100.0 : 0.0;
        double attendanceRate = totalEmployees > 0
                ? Math.round(((double) presentCount / totalEmployees * 100.0) * 10.0) / 10.0
                : 0.0;

        return new DashboardOverviewDto(
                totalEmployees,
                presentCount,
                lateCount,
                onLeaveCount,
                activeContractRate,
                attendanceRate
        );
    }

    @Override
    public List<PendingApprovalDto> getPendingApprovals(Long branchId) {
        List<Employee> allEmployees = employeeRepository.findAllByDeletedAtIsNull();
        Map<Long, Employee> empMap = allEmployees.stream().collect(Collectors.toMap(Employee::getId, e -> e, (a, b) -> a));

        List<LeaveType> leaveTypes = leaveTypeRepository.findAll();
        Map<Long, String> leaveTypeMap = leaveTypes.stream().collect(Collectors.toMap(LeaveType::getId, LeaveType::getTypeName, (a, b) -> a));

        List<PendingApprovalDto> result = new ArrayList<>();

        // 1. Pending Leave Requests
        List<LeaveRequest> pendingLeaves = leaveRequestRepository.findAllByStatusOrderByCreatedAtDesc("SUBMITTED");
        for (LeaveRequest lr : pendingLeaves) {
            Employee emp = empMap.get(lr.getEmployeeId());
            if (emp == null) continue;
            if (branchId != null && !branchId.equals(emp.getBranchId())) continue;

            String typeName = leaveTypeMap.getOrDefault(lr.getLeaveTypeId(), "Nghỉ phép");
            String title = String.format("%s (%s ngày)", typeName, lr.getTotalDays());
            String dateStr = String.format("Từ %s đến %s", lr.getStartDate(), lr.getEndDate());

            result.add(new PendingApprovalDto(
                    lr.getId(),
                    "LEAVE",
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    title,
                    lr.getReason(),
                    dateStr,
                    lr.getCreatedAt()
            ));
        }

        // 2. Pending Attendance Corrections
        List<AttendanceCorrection> pendingCorrections = attendanceCorrectionRepository.findAllByStatusOrderByCreatedAtDesc("PENDING");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        for (AttendanceCorrection ac : pendingCorrections) {
            Employee emp = empMap.get(ac.getEmployeeId());
            if (emp == null) continue;
            if (branchId != null && !branchId.equals(emp.getBranchId())) continue;

            String inTime = ac.getRequestedCheckIn() != null ? ac.getRequestedCheckIn().format(timeFormatter) : "--:--";
            String outTime = ac.getRequestedCheckOut() != null ? ac.getRequestedCheckOut().format(timeFormatter) : "--:--";
            String dateStr = ac.getRequestedCheckIn() != null ? ac.getRequestedCheckIn().toLocalDate().toString() : "";
            String title = String.format("Giải trình chấm công (%s - %s)", inTime, outTime);

            result.add(new PendingApprovalDto(
                    ac.getId(),
                    "ATTENDANCE_CORRECTION",
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    title,
                    ac.getReason(),
                    dateStr,
                    ac.getCreatedAt()
            ));
        }

        // Sort by createdAt descending
        result.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        return result;
    }

    @Override
    public List<AttendanceTrendDto> getAttendanceTrends(Long branchId) {
        List<Employee> employees = getActiveEmployees(branchId);
        long totalEmp = employees.size();
        Set<Long> empIds = employees.stream().map(Employee::getId).collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        List<AttendanceRecord> records = attendanceRecordRepository.findAllByWorkDateBetween(startDate, today);
        Map<LocalDate, List<AttendanceRecord>> recordsByDate = records.stream()
                .filter(r -> empIds.contains(r.getEmployeeId()))
                .collect(Collectors.groupingBy(AttendanceRecord::getWorkDate));

        List<AttendanceTrendDto> list = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<AttendanceRecord> dayRecords = recordsByDate.getOrDefault(d, Collections.emptyList());

            int onTimeCount = 0;
            int lateCount = 0;

            for (AttendanceRecord r : dayRecords) {
                if (r.getCheckInTime() != null) {
                    if ((r.getLateMinutes() != null && r.getLateMinutes() > 0) || "LATE".equalsIgnoreCase(r.getStatus())) {
                        lateCount++;
                    } else {
                        onTimeCount++;
                    }
                }
            }

            int absentCount = Math.max(0, (int) totalEmp - (onTimeCount + lateCount));

            int onTimePct = totalEmp > 0 ? (int) Math.round((double) onTimeCount / totalEmp * 100.0) : 0;
            int latePct = totalEmp > 0 ? (int) Math.round((double) lateCount / totalEmp * 100.0) : 0;
            int absentPct = Math.max(0, 100 - onTimePct - latePct);

            list.add(new AttendanceTrendDto(
                    d.toString(),
                    toVietnameseDayName(d.getDayOfWeek()),
                    onTimePct,
                    latePct,
                    absentPct
            ));
        }

        return list;
    }

    private List<Employee> getActiveEmployees(Long branchId) {
        List<Employee> list = branchId != null
                ? employeeRepository.findAllByBranchIdAndDeletedAtIsNull(branchId)
                : employeeRepository.findAllByDeletedAtIsNull();

        return list.stream()
                .filter(e -> !"RESIGNED".equalsIgnoreCase(e.getEmploymentStatus()))
                .collect(Collectors.toList());
    }

    private String toVietnameseDayName(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }
}
