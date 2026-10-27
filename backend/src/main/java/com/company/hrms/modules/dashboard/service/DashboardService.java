package com.company.hrms.modules.dashboard.service;

import com.company.hrms.modules.dashboard.dto.AttendanceTrendDto;
import com.company.hrms.modules.dashboard.dto.DashboardOverviewDto;
import com.company.hrms.modules.dashboard.dto.PendingApprovalDto;

import java.util.List;

public interface DashboardService {

    DashboardOverviewDto getOverview(Long branchId);

    List<PendingApprovalDto> getPendingApprovals(Long branchId);

    List<AttendanceTrendDto> getAttendanceTrends(Long branchId);
}
