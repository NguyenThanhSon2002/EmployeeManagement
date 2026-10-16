package com.company.hrms.modules.attendance.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.common.response.PageResponse;
import com.company.hrms.modules.attendance.dto.*;
import com.company.hrms.modules.attendance.service.AttendanceService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/attendance")
@Tag(name = "Attendance", description = "Các API chấm công vào/ra và giải trình dữ liệu công")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Thực hiện Check-in vào ca", description = "Ghi nhận mốc thời gian vào ca, tự động đối chiếu ca và tính muộn")
    public ApiResponse<AttendanceRecordDto> checkIn(
            @RequestBody(required = false) CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        Long empId = principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L);
        String clientIp = servletRequest.getRemoteAddr();
        AttendanceRecordDto record = attendanceService.checkIn(empId, request, clientIp);
        return ApiResponse.success(record);
    }

    @PostMapping("/check-out")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Thực hiện Check-out tan ca", description = "Ghi nhận mốc thời gian tan ca, tính giờ làm thực tế, giờ đêm, giờ OT")
    public ApiResponse<AttendanceRecordDto> checkOut(
            @RequestBody(required = false) CheckOutRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        Long empId = principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L);
        String clientIp = servletRequest.getRemoteAddr();
        AttendanceRecordDto record = attendanceService.checkOut(empId, request, clientIp);
        return ApiResponse.success(record);
    }

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Lấy danh sách bảng chấm công", description = "Hỗ trợ phân trang, lọc theo nhân viên, ngày làm việc, trạng thái")
    public PageResponse<AttendanceRecordDto> getAttendanceRecords(
            @RequestParam(value = "employee_id", required = false) Long employeeId,
            @RequestParam(value = "work_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "workDate"));
        Page<AttendanceRecordDto> resultPage = attendanceService.getAttendanceRecords(employeeId, workDate, status, pageRequest);
        return PageResponse.of(resultPage);
    }

    @PostMapping("/corrections")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Nộp đơn giải trình chấm công", description = "Nhân viên yêu cầu điều chỉnh lại giờ check-in / check-out")
    public ApiResponse<AttendanceCorrectionDto> submitCorrection(
            @Valid @RequestBody AttendanceCorrectionDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long empId = principal != null && principal.getEmployeeId() != null ? principal.getEmployeeId() : (principal != null ? principal.getId() : 1L);
        AttendanceCorrectionDto dto = attendanceService.submitCorrection(empId, request);
        return ApiResponse.success(dto);
    }

    @PutMapping("/corrections/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPT_MANAGER')")
    @Operation(summary = "Phê duyệt hoặc từ chối giải trình", description = "Nếu duyệt, giờ chấm công sẽ được tính toán lại ngay lập tức")
    public ApiResponse<AttendanceCorrectionDto> reviewCorrection(
            @PathVariable Long id,
            @Valid @RequestBody ReviewCorrectionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long reviewerId = principal != null ? principal.getId() : 1L;
        AttendanceCorrectionDto dto = attendanceService.reviewCorrection(id, request, reviewerId);
        return ApiResponse.success(dto);
    }
}
