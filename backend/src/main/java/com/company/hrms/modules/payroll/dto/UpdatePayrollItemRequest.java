package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public class UpdatePayrollItemRequest {

    @JsonProperty("actual_hours")
    @DecimalMin(value = "0.0", message = "Số giờ công thực tế không được âm")
    private BigDecimal actualHours;

    @JsonProperty("night_hours")
    @DecimalMin(value = "0.0", message = "Số giờ ca đêm không được âm")
    private BigDecimal nightHours;

    @JsonProperty("base_pay")
    @DecimalMin(value = "0.0", message = "Lương cơ bản theo công không được âm")
    private BigDecimal basePay;

    @JsonProperty("attendance_bonus")
    @DecimalMin(value = "0.0", message = "Thưởng chuyên cần không được âm")
    private BigDecimal attendanceBonus;

    @JsonProperty("allowances_total")
    @DecimalMin(value = "0.0", message = "Tổng phụ cấp không được âm")
    private BigDecimal allowancesTotal;

    @JsonProperty("deduction_late")
    @DecimalMin(value = "0.0", message = "Khấu trừ đi muộn không được âm")
    private BigDecimal deductionLate;

    @JsonProperty("deduction_unpaid_leave")
    @DecimalMin(value = "0.0", message = "Khấu trừ nghỉ không lương không được âm")
    private BigDecimal deductionUnpaidLeave;

    @NotBlank(message = "Ghi chú lý do điều chỉnh không được để trống")
    @JsonProperty("note")
    private String note;

    public UpdatePayrollItemRequest() {}

    public BigDecimal getActualHours() { return actualHours; }
    public void setActualHours(BigDecimal actualHours) { this.actualHours = actualHours; }

    public BigDecimal getNightHours() { return nightHours; }
    public void setNightHours(BigDecimal nightHours) { this.nightHours = nightHours; }

    public BigDecimal getBasePay() { return basePay; }
    public void setBasePay(BigDecimal basePay) { this.basePay = basePay; }

    public BigDecimal getAttendanceBonus() { return attendanceBonus; }
    public void setAttendanceBonus(BigDecimal attendanceBonus) { this.attendanceBonus = attendanceBonus; }

    public BigDecimal getAllowancesTotal() { return allowancesTotal; }
    public void setAllowancesTotal(BigDecimal allowancesTotal) { this.allowancesTotal = allowancesTotal; }

    public BigDecimal getDeductionLate() { return deductionLate; }
    public void setDeductionLate(BigDecimal deductionLate) { this.deductionLate = deductionLate; }

    public BigDecimal getDeductionUnpaidLeave() { return deductionUnpaidLeave; }
    public void setDeductionUnpaidLeave(BigDecimal deductionUnpaidLeave) { this.deductionUnpaidLeave = deductionUnpaidLeave; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
