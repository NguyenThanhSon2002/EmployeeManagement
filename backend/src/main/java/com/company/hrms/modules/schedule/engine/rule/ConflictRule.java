package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;

public interface ConflictRule {

    void evaluate(ConflictDetectionContext context, ConflictValidationResult result);
}
