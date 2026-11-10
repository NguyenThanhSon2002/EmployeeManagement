package com.company.hrms.modules.payroll.engine;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.payroll.domain.PayrollItem;
import com.company.hrms.modules.payroll.domain.SalaryContract;
import com.company.hrms.modules.payroll.dto.UpdatePayrollItemRequest;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
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

    /**
     * Overload giữ tương thích ngược cho các unit test và service hiện hữu
     */
    public PayrollItem calculatePayrollItem(
            Long payrollId,
            Employee employee,
            SalaryContract contract,
            List<AttendanceRecord> attendances,
            List<LeaveRequest> approvedLeaves
    ) {
        return calculatePayrollItem(payrollId, employee, contract, attendances, Collections.emptyList(), approvedLeaves);
    }

    /**
     * Tính toán phiếu lương có tích hợp tổng hợp giờ làm từ lịch phân ca (ShiftAssignment)
     */
    public PayrollItem calculatePayrollItem(
            Long payrollId,
            Employee employee,
            SalaryContract contract,
            List<AttendanceRecord> attendances,
            List<ShiftAssignment> assignments,
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

        if (attendances != null && !attendances.isEmpty()) {
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
        } else if (assignments != null && !assignments.isEmpty()) {
            // Khi chưa có thiết bị check-in/out thực tế: Tự động tổng hợp giờ làm từ lịch phân ca
            long totalScheduledMinutes = 0;
            long totalNightMinutes = 0;

            for (ShiftAssignment sa : assignments) {
                if (sa.getStatus() != null && "CANCELLED".equalsIgnoreCase(sa.getStatus())) {
                    continue;
                }
                if (sa.getPlannedStartTime() == null || sa.getPlannedEndTime() == null) {
                    continue;
                }
                long shiftMinutes = Duration.between(sa.getPlannedStartTime(), sa.getPlannedEndTime()).toMinutes();
                int breakMin = sa.getSnapshotBreakMinutes() != null ? sa.getSnapshotBreakMinutes() : 0;
                shiftMinutes = Math.max(0, shiftMinutes - breakMin);

                long nightMin = calculateNightMinutes(sa.getPlannedStartTime(), sa.getPlannedEndTime());
                nightMin = Math.min(nightMin, shiftMinutes);

                totalScheduledMinutes += shiftMinutes;
                totalNightMinutes += nightMin;
            }

            actualHours = BigDecimal.valueOf(totalScheduledMinutes).divide(new BigDecimal("60"), 2, RoundingMode.HALF_UP);
            nightHours = BigDecimal.valueOf(totalNightMinutes).divide(new BigDecimal("60"), 2, RoundingMode.HALF_UP);
        }

        // 2. Tổng hợp ngày nghỉ phép
        BigDecimal unpaidLeaveDays = BigDecimal.ZERO;
        if (approvedLeaves != null) {
            for (LeaveRequest lr : approvedLeaves) {
                // leave_type_id = 4 là UNPAID_LEAVE (Nghỉ không lương)
                if (lr.getLeaveTypeId() != null && lr.getLeaveTypeId() == 4L) {
                    if (lr.getTotalDays() != null) {
                        unpaidLeaveDays = unpaidLeaveDays.add(lr.getTotalDays());
                    }
                }
            }
        }

        boolean isPartTime = "HOURLY".equalsIgnoreCase(salaryType) || "PART_TIME".equalsIgnoreCase(employee.getEmploymentType());

        item.setStandardHours(isPartTime ? actualHours : STANDARD_HOURS_PER_MONTH);
        item.setActualHours(actualHours);
        item.setNightHours(nightHours);
        item.setLateMinutes(totalLateMinutes);
        item.setUnpaidLeaveDays(unpaidLeaveDays);

        // 3. Tính lương cơ bản theo loại hợp đồng (Full-time vs Part-time)
        BigDecimal basePay = BigDecimal.ZERO;
        BigDecimal partTimePay = BigDecimal.ZERO;
        BigDecimal partTimeHours = BigDecimal.ZERO;
        BigDecimal fullTimeHours = BigDecimal.ZERO;
        BigDecimal deductionUnpaidLeave = BigDecimal.ZERO;
        BigDecimal hourlyRateEquivalent;
        BigDecimal nightPay = BigDecimal.ZERO;

        boolean isResigned = "RESIGNED".equalsIgnoreCase(employee.getEmploymentStatus());

        if (isPartTime) {
            partTimeHours = actualHours;
            partTimePay = hourlyRate.multiply(actualHours).setScale(0, RoundingMode.HALF_UP);
            hourlyRateEquivalent = hourlyRate;
            basePay = BigDecimal.ZERO;
            fullTimeHours = BigDecimal.ZERO;
            // Part-time: Phụ cấp làm thêm ban đêm (+30%)
            nightPay = nightHours.multiply(hourlyRateEquivalent).multiply(NIGHT_SURCHARGE_RATE).setScale(0, RoundingMode.HALF_UP);
        } else if (isResigned && (actualHours == null || actualHours.compareTo(BigDecimal.ZERO) == 0)) {
            // Nhân sự đã nghỉ việc và không phát sinh giờ làm việc trong kỳ -> Không tính lương cứng
            fullTimeHours = BigDecimal.ZERO;
            basePay = BigDecimal.ZERO;
            deductionUnpaidLeave = BigDecimal.ZERO;
            hourlyRateEquivalent = BigDecimal.ZERO;
            nightPay = BigDecimal.ZERO;
        } else {
            // Full-time: Lương cứng mặc định trọn vẹn theo hợp đồng, chuẩn 8h/ngày (208h/tháng)
            fullTimeHours = (actualHours != null && actualHours.compareTo(BigDecimal.ZERO) > 0)
                    ? actualHours
                    : STANDARD_HOURS_PER_MONTH;
            basePay = baseSalary.setScale(0, RoundingMode.HALF_UP);
            deductionUnpaidLeave = BigDecimal.ZERO;
            hourlyRateEquivalent = baseSalary.compareTo(BigDecimal.ZERO) > 0
                    ? baseSalary.divide(STANDARD_HOURS_PER_MONTH, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            // Full-time: Phụ cấp làm thêm ban đêm (+30% theo giờ quy đổi từ lương cứng)
            nightPay = nightHours.multiply(hourlyRateEquivalent).multiply(NIGHT_SURCHARGE_RATE).setScale(0, RoundingMode.HALF_UP);
        }
        item.setActualHours(fullTimeHours);
        item.setPartTimeHours(partTimeHours);
        item.setBasePay(basePay);
        item.setPartTimePay(partTimePay);
        item.setDeductionUnpaidLeave(deductionUnpaidLeave);
        item.setNightPay(nightPay);

        // 5. Thưởng chuyên cần tự động
        // Tiêu chí: Nhân viên chưa nghỉ việc, số lần đi muộn <= 1, tổng số phút đi muộn <= 15, không có ngày nghỉ không phép
        BigDecimal attendanceBonus = BigDecimal.ZERO;
        if (!isResigned && lateCount <= 1 && totalLateMinutes <= 15 && unpaidLeaveDays.compareTo(BigDecimal.ZERO) == 0) {
            if (isPartTime) {
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
        BigDecimal allowancesTotal = (isResigned && (actualHours == null || actualHours.compareTo(BigDecimal.ZERO) == 0))
                ? BigDecimal.ZERO
                : allowanceLunch.add(allowanceTravel).setScale(0, RoundingMode.HALF_UP);
        item.setAllowancesTotal(allowancesTotal);

        // 8. Tổng thu nhập Gross
        BigDecimal grossSalary = basePay
                .add(partTimePay)
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

        // 9. Lương thực nhận Net = Tổng lương Gross (không tự động khấu trừ BHXH / Thuế TNCN)
        item.setInsuranceDeduction(BigDecimal.ZERO);
        item.setTaxDeduction(BigDecimal.ZERO);
        item.setNetSalary(grossSalary);
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
        if (req.getPartTimeHours() != null) {
            item.setPartTimeHours(req.getPartTimeHours());
        }
        if (req.getNightHours() != null) {
            item.setNightHours(req.getNightHours());
        }
        if (req.getBasePay() != null) {
            item.setBasePay(req.getBasePay().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getPartTimePay() != null) {
            item.setPartTimePay(req.getPartTimePay().setScale(0, RoundingMode.HALF_UP));
        }
        if (req.getNightPay() != null) {
            item.setNightPay(req.getNightPay().setScale(0, RoundingMode.HALF_UP));
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
        if (req.getAdjustmentsDetail() != null) {
            item.setAdjustmentsDetail(req.getAdjustmentsDetail());
        }

        // Tự động tính partTimePay nếu có cập nhật partTimeHours mà không truyền đè partTimePay
        if (contract != null && contract.getHourlyRate() != null && contract.getHourlyRate().compareTo(BigDecimal.ZERO) > 0) {
            if (req.getPartTimeHours() != null && req.getPartTimePay() == null) {
                item.setPartTimePay(contract.getHourlyRate().multiply(item.getPartTimeHours()).setScale(0, RoundingMode.HALF_UP));
            }
        }

        // Nếu là hợp đồng theo giờ (HOURLY) và có cập nhật giờ công / giờ đêm mà không truyền đè tiền
        if ("HOURLY".equalsIgnoreCase(item.getSalaryType()) && contract != null) {
            BigDecimal hourlyRate = contract.getHourlyRate() != null ? contract.getHourlyRate() : BigDecimal.ZERO;
            if (req.getPartTimeHours() != null && req.getPartTimePay() == null) {
                item.setPartTimePay(hourlyRate.multiply(item.getPartTimeHours()).setScale(0, RoundingMode.HALF_UP));
            }
            if (req.getNightHours() != null && req.getNightPay() == null) {
                BigDecimal nightPay = item.getNightHours().multiply(hourlyRate).multiply(NIGHT_SURCHARGE_RATE).setScale(0, RoundingMode.HALF_UP);
                item.setNightPay(nightPay);
            }
        }

        // 1. Tính Gross mới (Tổng lương)
        BigDecimal grossSalary = item.getBasePay()
                .add(item.getPartTimePay())
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

        // Khi điều chỉnh thủ công phiếu lương, tổng lương tính ra chính là Lương thực nhận (Net Pay)
        item.setInsuranceDeduction(BigDecimal.ZERO);
        item.setTaxDeduction(BigDecimal.ZERO);
        item.setNetSalary(grossSalary);

        if (req.getNote() != null) {
            item.setNote(req.getNote().trim());
        }
        item.setStatus("CONFIRMED");
    }

    /**
     * Tính toán số phút làm việc ban đêm (từ 22:00 hôm trước đến 06:00 sáng hôm sau) theo Điều 98 BLLĐ 2019
     */
    public static long calculateNightMinutes(LocalDateTime inTime, LocalDateTime outTime) {
        if (inTime == null || outTime == null || inTime.isAfter(outTime)) {
            return 0L;
        }

        long totalNightMinutes = 0;
        LocalDate cur = inTime.toLocalDate().minusDays(1);
        LocalDate end = outTime.toLocalDate().plusDays(1);

        while (!cur.isAfter(end)) {
            LocalDateTime nightStart = cur.atTime(22, 0);
            LocalDateTime nightEnd = cur.plusDays(1).atTime(6, 0);

            LocalDateTime overlapStart = inTime.isAfter(nightStart) ? inTime : nightStart;
            LocalDateTime overlapEnd = outTime.isBefore(nightEnd) ? outTime : nightEnd;

            if (overlapStart.isBefore(overlapEnd)) {
                totalNightMinutes += Duration.between(overlapStart, overlapEnd).toMinutes();
            }

            cur = cur.plusDays(1);
        }

        return totalNightMinutes;
    }
}
