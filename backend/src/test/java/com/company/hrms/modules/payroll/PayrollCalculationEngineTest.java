package com.company.hrms.modules.payroll;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.payroll.domain.PayrollItem;
import com.company.hrms.modules.payroll.domain.SalaryContract;
import com.company.hrms.modules.payroll.dto.UpdatePayrollItemRequest;
import com.company.hrms.modules.payroll.engine.PayrollCalculationEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;

import static org.junit.jupiter.api.Assertions.*;

class PayrollCalculationEngineTest {

    private PayrollCalculationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new PayrollCalculationEngine();
    }

    @Test
    void testFullTime_StandardAndPunctual_ReceivesAttendanceBonusAndInsuranceDeduction() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setEmploymentType("FULL_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("15000000.00"));
        contract.setInsuranceSalary(new BigDecimal("15000000.00"));
        contract.setAllowanceLunch(new BigDecimal("730000.00"));
        contract.setAllowanceTravel(new BigDecimal("500000.00"));
        contract.setTaxDependents(0);

        List<AttendanceRecord> attendances = new ArrayList<>();
        // 26 days of attendance, 8 hours each, 0 late, 0 night
        for (int i = 1; i <= 26; i++) {
            AttendanceRecord ar = new AttendanceRecord();
            ar.setWorkDate(LocalDate.of(2026, 11, i));
            ar.setActualHours(new BigDecimal("8.00"));
            ar.setNightHours(BigDecimal.ZERO);
            ar.setLateMinutes(0);
            attendances.add(ar);
        }

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, Collections.emptyList());

        assertNotNull(item);
        assertEquals(new BigDecimal("15000000"), item.getBasePay());
        assertEquals(new BigDecimal("500000"), item.getAttendanceBonus());
        assertEquals(new BigDecimal("1230000"), item.getAllowancesTotal());
        assertEquals(BigDecimal.ZERO, item.getDeductionLate());
        assertEquals(BigDecimal.ZERO, item.getDeductionUnpaidLeave());

        // Gross = 15,000,000 + 500,000 + 1,230,000 = 16,730,000
        assertEquals(new BigDecimal("16730000"), item.getGrossSalary());

        // Hệ thống không tự động trừ BHXH / Thuế TNCN: Net = Gross
        assertEquals(BigDecimal.ZERO, item.getInsuranceDeduction());
        assertEquals(BigDecimal.ZERO, item.getTaxDeduction());
        assertEquals(new BigDecimal("16730000"), item.getNetSalary());
    }

    @Test
    void testFullTime_WithNightShiftHours_CalculatesNightPayCorrectly() {
        Employee employee = new Employee();
        employee.setId(2L);
        employee.setEmploymentType("FULL_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("20800000.00")); // Hourly equivalent: 20,800,000 / 208 = 100,000 VND/h
        contract.setInsuranceSalary(new BigDecimal("10000000.00"));
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        List<AttendanceRecord> attendances = new ArrayList<>();
        // 10 night hours: 10 * 100,000 * 30% = 300,000 VND
        AttendanceRecord ar = new AttendanceRecord();
        ar.setWorkDate(LocalDate.of(2026, 11, 2));
        ar.setActualHours(new BigDecimal("8.00"));
        ar.setNightHours(new BigDecimal("10.00"));
        ar.setLateMinutes(0);
        attendances.add(ar);

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, Collections.emptyList());

        assertNotNull(item);
        assertEquals(new BigDecimal("300000"), item.getNightPay());
    }

    @Test
    void testFullTime_ExcessiveLateness_LosesAttendanceBonusAndHasLateDeduction() {
        Employee employee = new Employee();
        employee.setId(3L);
        employee.setEmploymentType("FULL_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("10000000.00"));
        contract.setInsuranceSalary(new BigDecimal("5000000.00"));
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        List<AttendanceRecord> attendances = new ArrayList<>();
        // 2 late occurrences totaling 35 minutes (> 15 minutes allowed)
        AttendanceRecord ar1 = new AttendanceRecord();
        ar1.setWorkDate(LocalDate.of(2026, 11, 3));
        ar1.setActualHours(new BigDecimal("8.00"));
        ar1.setLateMinutes(20);
        attendances.add(ar1);

        AttendanceRecord ar2 = new AttendanceRecord();
        ar2.setWorkDate(LocalDate.of(2026, 11, 4));
        ar2.setActualHours(new BigDecimal("8.00"));
        ar2.setLateMinutes(15);
        attendances.add(ar2);

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, Collections.emptyList());

        assertNotNull(item);
        assertEquals(BigDecimal.ZERO, item.getAttendanceBonus());
        // 2 occurrences * 50,000 VND = 100,000 VND penalty
        assertEquals(new BigDecimal("100000"), item.getDeductionLate());
    }

    @Test
    void testPartTime_HourlyContract_CalculatesHourlyRateAndPartTimeAttendanceBonus() {
        Employee employee = new Employee();
        employee.setId(4L);
        employee.setEmploymentType("PART_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("HOURLY");
        contract.setHourlyRate(new BigDecimal("35000.00"));
        contract.setBaseSalary(BigDecimal.ZERO);
        contract.setInsuranceSalary(BigDecimal.ZERO);
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        List<AttendanceRecord> attendances = new ArrayList<>();
        // 85 hours total (>= 80 hours threshold for part-time attendance bonus)
        // with 10 night hours
        AttendanceRecord ar = new AttendanceRecord();
        ar.setWorkDate(LocalDate.of(2026, 11, 5));
        ar.setActualHours(new BigDecimal("85.00"));
        ar.setNightHours(new BigDecimal("10.00"));
        ar.setLateMinutes(5); // <= 15 minutes, 1 occurrence
        attendances.add(ar);

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, Collections.emptyList());

        assertNotNull(item);
        // Part-Time Pay = 85 * 35,000 = 2,975,000 VND
        assertEquals(new BigDecimal("2975000"), item.getPartTimePay());
        assertEquals(BigDecimal.ZERO, item.getBasePay());
        assertEquals(new BigDecimal("85.00"), item.getPartTimeHours());
        assertEquals(BigDecimal.ZERO, item.getActualHours());
        // Night Pay = 10 * 35,000 * 30% = 105,000 VND
        assertEquals(new BigDecimal("105000"), item.getNightPay());
        // Part-time Attendance Bonus = 300,000 VND
        assertEquals(new BigDecimal("300000"), item.getAttendanceBonus());
        // Part-time has NO social insurance deduction
        assertEquals(BigDecimal.ZERO, item.getInsuranceDeduction());
    }

    @Test
    void testProgressiveTaxBrackets() {
        // Bracket 1: <= 5M (5%)
        assertEquals(new BigDecimal("200000"), engine.calculateProgressiveTax(new BigDecimal("4000000")));

        // Bracket 2: 5M - 10M (250k + 10%)
        // For 8M: 250k + 3M * 10% = 550,000
        assertEquals(new BigDecimal("550000"), engine.calculateProgressiveTax(new BigDecimal("8000000")));

        // Bracket 3: 10M - 18M (750k + 15%)
        // For 15M: 750k + 5M * 15% = 1,500,000
        assertEquals(new BigDecimal("1500000"), engine.calculateProgressiveTax(new BigDecimal("15000000")));

        // Bracket 4: 18M - 32M (1.95M + 20%)
        // For 20M: 1.95M + 2M * 20% = 2,350,000
        assertEquals(new BigDecimal("2350000"), engine.calculateProgressiveTax(new BigDecimal("20000000")));

        // Non-positive taxable income
        assertEquals(BigDecimal.ZERO, engine.calculateProgressiveTax(BigDecimal.ZERO));
        assertEquals(BigDecimal.ZERO, engine.calculateProgressiveTax(new BigDecimal("-1000000")));
    }

    @Test
    void testUnpaidLeave_VoidsAttendanceBonus_BasePayRemainsFixed() {
        Employee employee = new Employee();
        employee.setId(5L);
        employee.setEmploymentType("FULL_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("26000000.00")); // Daily rate: 26,000,000 / 26 = 1,000,000 VND/day
        contract.setInsuranceSalary(BigDecimal.ZERO);
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        List<LeaveRequest> leaves = new ArrayList<>();
        LeaveRequest lr = new LeaveRequest();
        lr.setLeaveTypeId(4L); // UNPAID_LEAVE
        lr.setTotalDays(new BigDecimal("2.00"));
        leaves.add(lr);

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, Collections.emptyList(), leaves);

        assertNotNull(item);
        // Lương cứng giữ nguyên trọn vẹn theo hợp đồng
        assertEquals(new BigDecimal("26000000"), item.getBasePay());
        // Having unpaid leave voids the attendance bonus
        assertEquals(BigDecimal.ZERO, item.getAttendanceBonus());
        // Standard hours defaults to 208 hours (8 hours/day * 26 days)
        assertEquals(new BigDecimal("208.00"), item.getActualHours());
    }

    @Test
    void testRecalculateAdjustedPayrollItem_RecalculatesGrossTaxAndNetProperly() {
        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("10000000"));
        contract.setInsuranceSalary(new BigDecimal("5000000"));
        contract.setAllowanceLunch(new BigDecimal("730000"));
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        PayrollItem item = new PayrollItem();
        item.setEmploymentType("FULL_TIME");
        item.setSalaryType("MONTHLY");
        item.setBasePay(new BigDecimal("10000000"));
        item.setNightPay(BigDecimal.ZERO);
        item.setAttendanceBonus(new BigDecimal("500000"));
        item.setAllowancesTotal(new BigDecimal("730000"));
        item.setDeductionLate(BigDecimal.ZERO);
        item.setDeductionUnpaidLeave(BigDecimal.ZERO);

        UpdatePayrollItemRequest req = new UpdatePayrollItemRequest();
        // Give 2,500,000 bonus (attendance/extra), add 50,000 late deduction
        req.setAttendanceBonus(new BigDecimal("2500000"));
        req.setDeductionLate(new BigDecimal("50000"));
        req.setNote("Thưởng nóng hoàn thành dự án xuất sắc");

        engine.recalculateAdjustedPayrollItem(item, req, contract);

        // Gross = 10,000,000 + 2,500,000 + 730,000 - 50,000 = 13,180,000
        assertEquals(new BigDecimal("13180000"), item.getGrossSalary());

        // Khi điều chỉnh thủ công: Không khấu trừ BHXH/Thuế, Net = Gross
        assertEquals(BigDecimal.ZERO, item.getInsuranceDeduction());
        assertEquals(BigDecimal.ZERO, item.getTaxDeduction());
        assertEquals(new BigDecimal("13180000"), item.getNetSalary());
        assertEquals("Thưởng nóng hoàn thành dự án xuất sắc", item.getNote());
        assertEquals("CONFIRMED", item.getStatus());
    }

    @Test
    void testRecalculateAdjustedPayrollItem_WithNightPayAndAdjustmentsDetail() {
        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("12000000"));
        contract.setInsuranceSalary(BigDecimal.ZERO);
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        PayrollItem item = new PayrollItem();
        item.setEmploymentType("FULL_TIME");
        item.setSalaryType("MONTHLY");
        item.setBasePay(new BigDecimal("12000000"));
        item.setNightPay(BigDecimal.ZERO);
        item.setAttendanceBonus(BigDecimal.ZERO);
        item.setAllowancesTotal(BigDecimal.ZERO);
        item.setDeductionLate(BigDecimal.ZERO);
        item.setDeductionUnpaidLeave(BigDecimal.ZERO);

        UpdatePayrollItemRequest req = new UpdatePayrollItemRequest();
        req.setNightPay(new BigDecimal("600000"));
        req.setAllowancesTotal(new BigDecimal("1030000"));
        req.setAttendanceBonus(new BigDecimal("500000"));
        req.setDeductionLate(new BigDecimal("50000"));
        req.setAdjustmentsDetail("{\"allowances\":[{\"name\":\"Ăn trưa\",\"amount\":730000}],\"bonuses\":[],\"deductions\":[]}");
        req.setNote("Bổ sung tiền ca đêm và chi tiết phụ cấp");

        engine.recalculateAdjustedPayrollItem(item, req, contract);

        assertEquals(new BigDecimal("600000"), item.getNightPay());
        // Gross = 12,000,000 + 600,000 + 500,000 + 1,030,000 - 50,000 = 14,080,000
        assertEquals(new BigDecimal("14080000"), item.getGrossSalary());
        assertEquals("{\"allowances\":[{\"name\":\"Ăn trưa\",\"amount\":730000}],\"bonuses\":[],\"deductions\":[]}", item.getAdjustmentsDetail());
        assertEquals("CONFIRMED", item.getStatus());
    }

    @Test
    void testRecalculateAdjustedPayrollItem_WithFullTimeAndPartTimeCombined() {
        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("15000000"));
        contract.setHourlyRate(new BigDecimal("50000"));
        contract.setInsuranceSalary(new BigDecimal("10000000"));
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);
        contract.setTaxDependents(0);

        PayrollItem item = new PayrollItem();
        item.setEmploymentType("FULL_TIME");
        item.setSalaryType("MONTHLY");
        item.setActualHours(new BigDecimal("160.00"));
        item.setBasePay(new BigDecimal("15000000"));
        item.setPartTimeHours(BigDecimal.ZERO);
        item.setPartTimePay(BigDecimal.ZERO);
        item.setNightHours(BigDecimal.ZERO);
        item.setNightPay(BigDecimal.ZERO);
        item.setAttendanceBonus(BigDecimal.ZERO);
        item.setAllowancesTotal(BigDecimal.ZERO);
        item.setDeductionLate(BigDecimal.ZERO);
        item.setDeductionUnpaidLeave(BigDecimal.ZERO);

        UpdatePayrollItemRequest req = new UpdatePayrollItemRequest();
        req.setActualHours(new BigDecimal("160.00"));
        req.setBasePay(new BigDecimal("15000000"));
        // Thêm 20h công Part-time và 1,000,000đ lương Part-time
        req.setPartTimeHours(new BigDecimal("20.00"));
        req.setPartTimePay(new BigDecimal("1000000"));
        // Thêm 10h đêm và 300,000đ lương ca đêm
        req.setNightHours(new BigDecimal("10.00"));
        req.setNightPay(new BigDecimal("300000"));
        req.setNote("Nhân viên Full-time tăng cường thêm ca part-time và ca đêm");

        engine.recalculateAdjustedPayrollItem(item, req, contract);

        assertEquals(new BigDecimal("15000000"), item.getBasePay());
        assertEquals(new BigDecimal("1000000"), item.getPartTimePay());
        assertEquals(new BigDecimal("300000"), item.getNightPay());
        assertEquals(new BigDecimal("20.00"), item.getPartTimeHours());
        assertEquals(new BigDecimal("10.00"), item.getNightHours());

        // Gross = 15,000,000 + 1,000,000 + 300,000 = 16,300,000
        assertEquals(new BigDecimal("16300000"), item.getGrossSalary());

        // Khi điều chỉnh thủ công: Không khấu trừ BHXH/Thuế, Net = Gross
        assertEquals(BigDecimal.ZERO, item.getInsuranceDeduction());
        assertEquals(BigDecimal.ZERO, item.getTaxDeduction());
        assertEquals(new BigDecimal("16300000"), item.getNetSalary());
        assertEquals("CONFIRMED", item.getStatus());
    }

    @Test
    void testResignedEmployee_ZeroHours_ReceivesZeroSalary() {
        Employee employee = new Employee();
        employee.setId(99L);
        employee.setEmploymentType("FULL_TIME");
        employee.setEmploymentStatus("RESIGNED");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("8500000.00"));
        contract.setAllowanceLunch(new BigDecimal("730000.00"));
        contract.setAllowanceTravel(new BigDecimal("500000.00"));

        List<AttendanceRecord> attendances = Collections.emptyList();

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, Collections.emptyList());

        assertNotNull(item);
        assertEquals(BigDecimal.ZERO, item.getActualHours());
        assertEquals(BigDecimal.ZERO, item.getBasePay());
        assertEquals(BigDecimal.ZERO, item.getAttendanceBonus());
        assertEquals(BigDecimal.ZERO, item.getAllowancesTotal());
        assertEquals(BigDecimal.ZERO, item.getGrossSalary());
        assertEquals(BigDecimal.ZERO, item.getNetSalary());
    }

    @Test
    void testPartTime_AggregatesFromShiftAssignments_WhenAttendanceEmpty() {
        Employee employee = new Employee();
        employee.setId(10L);
        employee.setEmploymentType("PART_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("HOURLY");
        contract.setHourlyRate(new BigDecimal("30000.00"));
        contract.setBaseSalary(BigDecimal.ZERO);
        contract.setInsuranceSalary(BigDecimal.ZERO);
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);

        // 10 ca ngày (8h mỗi ca: 08:00 - 16:00, nghỉ 0) = 80h ngày
        List<ShiftAssignment> assignments = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            ShiftAssignment sa = new ShiftAssignment();
            sa.setPlannedStartTime(LocalDateTime.of(2026, 11, i, 8, 0));
            sa.setPlannedEndTime(LocalDateTime.of(2026, 11, i, 16, 0));
            sa.setSnapshotBreakMinutes(0);
            sa.setStatus("ASSIGNED");
            assignments.add(sa);
        }

        // 2 ca đêm (8h mỗi ca: 22:00 - 06:00 hôm sau, nghỉ 0) = 16h đêm
        for (int i = 11; i <= 12; i++) {
            ShiftAssignment sa = new ShiftAssignment();
            sa.setPlannedStartTime(LocalDateTime.of(2026, 11, i, 22, 0));
            sa.setPlannedEndTime(LocalDateTime.of(2026, 11, i + 1, 6, 0));
            sa.setSnapshotBreakMinutes(0);
            sa.setStatus("ASSIGNED");
            assignments.add(sa);
        }

        // 1 ca bị hủy CANCELLED -> Không được tính
        ShiftAssignment cancelled = new ShiftAssignment();
        cancelled.setPlannedStartTime(LocalDateTime.of(2026, 11, 15, 8, 0));
        cancelled.setPlannedEndTime(LocalDateTime.of(2026, 11, 15, 16, 0));
        cancelled.setStatus("CANCELLED");
        assignments.add(cancelled);

        // attendances rỗng
        List<AttendanceRecord> attendances = Collections.emptyList();

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, assignments, Collections.emptyList());

        assertNotNull(item);
        // Tổng giờ = 80h ngày + 16h đêm = 96.00h
        assertEquals(new BigDecimal("96.00"), item.getPartTimeHours());
        assertEquals(new BigDecimal("16.00"), item.getNightHours());
        assertEquals(BigDecimal.ZERO, item.getActualHours());
        assertEquals(BigDecimal.ZERO, item.getBasePay());

        // Lương giờ = 96 * 30,000 = 2,880,000 VND
        assertEquals(new BigDecimal("2880000"), item.getPartTimePay());
        // Phụ cấp đêm (+30%) = 16 * 30,000 * 30% = 144,000 VND
        assertEquals(new BigDecimal("144000"), item.getNightPay());
        // Thưởng chuyên cần part-time (>= 80h) = 300,000 VND
        assertEquals(new BigDecimal("300000"), item.getAttendanceBonus());

        // Gross = 2,880,000 + 144,000 + 300,000 = 3,324,000 VND
        assertEquals(new BigDecimal("3324000"), item.getGrossSalary());
        assertEquals(new BigDecimal("3324000"), item.getNetSalary());
    }

    @Test
    void testFullTime_AggregatesNightHoursFromShiftAssignments_WhenAttendanceEmpty() {
        Employee employee = new Employee();
        employee.setId(11L);
        employee.setEmploymentType("FULL_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("MONTHLY");
        contract.setBaseSalary(new BigDecimal("20800000.00")); // 100,000 VND/h quy đổi
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);

        // 2 ca đêm (8h mỗi ca: 22:00 - 06:00) = 16h đêm
        List<ShiftAssignment> assignments = new ArrayList<>();
        for (int i = 1; i <= 2; i++) {
            ShiftAssignment sa = new ShiftAssignment();
            sa.setPlannedStartTime(LocalDateTime.of(2026, 11, i, 22, 0));
            sa.setPlannedEndTime(LocalDateTime.of(2026, 11, i + 1, 6, 0));
            sa.setSnapshotBreakMinutes(0);
            sa.setStatus("ASSIGNED");
            assignments.add(sa);
        }

        // attendances rỗng
        List<AttendanceRecord> attendances = Collections.emptyList();

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, assignments, Collections.emptyList());

        assertNotNull(item);
        // Lương cứng trọn vẹn
        assertEquals(new BigDecimal("20800000"), item.getBasePay());
        // Giờ đêm = 16.00h
        assertEquals(new BigDecimal("16.00"), item.getNightHours());
        // Phụ cấp đêm = 16 * 100,000 * 30% = 480,000 VND
        assertEquals(new BigDecimal("480000"), item.getNightPay());
        // Thưởng chuyên cần Full-time = 500,000 VND
        assertEquals(new BigDecimal("500000"), item.getAttendanceBonus());

        // Gross = 20,800,000 + 480,000 + 500,000 = 21,780,000 VND
        assertEquals(new BigDecimal("21780000"), item.getGrossSalary());
        assertEquals(new BigDecimal("21780000"), item.getNetSalary());
    }

    @Test
    void testPartTime_RoutesHoursToPartTimeAndCalculatesHourlyPay_WhenAttendanceEmpty() {
        Employee employee = new Employee();
        employee.setId(12L);
        employee.setEmploymentType("PART_TIME");

        SalaryContract contract = new SalaryContract();
        contract.setSalaryType("HOURLY");
        contract.setHourlyRate(new BigDecimal("35000.00"));
        contract.setBaseSalary(BigDecimal.ZERO);
        contract.setAllowanceLunch(BigDecimal.ZERO);
        contract.setAllowanceTravel(BigDecimal.ZERO);

        // 2 ca ngày (mỗi ca 4h: 08:00 - 12:00) + 1 ca đêm (4h: 22:00 - 02:00) = Tổng 12h, trong đó 4h đêm
        List<ShiftAssignment> assignments = new ArrayList<>();
        // Ca ngày 1
        ShiftAssignment sa1 = new ShiftAssignment();
        sa1.setPlannedStartTime(LocalDateTime.of(2026, 11, 1, 8, 0));
        sa1.setPlannedEndTime(LocalDateTime.of(2026, 11, 1, 12, 0));
        sa1.setSnapshotBreakMinutes(0);
        sa1.setStatus("ASSIGNED");
        assignments.add(sa1);

        // Ca ngày 2
        ShiftAssignment sa2 = new ShiftAssignment();
        sa2.setPlannedStartTime(LocalDateTime.of(2026, 11, 2, 8, 0));
        sa2.setPlannedEndTime(LocalDateTime.of(2026, 11, 2, 12, 0));
        sa2.setSnapshotBreakMinutes(0);
        sa2.setStatus("ASSIGNED");
        assignments.add(sa2);

        // Ca đêm (22:00 - 02:00 sáng hôm sau, toàn bộ 4h nằm trong khung 22h-06h)
        ShiftAssignment saNight = new ShiftAssignment();
        saNight.setPlannedStartTime(LocalDateTime.of(2026, 11, 3, 22, 0));
        saNight.setPlannedEndTime(LocalDateTime.of(2026, 11, 4, 2, 0));
        saNight.setSnapshotBreakMinutes(0);
        saNight.setStatus("ASSIGNED");
        assignments.add(saNight);

        List<AttendanceRecord> attendances = Collections.emptyList();

        PayrollItem item = engine.calculatePayrollItem(100L, employee, contract, attendances, assignments, Collections.emptyList());

        assertNotNull(item);
        // Full-time fields must be 0
        assertEquals(BigDecimal.ZERO, item.getBasePay());
        assertEquals(BigDecimal.ZERO, item.getActualHours());

        // Part-time hours = 12.00h
        assertEquals(new BigDecimal("12.00"), item.getPartTimeHours());
        // Part-time pay = 12 * 35,000 = 420,000 VND
        assertEquals(new BigDecimal("420000"), item.getPartTimePay());

        // Night hours = 4.00h
        assertEquals(new BigDecimal("4.00"), item.getNightHours());
        // Night pay = 4 * 35,000 * 30% = 42,000 VND
        assertEquals(new BigDecimal("42000"), item.getNightPay());

        // Dưới 80h -> Chưa đạt thưởng chuyên cần part-time
        assertEquals(BigDecimal.ZERO, item.getAttendanceBonus());

        // Gross = 420,000 + 42,000 = 462,000 VND
        assertEquals(new BigDecimal("462000"), item.getGrossSalary());
        assertEquals(new BigDecimal("462000"), item.getNetSalary());
    }
}
