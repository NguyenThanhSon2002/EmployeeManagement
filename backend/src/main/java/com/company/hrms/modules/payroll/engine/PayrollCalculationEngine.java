package com.company.hrms.modules.payroll.engine;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.payroll.domain.PayrollItem;
import com.company.hrms.modules.payroll.domain.SalaryContract;
import com.company.hrms.modules.payroll.dto.UpdatePayrollItemRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class PayrollCalculationEngine {

    public static final BigDecimal STANDARD_HOURS_PER_MONTH = new BigDecimal("208.00"); // 26 ngày * 8 giờ
    public static final BigDecimal STANDARD_DAYS_PER_MONTH = new BigDecimal("26.00");
    public static final BigDecimal NIGHT_SURCHARGE_RATE = new BigDecimal("0.30"); // +30% theo Điều 98 BLLĐ 2019
    public static final BigDecimal ATTENDANCE_BONUS_FULLTIME = new BigDecimal("500000");
    public static final BigDecimal ATTENDANCE_BONUS_PARTTIME = new BigDecimal("300000");
    public static final BigDecimal LATE_PENALTY_PER_OCCURRENCE = new BigDecimal("50000");
    public static final BigDecimal INSURANCE_RATE_EMPLOYEE = new BigDecimal("0.105"); // 8% BHXH + 1.5% BHYT + 1% BHTN
    public static final BigDecimal PERSONAL_TAX_RELIEF = new BigDecimal("11000000"); // 11 triệu VND
    public static final BigDecimal DEPENDENT_TAX_RELIEF = new BigDecimal("4400000"); // 4.4 triệu VND / người
    public static final BigDecimal MAX_NON_TAXABLE_LUNCH = new BigDecimal("730000"); // Miễn thuế ăn trưa tối đa 730k

    public PayrollItem calculatePayrollItem(
            Long payrollId,
            Employee employee,
            SalaryContract contract,
            List<AttendanceRecord> attendances,
            List<LeaveRequest> approvedLeaves
    ) {
        PayrollItem item = new PayrollItem();
        item.setPayrollId(payrollId);
        item.setEmployeeId(employee.getId());
        item.setEmploymentType(employee.getEmploymentType() != null ? employee.getEmploymentType() : "FULL_TIME");

        String salaryType = contract != null ? contract.getSalaryType() : ("PART_TIME".equalsIgnoreCase(employee.getEmploymentType()) ? "HOURLY" : "MONTHLY");
        item.setSalaryType(salaryType);

        BigDecimal baseSalary = contract != null ? contract.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal hourlyRate = contract != null ? contract.getHourlyRate() : BigDecimal.ZERO;
        BigDecimal allowanceLunch = contract != null ? contract.getAllowanceLunch() : BigDecimal.ZERO;
        BigDecimal allowanceTravel = contract != null ? contract.getAllowanceTravel() : BigDecimal.ZERO;
        BigDecimal insuranceSalary = contract != null ? contract.getInsuranceSalary() : BigDecimal.ZERO;
        int taxDependents = contract != null && contract.getTaxDependents() != null ? contract.getTaxDependents() : 0;

        // 1. Tổng hợp dữ liệu chấm công thực tế
        BigDecimal actualHours = BigDecimal.ZERO;
        BigDecimal nightHours = BigDecimal.ZERO;
        int lateCount = 0;
        int totalLateMinutes = 0;

        for (AttendanceRecord ar : attendances) {
            if (ar.getActualHours() != null) {
                actualHours = actualHours.add(ar.getActualHours());
            }
            if (ar.getNightHours() != null) {
                nightHours = nightHours.add(ar.getNightHours());
            }
            if (ar.getLateMinutes() != null && ar.getLateMinutes() > 0) {
                lateCount++;
                totalLateMinutes += ar.getLateMinutes();
            }
        }

        // 2. Tổng hợp ngày nghỉ phép
        BigDecimal unpaidLeaveDays = BigDecimal.ZERO;
        for (LeaveRequest lr : approvedLeaves) {
            // leave_type_id = 4 là UNPAID_LEAVE (Nghỉ không lương)
            if (lr.getLeaveTypeId() != null && lr.getLeaveTypeId() == 4L) {
                if (lr.getTotalDays() != null) {
                    unpaidLeaveDays = unpaidLeaveDays.add(lr.getTotalDays());
                }
            }
        }

        item.setStandardHours("HOURLY".equalsIgnoreCase(salaryType) ? actualHours : STANDARD_HOURS_PER_MONTH);
        item.setActualHours(actualHours);
        item.setNightHours(nightHours);
        item.setLateMinutes(totalLateMinutes);
        item.setUnpaidLeaveDays(unpaidLeaveDays);

        // 3. Tính lương cơ bản theo loại hợp đồng
        BigDecimal basePay;
        BigDecimal deductionUnpaidLeave = BigDecimal.ZERO;
        BigDecimal hourlyRateEquivalent;

        if ("HOURLY".equalsIgnoreCase(salaryType)) {
            basePay = hourlyRate.multiply(actualHours).setScale(0, RoundingMode.HALF_UP);
            hourlyRateEquivalent = hourlyRate;
        } else {
            // Full-time: Lương tháng đầy đủ, khấu trừ ngày nghỉ không lương
            basePay = baseSalary.setScale(0, RoundingMode.HALF_UP);
            if (unpaidLeaveDays.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal dailyRate = baseSalary.divide(STANDARD_DAYS_PER_MONTH, 2, RoundingMode.HALF_UP);
                deductionUnpaidLeave = dailyRate.multiply(unpaidLeaveDays).setScale(0, RoundingMode.HALF_UP);
            }
            hourlyRateEquivalent = baseSalary.compareTo(BigDecimal.ZERO) > 0
                    ? baseSalary.divide(STANDARD_HOURS_PER_MONTH, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
        }
        item.setBasePay(basePay);
        item.setDeductionUnpaidLeave(deductionUnpaidLeave);

        // 4. Phụ cấp làm thêm ban đêm (+30%)
        BigDecimal nightPay = nightHours.multiply(hourlyRateEquivalent).multiply(NIGHT_SURCHARGE_RATE).setScale(0, RoundingMode.HALF_UP);
        item.setNightPay(nightPay);

        // 5. Thưởng chuyên cần tự động
        // Tiêu chí: Số lần đi muộn <= 1, tổng số phút đi muộn <= 15, không có ngày nghỉ không phép
        BigDecimal attendanceBonus = BigDecimal.ZERO;
        if (lateCount <= 1 && totalLateMinutes <= 15 && unpaidLeaveDays.compareTo(BigDecimal.ZERO) == 0) {
            if ("HOURLY".equalsIgnoreCase(salaryType)) {
                if (actualHours.compareTo(new BigDecimal("80.00")) >= 0) {
                    attendanceBonus = ATTENDANCE_BONUS_PARTTIME;
                }
            } else {
                attendanceBonus = ATTENDANCE_BONUS_FULLTIME;
            }
        }
        item.setAttendanceBonus(attendanceBonus.setScale(0, RoundingMode.HALF_UP));

        // 6. Phạt đi muộn (nếu vượt quá 15 phút)
        BigDecimal deductionLate = BigDecimal.ZERO;
        if (totalLateMinutes > 15) {
            deductionLate = LATE_PENALTY_PER_OCCURRENCE.multiply(BigDecimal.valueOf(lateCount)).setScale(0, RoundingMode.HALF_UP);
        }
        item.setDeductionLate(deductionLate);

        // 7. Tổng phụ cấp cố định
        BigDecimal allowancesTotal = allowanceLunch.add(allowanceTravel).setScale(0, RoundingMode.HALF_UP);
        item.setAllowancesTotal(allowancesTotal);

        // 8. Tổng thu nhập Gross
        BigDecimal grossSalary = basePay
                .add(nightPay)
                .add(attendanceBonus)
                .add(allowancesTotal)
                .subtract(deductionLate)
                .subtract(deductionUnpaidLeave)
                .setScale(0, RoundingMode.HALF_UP);
        if (grossSalary.compareTo(BigDecimal.ZERO) < 0) {
            grossSalary = BigDecimal.ZERO;
        }
        item.setGrossSalary(grossSalary);

        // 9. Khấu trừ BHXH (10.5%)
        BigDecimal insuranceDeduction = BigDecimal.ZERO;
        if ("FULL_TIME".equalsIgnoreCase(item.getEmploymentType()) && insuranceSalary.compareTo(BigDecimal.ZERO) > 0) {
            insuranceDeduction = insuranceSalary.multiply(INSURANCE_RATE_EMPLOYEE).setScale(0, RoundingMode.HALF_UP);
        }
        item.setInsuranceDeduction(insuranceDeduction);

        // 10. Thuế thu nhập cá nhân (PIT)
        BigDecimal nonTaxableLunch = allowanceLunch.min(MAX_NON_TAXABLE_LUNCH);
        BigDecimal totalRelief = PERSONAL_TAX_RELIEF
                .add(DEPENDENT_TAX_RELIEF.multiply(BigDecimal.valueOf(taxDependents)))
                .add(insuranceDeduction)
                .add(nonTaxableLunch);

        BigDecimal taxableIncome = grossSalary.subtract(totalRelief);
        BigDecimal taxDeduction = calculateProgressiveTax(taxableIncome);
        item.setTaxDeduction(taxDeduction);

        // 11. Lương thực nhận Net
        BigDecimal netSalary = grossSalary.subtract(insuranceDeduction).subtract(taxDeduction);
        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            netSalary = BigDecimal.ZERO;
        }
        item.setNetSalary(netSalary);
        item.setStatus("CONFIRMED");

        return item;
    }

    /**
     * Tính thuế TNCN lũy tiến từng phần theo biểu 7 bậc Việt Nam
     */
    public BigDecimal calculateProgressiveTax(BigDecimal taxableIncome) {
        if (taxableIncome == null || taxableIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        double income = taxableIncome.doubleValue();
        double tax;

        if (income <= 5_000_000) {
            tax = income * 0.05;
        } else if (income <= 10_000_000) {
            tax = 250_000 + (income - 5_000_000) * 0.10;
        } else if (income <= 18_000_000) {
            tax = 750_000 + (income - 10_000_000) * 0.15;
        } else if (income <= 32_000_000) {
            tax = 1_950_000 + (income - 18_000_000) * 0.20;
        } else if (income <= 52_000_000) {
            tax = 4_750_000 + (income - 32_000_000) * 0.25;
        } else if (income <= 80_000_000) {
            tax = 9_750_000 + (income - 52_000_000) * 0.30;
        } else {
            tax = 18_150_000 + (income - 80_000_000) * 0.35;
        }

        return BigDecimal.valueOf(tax).setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Tái tính toán phiếu lương khi có các khoản điều chỉnh thủ công từ Quản lý / Giám đốc
     */
    public void recalculateAdjustedPayrollItem(
            PayrollItem item,
            UpdatePayrollItemRequest req,
            SalaryContract contract
    ) {
        if (req.getActualHours() != null) {
            item.setActualHours(req.getActualHours());
        }
        if (req.getNightHours() != null) {
            item.setNightHours(req.getNightHours());
        }
        if (req.getBasePay() != null) {
            item.setBasePay(req.getBasePay().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getAttendanceBonus() != null) {
            item.setAttendanceBonus(req.getAttendanceBonus().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getAllowancesTotal() != null) {
            item.setAllowancesTotal(req.getAllowancesTotal().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getDeductionLate() != null) {
            item.setDeductionLate(req.getDeductionLate().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getDeductionUnpaidLeave() != null) {
            item.setDeductionUnpaidLeave(req.getDeductionUnpaidLeave().setScale(0, RoundingMode.HALF_UP));
        }

        // Nếu là hợp đồng theo giờ (HOURLY) và có cập nhật giờ công / giờ đêm
        if ("HOURLY".equalsIgnoreCase(item.getSalaryType()) && contract != null) {
            BigDecimal hourlyRate = contract.getHourlyRate() != null ? contract.getHourlyRate() : BigDecimal.ZERO;
            if (req.getActualHours() != null && req.getBasePay() == null) {
                item.setBasePay(hourlyRate.multiply(item.getActualHours()).setScale(0, RoundingMode.HALF_UP));
            }
            if (req.getNightHours() != null) {
                BigDecimal nightPay = item.getNightHours().multiply(hourlyRate).multiply(NIGHT_SURCHARGE_RATE).setScale(0, RoundingMode.HALF_UP);
                item.setNightPay(nightPay);
            }
        }

        // 1. Tính Gross mới
        BigDecimal grossSalary = item.getBasePay()
                .add(item.getNightPay())
                .add(item.getAttendanceBonus())
                .add(item.getAllowancesTotal())
                .subtract(item.getDeductionLate())
                .subtract(item.getDeductionUnpaidLeave())
                .setScale(0, RoundingMode.HALF_UP);
        if (grossSalary.compareTo(BigDecimal.ZERO) < 0) {
            grossSalary = BigDecimal.ZERO;
        }
        item.setGrossSalary(grossSalary);

        // 2. Tính BHXH
        BigDecimal insuranceSalary = contract != null && contract.getInsuranceSalary() != null
                ? contract.getInsuranceSalary()
                : BigDecimal.ZERO;
        BigDecimal insuranceDeduction = BigDecimal.ZERO;
        if ("FULL_TIME".equalsIgnoreCase(item.getEmploymentType()) && insuranceSalary.compareTo(BigDecimal.ZERO) > 0) {
            insuranceDeduction = insuranceSalary.multiply(INSURANCE_RATE_EMPLOYEE).setScale(0, RoundingMode.HALF_UP);
        }
        item.setInsuranceDeduction(insuranceDeduction);

        // 3. Tính thuế TNCN
        BigDecimal allowanceLunch = contract != null && contract.getAllowanceLunch() != null
                ? contract.getAllowanceLunch()
                : BigDecimal.ZERO;
        int taxDependents = contract != null && contract.getTaxDependents() != null ? contract.getTaxDependents() : 0;
        BigDecimal nonTaxableLunch = allowanceLunch.min(MAX_NON_TAXABLE_LUNCH);

        BigDecimal totalRelief = PERSONAL_TAX_RELIEF
                .add(DEPENDENT_TAX_RELIEF.multiply(BigDecimal.valueOf(taxDependents)))
                .add(insuranceDeduction)
                .add(nonTaxableLunch);

        BigDecimal taxableIncome = grossSalary.subtract(totalRelief);
        BigDecimal taxDeduction = calculateProgressiveTax(taxableIncome);
        item.setTaxDeduction(taxDeduction);

        // 4. Tính Net mới
        BigDecimal netSalary = grossSalary.subtract(insuranceDeduction).subtract(taxDeduction).setScale(0, RoundingMode.HALF_UP);
        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            netSalary = BigDecimal.ZERO;
        }
        item.setNetSalary(netSalary);

        if (req.getNote() != null) {
            item.setNote(req.getNote().trim());
        }
        item.setStatus("CONFIRMED");
    }
}
