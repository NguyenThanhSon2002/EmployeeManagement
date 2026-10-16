package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class ConflictValidationResult {

    @JsonProperty("is_valid")
    private boolean isValid;

    @JsonProperty("has_mandatory_errors")
    private boolean hasMandatoryErrors;

    @JsonProperty("has_warnings")
    private boolean hasWarnings;

    @JsonProperty("mandatory_errors")
    private List<ScheduleConflictDto> mandatoryErrors = new ArrayList<>();

    @JsonProperty("warnings")
    private List<ScheduleConflictDto> warnings = new ArrayList<>();

    public ConflictValidationResult() {
        this.isValid = true;
        this.hasMandatoryErrors = false;
        this.hasWarnings = false;
    }

    public void addMandatoryError(ScheduleConflictDto error) {
        this.mandatoryErrors.add(error);
        this.hasMandatoryErrors = true;
        this.isValid = false;
    }

    public void addWarning(ScheduleConflictDto warning) {
        this.warnings.add(warning);
        this.hasWarnings = true;
    }

    public boolean getIsValid() { return isValid; }
    public void setIsValid(boolean valid) { isValid = valid; }
    public boolean getHasMandatoryErrors() { return hasMandatoryErrors; }
    public void setHasMandatoryErrors(boolean hasErrors) { this.hasMandatoryErrors = hasErrors; }
    public boolean getHasWarnings() { return hasWarnings; }
    public void setHasWarnings(boolean hasWarnings) { this.hasWarnings = hasWarnings; }
    public List<ScheduleConflictDto> getMandatoryErrors() { return mandatoryErrors; }
    public void setMandatoryErrors(List<ScheduleConflictDto> mandatoryErrors) { this.mandatoryErrors = mandatoryErrors; }
    public List<ScheduleConflictDto> getWarnings() { return warnings; }
    public void setWarnings(List<ScheduleConflictDto> warnings) { this.warnings = warnings; }
}
