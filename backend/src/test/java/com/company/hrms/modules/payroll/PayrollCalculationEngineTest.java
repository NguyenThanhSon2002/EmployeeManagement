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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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

        // Insurance = 15,000,000 * 10.5% = 1,575,000
        assertEquals(new BigDecimal("1575000"), item.getInsuranceDeduction());

        // Tax Relief = 11,000,000 (personal) + 1,575,000 (BHXH) + 730,000 (Lunch non-taxable) = 13,305,000
        // Taxable Income = 16,730,000 - 13,305,000 = 3,425,000
        // Tax = 3,425,000 * 5% = 171,250
        assertEquals(new BigDecimal("171250"), item.getTaxDeduction());

        // Net = Gross - Insurance - Tax = 16,730,000 - 1,575,000 - 171,250 = 14,983,750
        assertEquals(new BigDecimal("14983750"), item.getNetSalary());
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
        // Base Pay = 85 * 35,000 = 2,975,000 VND
        assertEquals(new BigDecimal("2975000"), item.getBasePay());
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
    void testUnpaidLeave_DeductsFromBaseSalary() {
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
        // 2 days * 1,000,000 = 2,000,000 deduction
        assertEquals(new BigDecimal("2000000"), item.getDeductionUnpaidLeave());
        // Having unpaid leave voids the attendance bonus
        assertEquals(BigDecimal.ZERO, item.getAttendanceBonus());
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

        // Insurance = 5,000,000 * 10.5% = 525,000
        assertEquals(new BigDecimal("525000"), item.getInsuranceDeduction());

        // Relief = 11,000,000 + 525,000 + 730,000 = 12,255,000
        // Taxable = 13,180,000 - 12,255,000 = 925,000
        // Tax = 925,000 * 5% = 46,250
        assertEquals(new BigDecimal("46250"), item.getTaxDeduction());

        // Net = 13,180,000 - 525,000 - 46,250 = 12,608,750
        assertEquals(new BigDecimal("12608750"), item.getNetSalary());
        assertEquals("Thưởng nóng hoàn thành dự án xuất sắc", item.getNote());
        assertEquals("CONFIRMED", item.getStatus());
    }
}
