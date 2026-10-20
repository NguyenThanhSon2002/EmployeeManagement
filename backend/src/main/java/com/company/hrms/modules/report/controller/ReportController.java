package com.company.hrms.modules.report.controller;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import com.company.hrms.modules.report.service.ExcelExportService;
import com.company.hrms.modules.report.service.ReportService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Report", description = "Các API tổng hợp báo cáo và xuất file Excel/CSV chuẩn UTF-8")
public class ReportController {

    private final ReportService reportService;
    private final ExcelExportService exportService;
    private final EmployeeRepository employeeRepository;

    public ReportController(ReportService reportService,
                            ExcelExportService exportService,
                            EmployeeRepository employeeRepository) {
        this.reportService = reportService;
        this.exportService = exportService;
        this.employeeRepository = employeeRepository;
    }

    private Long resolveEffectiveBranchId(UserPrincipal principal, Long requestedBranchId) {
        if (principal == null) {
            throw new BusinessException("UNAUTHORIZED", "Yêu cầu xác thực tài khoản", HttpStatus.UNAUTHORIZED);
        }
        boolean isDirector = principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_DIRECTOR".equals(a.getAuthority()));
        if (isDirector) {
            return requestedBranchId;
        }
        if (principal.getEmployeeId() == null) {
            throw new BusinessException("FORBIDDEN", "Tài khoản quản lý chưa được liên kết với hồ sơ nhân sự", HttpStatus.FORBIDDEN);
        }
        return employeeRepository.findByIdAndDeletedAtIsNull(principal.getEmployeeId())
                .map(Employee::getBranchId)
                .filter(Objects::nonNull)
                .orElseThrow(() -> new BusinessException("FORBIDDEN", "Tài khoản quản lý chưa được phân bổ chi nhánh làm việc hợp lệ", HttpStatus.FORBIDDEN));
    }

    @GetMapping("/attendance-summary")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Lấy báo cáo tổng hợp công tháng", description = "Tính tổng ngày làm, giờ thường, giờ OT, giờ đêm, đi muộn của nhân viên theo chi nhánh")
    public ApiResponse<List<AttendanceSummaryDto>> getAttendanceSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "branch_id", required = false) Long branchId,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {

        int targetYear = year != null ? year : LocalDate.now().getYear();
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();

        Long effectiveBranchId = resolveEffectiveBranchId(principal, branchId);
        List<AttendanceSummaryDto> summaries = reportService.getAttendanceSummary(effectiveBranchId, targetYear, targetMonth);
        return ApiResponse.success(summaries);
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Xuất báo cáo Excel (.xlsx)", description = "File định dạng chuẩn Microsoft Excel có định dạng bảng và tiêu đề chuyên nghiệp")
    public ResponseEntity<byte[]> exportExcel(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "branch_id", required = false) Long branchId,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) throws IOException {

        int targetYear = year != null ? year : LocalDate.now().getYear();
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();

        Long effectiveBranchId = resolveEffectiveBranchId(principal, branchId);
        List<AttendanceSummaryDto> summaries = reportService.getAttendanceSummary(effectiveBranchId, targetYear, targetMonth);
        byte[] bytes = exportService.exportAttendanceToExcel(summaries, targetYear, targetMonth);

        String filename = "Bao_Cao_Cham_Cong_" + targetMonth + "_" + targetYear + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER')")
    @Operation(summary = "Xuất báo cáo CSV chuẩn UTF-8 BOM", description = "Chống lỗi font dấu tiếng Việt khi mở trực tiếp bằng Excel")
    public ResponseEntity<byte[]> exportCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "branch_id", required = false) Long branchId,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {

        int targetYear = year != null ? year : LocalDate.now().getYear();
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();

        Long effectiveBranchId = resolveEffectiveBranchId(principal, branchId);
        List<AttendanceSummaryDto> summaries = reportService.getAttendanceSummary(effectiveBranchId, targetYear, targetMonth);
        byte[] bytes = exportService.exportAttendanceToCsv(summaries, targetYear, targetMonth);

        String filename = "Bao_Cao_Cham_Cong_" + targetMonth + "_" + targetYear + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
