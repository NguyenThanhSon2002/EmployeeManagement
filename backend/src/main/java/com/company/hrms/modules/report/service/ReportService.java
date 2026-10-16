package com.company.hrms.modules.report.service;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.attendance.repository.AttendanceRecordRepository;
import com.company.hrms.modules.department.domain.Department;
import com.company.hrms.modules.department.repository.DepartmentRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final AttendanceRecordRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public ReportService(
            AttendanceRecordRepository attendanceRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceSummaryDto> getAttendanceSummary(Long departmentId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate fromDate = ym.atDay(1);
        LocalDate toDate = ym.atEndOfMonth();

        List<Employee> employees = departmentId != null
                ? employeeRepository.findAllByDepartmentIdAndDeletedAtIsNull(departmentId)
                : employeeRepository.findAll().stream().filter(e -> e.getDeletedAt() == null).collect(Collectors.toList());

        List<AttendanceRecord> records = attendanceRepository.findAllByWorkDateBetween(fromDate, toDate);

        Map<Long, List<AttendanceRecord>> recordsByEmp = records.stream()
                .collect(Collectors.groupingBy(AttendanceRecord::getEmployeeId));

        Map<Long, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getDepartmentName));

        List<AttendanceSummaryDto> result = new ArrayList<>();
        for (Employee emp : employees) {
            AttendanceSummaryDto summary = new AttendanceSummaryDto();
            summary.setEmployeeId(emp.getId());
            summary.setEmployeeCode(emp.getEmployeeCode());
            summary.setFullName(emp.getFullName());
            summary.setDepartmentName(deptMap.getOrDefault(emp.getDepartmentId(), "Chưa phân bổ"));

            List<AttendanceRecord> empRecs = recordsByEmp.getOrDefault(emp.getId(), Collections.emptyList());

            long workingDays = 0;
            BigDecimal totalActual = BigDecimal.ZERO;
            BigDecimal totalRegular = BigDecimal.ZERO;
            BigDecimal totalOt = BigDecimal.ZERO;
            BigDecimal totalNight = BigDecimal.ZERO;
            long lateCount = 0;
            long earlyLeaveCount = 0;

            for (AttendanceRecord r : empRecs) {
                if (r.getCheckInTime() != null) {
                    workingDays++;
                    if (r.getActualHours() != null) totalActual = totalActual.add(r.getActualHours());
                    if (r.getRegularHours() != null) totalRegular = totalRegular.add(r.getRegularHours());
                    if (r.getOvertimeHours() != null) totalOt = totalOt.add(r.getOvertimeHours());
                    if (r.getNightHours() != null) totalNight = totalNight.add(r.getNightHours());
                    if (r.getLateMinutes() != null && r.getLateMinutes() > 0) lateCount++;
                    if (r.getEarlyLeaveMinutes() != null && r.getEarlyLeaveMinutes() > 0) earlyLeaveCount++;
                }
            }

            summary.setTotalWorkingDays(workingDays);
            summary.setTotalActualHours(totalActual);
            summary.setTotalRegularHours(totalRegular);
            summary.setTotalOvertimeHours(totalOt);
            summary.setNightHours(totalNight);
            summary.setLateCount(lateCount);
            summary.setEarlyLeaveCount(earlyLeaveCount);

            result.add(summary);
        }

        return result;
    }
}
