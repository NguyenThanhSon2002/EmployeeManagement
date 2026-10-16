package com.company.hrms.modules.attendance.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.attendance.domain.AttendanceCorrection;
import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.attendance.dto.*;
import com.company.hrms.modules.attendance.repository.AttendanceCorrectionRepository;
import com.company.hrms.modules.attendance.repository.AttendanceRecordRepository;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository recordRepository;
    private final AttendanceCorrectionRepository correctionRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final AttendanceCalculationService calculationService;

    public AttendanceService(
            AttendanceRecordRepository recordRepository,
            AttendanceCorrectionRepository correctionRepository,
            ShiftAssignmentRepository assignmentRepository,
            AttendanceCalculationService calculationService) {
        this.recordRepository = recordRepository;
        this.correctionRepository = correctionRepository;
        this.assignmentRepository = assignmentRepository;
        this.calculationService = calculationService;
    }

    @Transactional
    public AttendanceRecordDto checkIn(Long employeeId, CheckInRequest request, String clientIp) {
        LocalDate date = request != null && request.getWorkDate() != null ? request.getWorkDate() : LocalDate.now();

        AttendanceRecord record = recordRepository.findByEmployeeIdAndWorkDate(employeeId, date)
                .orElseGet(() -> {
                    AttendanceRecord newRec = new AttendanceRecord();
                    newRec.setEmployeeId(employeeId);
                    newRec.setWorkDate(date);
                    return newRec;
                });

        if (record.getCheckInTime() != null) {
            throw new BusinessException("CONFLICT", "Nhân viên đã check-in vào ngày " + date + " lúc " + record.getCheckInTime(), HttpStatus.CONFLICT);
        }

        record.setCheckInTime(LocalDateTime.now());
        record.setCheckInIp(clientIp);

        List<ShiftAssignment> assignments = assignmentRepository.findAllByEmployeeIdAndWorkDate(employeeId, date);
        ShiftAssignment assignment = assignments.isEmpty() ? null : assignments.get(0);
        if (assignment != null) {
            record.setShiftAssignmentId(assignment.getId());
        }

        calculationService.recalculate(record, assignment);
        AttendanceRecord saved = recordRepository.save(record);
        return toDto(saved);
    }

    @Transactional
    public AttendanceRecordDto checkOut(Long employeeId, CheckOutRequest request, String clientIp) {
        LocalDate date = request != null && request.getWorkDate() != null ? request.getWorkDate() : LocalDate.now();

        AttendanceRecord record = recordRepository.findByEmployeeIdAndWorkDate(employeeId, date)
                .orElseThrow(() -> new BusinessException("BAD_REQUEST", "Chưa có bản ghi check-in cho ngày " + date, HttpStatus.BAD_REQUEST));

        if (record.getCheckOutTime() != null) {
            throw new BusinessException("CONFLICT", "Nhân viên đã check-out trước đó lúc " + record.getCheckOutTime(), HttpStatus.CONFLICT);
        }

        record.setCheckOutTime(LocalDateTime.now());
        record.setCheckOutIp(clientIp);

        ShiftAssignment assignment = record.getShiftAssignmentId() != null
                ? assignmentRepository.findById(record.getShiftAssignmentId()).orElse(null)
                : null;

        calculationService.recalculate(record, assignment);
        AttendanceRecord saved = recordRepository.save(record);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceRecordDto> getAttendanceRecords(Long employeeId, LocalDate workDate, String status, Pageable pageable) {
        return recordRepository.findAttendanceWithFilter(employeeId, workDate, status, pageable)
                .map(this::toDto);
    }

    @Transactional
    public AttendanceCorrectionDto submitCorrection(Long employeeId, AttendanceCorrectionDto request) {
        AttendanceRecord record = recordRepository.findById(request.getAttendanceRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản ghi chấm công", request.getAttendanceRecordId()));

        AttendanceCorrection correction = new AttendanceCorrection();
        correction.setAttendanceRecordId(record.getId());
        correction.setEmployeeId(employeeId);
        correction.setOriginalCheckIn(record.getCheckInTime());
        correction.setOriginalCheckOut(record.getCheckOutTime());
        correction.setRequestedCheckIn(request.getRequestedCheckIn());
        correction.setRequestedCheckOut(request.getRequestedCheckOut());
        correction.setReason(request.getReason());
        correction.setAttachmentUrl(request.getAttachmentUrl());
        correction.setStatus("PENDING");

        AttendanceCorrection saved = correctionRepository.save(correction);
        return toDto(saved);
    }

    @Transactional
    public AttendanceCorrectionDto reviewCorrection(Long correctionId, ReviewCorrectionRequest request, Long reviewerUserId) {
        AttendanceCorrection correction = correctionRepository.findById(correctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn giải trình chấm công", correctionId));

        if (!"PENDING".equalsIgnoreCase(correction.getStatus())) {
            throw new BusinessException("CONFLICT", "Đơn giải trình đã được xử lý trước đó", HttpStatus.CONFLICT);
        }

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            correction.setStatus("APPROVED");

            AttendanceRecord record = recordRepository.findById(correction.getAttendanceRecordId()).orElse(null);
            if (record != null) {
                record.setCheckInTime(correction.getRequestedCheckIn());
                record.setCheckOutTime(correction.getRequestedCheckOut());
                record.setIsManuallyCorrected(true);

                ShiftAssignment assignment = record.getShiftAssignmentId() != null
                        ? assignmentRepository.findById(record.getShiftAssignmentId()).orElse(null)
                        : null;

                calculationService.recalculate(record, assignment);
                recordRepository.save(record);
            }
        } else {
            correction.setStatus("REJECTED");
            correction.setRejectionReason(request.getRejectionReason());
        }

        correction.setReviewedBy(reviewerUserId != null ? reviewerUserId : 1L);
        correction.setReviewedAt(LocalDateTime.now());
        AttendanceCorrection saved = correctionRepository.save(correction);
        return toDto(saved);
    }

    public AttendanceRecordDto toDto(AttendanceRecord r) {
        AttendanceRecordDto dto = new AttendanceRecordDto();
        dto.setId(r.getId());
        dto.setEmployeeId(r.getEmployeeId());
        dto.setShiftAssignmentId(r.getShiftAssignmentId());
        dto.setWorkDate(r.getWorkDate());
        dto.setCheckInTime(r.getCheckInTime());
        dto.setCheckOutTime(r.getCheckOutTime());
        dto.setActualHours(r.getActualHours());
        dto.setRegularHours(r.getRegularHours());
        dto.setOvertimeHours(r.getOvertimeHours());
        dto.setNightHours(r.getNightHours());
        dto.setLateMinutes(r.getLateMinutes());
        dto.setEarlyLeaveMinutes(r.getEarlyLeaveMinutes());
        dto.setStatus(r.getStatus());
        dto.setSource(r.getSource());
        dto.setIsManuallyCorrected(r.getIsManuallyCorrected());
        return dto;
    }

    public AttendanceCorrectionDto toDto(AttendanceCorrection c) {
        AttendanceCorrectionDto dto = new AttendanceCorrectionDto();
        dto.setId(c.getId());
        dto.setAttendanceRecordId(c.getAttendanceRecordId());
        dto.setEmployeeId(c.getEmployeeId());
        dto.setOriginalCheckIn(c.getOriginalCheckIn());
        dto.setOriginalCheckOut(c.getOriginalCheckOut());
        dto.setRequestedCheckIn(c.getRequestedCheckIn());
        dto.setRequestedCheckOut(c.getRequestedCheckOut());
        dto.setReason(c.getReason());
        dto.setAttachmentUrl(c.getAttachmentUrl());
        dto.setStatus(c.getStatus());
        dto.setReviewedBy(c.getReviewedBy());
        dto.setReviewedAt(c.getReviewedAt());
        dto.setRejectionReason(c.getRejectionReason());
        return dto;
    }
}
