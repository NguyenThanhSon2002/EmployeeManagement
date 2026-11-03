package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ClaimShiftRequest {

    @NotNull(message = "schedule_id không được để trống")
    @JsonProperty("schedule_id")
    private Long scheduleId;

    @NotNull(message = "work_shift_id không được để trống")
    @JsonProperty("work_shift_id")
    private Long workShiftId;

    @NotNull(message = "work_date không được để trống")
    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("self_volunteered_confirm")
    private Boolean selfVolunteeredConfirm = false;

    public ClaimShiftRequest() {
    }

    public ClaimShiftRequest(Long scheduleId, Long workShiftId, LocalDate workDate, Boolean selfVolunteeredConfirm) {
        this.scheduleId = scheduleId;
        this.workShiftId = workShiftId;
        this.workDate = workDate;
        this.selfVolunteeredConfirm = selfVolunteeredConfirm;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Long getWorkShiftId() {
        return workShiftId;
    }

    public void setWorkShiftId(Long workShiftId) {
        this.workShiftId = workShiftId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public Boolean getSelfVolunteeredConfirm() {
        return selfVolunteeredConfirm;
    }

    public void setSelfVolunteeredConfirm(Boolean selfVolunteeredConfirm) {
        this.selfVolunteeredConfirm = selfVolunteeredConfirm;
    }
}
