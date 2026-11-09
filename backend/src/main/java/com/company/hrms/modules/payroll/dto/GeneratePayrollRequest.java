package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class GeneratePayrollRequest {

    @JsonProperty("branch_id")
    private Long branchId;

    @NotNull(message = "month không được để trống")
    @Min(value = 1, message = "month phải từ 1 đến 12")
    @Max(value = 12, message = "month phải từ 1 đến 12")
    private Integer month;

    @NotNull(message = "year không được để trống")
    @Min(value = 2020, message = "year không hợp lệ")
    private Integer year;

    public GeneratePayrollRequest() {}

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
}
