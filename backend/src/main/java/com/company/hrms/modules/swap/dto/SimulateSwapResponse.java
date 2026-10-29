package com.company.hrms.modules.swap.dto;

import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;

import java.util.ArrayList;
import java.util.List;

public class SimulateSwapResponse {

    private boolean valid;
    private boolean hasError;
    private boolean hasWarning;
    private List<ScheduleConflictDto> requesterConflicts = new ArrayList<>();
    private List<ScheduleConflictDto> targetConflicts = new ArrayList<>();
    private String message;

    public SimulateSwapResponse() {
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public boolean isHasError() {
        return hasError;
    }

    public void setHasError(boolean hasError) {
        this.hasError = hasError;
    }

    public boolean isHasWarning() {
        return hasWarning;
    }

    public void setHasWarning(boolean hasWarning) {
        this.hasWarning = hasWarning;
    }

    public List<ScheduleConflictDto> getRequesterConflicts() {
        return requesterConflicts;
    }

    public void setRequesterConflicts(List<ScheduleConflictDto> requesterConflicts) {
        this.requesterConflicts = requesterConflicts;
    }

    public List<ScheduleConflictDto> getTargetConflicts() {
        return targetConflicts;
    }

    public void setTargetConflicts(List<ScheduleConflictDto> targetConflicts) {
        this.targetConflicts = targetConflicts;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
