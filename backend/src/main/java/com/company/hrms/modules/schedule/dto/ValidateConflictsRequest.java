package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class ValidateConflictsRequest {

    @JsonProperty("department_id")
    private Long departmentId;

    @NotEmpty(message = "Danh sách phân ca cần kiểm tra không được để trống")
    private List<CandidateAssignmentItem> assignments;

    public ValidateConflictsRequest() {
    }

    public static class CandidateAssignmentItem {
        @NotNull(message = "employee_id không được để trống")
        @JsonProperty("employee_id")
        private Long employeeId;

        @NotNull(message = "work_shift_id không được để trống")
        @JsonProperty("work_shift_id")
        private Long workShiftId;

        @NotNull(message = "work_date không được để trống")
        @JsonProperty("work_date")
        private LocalDate workDate;

        @JsonProperty("exclude_assignment_id")
        private Long excludeAssignmentId;

        public CandidateAssignmentItem() {
        }

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public Long getWorkShiftId() { return workShiftId; }
        public void setWorkShiftId(Long workShiftId) { this.workShiftId = workShiftId; }
        public LocalDate getWorkDate() { return workDate; }
        public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
        public Long getExcludeAssignmentId() { return excludeAssignmentId; }
        public void setExcludeAssignmentId(Long id) { this.excludeAssignmentId = id; }
    }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public List<CandidateAssignmentItem> getAssignments() { return assignments; }
    public void setAssignments(List<CandidateAssignmentItem> assignments) { this.assignments = assignments; }
}
