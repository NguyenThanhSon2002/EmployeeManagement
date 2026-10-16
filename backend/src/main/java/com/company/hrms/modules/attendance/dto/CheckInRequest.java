package com.company.hrms.modules.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

public class CheckInRequest {

    private String note;

    @JsonProperty("work_date")
    private LocalDate workDate;

    public CheckInRequest() {
    }

    public CheckInRequest(String note) {
        this.note = note;
    }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
}
