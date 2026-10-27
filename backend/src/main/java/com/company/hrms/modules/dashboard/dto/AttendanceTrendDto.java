package com.company.hrms.modules.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AttendanceTrendDto {

    private String date;

    @JsonProperty("day_name")
    private String dayName;

    @JsonProperty("on_time_percent")
    private int onTimePercent;

    @JsonProperty("late_percent")
    private int latePercent;

    @JsonProperty("absent_percent")
    private int absentPercent;

    public AttendanceTrendDto() {
    }

    public AttendanceTrendDto(String date, String dayName, int onTimePercent, int latePercent, int absentPercent) {
        this.date = date;
        this.dayName = dayName;
        this.onTimePercent = onTimePercent;
        this.latePercent = latePercent;
        this.absentPercent = absentPercent;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getDayName() { return dayName; }
    public void setDayName(String dayName) { this.dayName = dayName; }
    public int getOnTimePercent() { return onTimePercent; }
    public void setOnTimePercent(int onTimePercent) { this.onTimePercent = onTimePercent; }
    public int getLatePercent() { return latePercent; }
    public void setLatePercent(int latePercent) { this.latePercent = latePercent; }
    public int getAbsentPercent() { return absentPercent; }
    public void setAbsentPercent(int absentPercent) { this.absentPercent = absentPercent; }
}
