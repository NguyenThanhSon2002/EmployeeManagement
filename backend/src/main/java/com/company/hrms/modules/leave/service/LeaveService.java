package com.company.hrms.modules.leave.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.leave.domain.LeaveBalance;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.leave.domain.LeaveType;
import com.company.hrms.modules.leave.dto.*;
import com.company.hrms.modules.leave.repository.LeaveBalanceRepository;
import com.company.hrms.modules.leave.repository.LeaveRequestRepository;
import com.company.hrms.modules.leave.repository.LeaveTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public LeaveService(
            LeaveTypeRepository leaveTypeRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            LeaveRequestRepository leaveRequestRepository) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeDto> getLeaveTypes() {
        return leaveTypeRepository.findAllByIsActiveTrue().stream()
                .map(t -> new LeaveTypeDto(t.getId(), t.getTypeCode(), t.getTypeName(), t.getIsPaid(), t.getRequiresAttachment()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<LeaveBalanceDto> getLeaveBalances(Long employeeId, Integer year) {
        int targetYear = year != null ? year : LocalDateNowYear();
        List<LeaveBalance> balances = leaveBalanceRepository.findAllByEmployeeIdAndYear(employeeId, targetYear);

        if (balances.isEmpty()) {
            // Auto initialize annual leave balance
            LeaveType annualType = leaveTypeRepository.findByTypeCode("ANNUAL_LEAVE").orElse(null);
            if (annualType != null) {
                LeaveBalance initial = new LeaveBalance(employeeId, annualType.getId(), targetYear, BigDecimal.valueOf(12.0));
                balances = List.of(leaveBalanceRepository.save(initial));
            }
        }

        Map<Long, String> typeMap = leaveTypeRepository.findAll().stream()
                .collect(Collectors.toMap(LeaveType::getId, LeaveType::getTypeName));

        return balances.stream().map(b -> {
            LeaveBalanceDto dto = new LeaveBalanceDto();
            dto.setId(b.getId());
            dto.setEmployeeId(b.getEmployeeId());
            dto.setLeaveTypeId(b.getLeaveTypeId());
            dto.setLeaveTypeName(typeMap.getOrDefault(b.getLeaveTypeId(), "Nghỉ phép"));
            dto.setYear(b.getYear());
            dto.setTotalAllocated(b.getTotalAllocated());
            dto.setUsedDays(b.getUsedDays());
            dto.setPendingDays(b.getPendingDays());
            dto.setRemainingDays(b.getRemainingDays());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestDto submitLeaveRequest(Long employeeId, CreateLeaveRequestDto request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BusinessException("VALIDATION_FAILED", "Ngày bắt đầu không được sau ngày kết thúc", HttpStatus.BAD_REQUEST);
        }

        // BR-009: Check overlapping active leave requests
        List<LeaveRequest> overlaps = leaveRequestRepository.findOverlappingActiveLeaves(
                employeeId,
                request.getStartDate(),
                request.getEndDate(),
                null
        );

        if (!overlaps.isEmpty()) {
            throw new BusinessException("ERR_LEAVE_OVERLAP",
                    "Bạn đã có đơn xin nghỉ phép trong khoảng thời gian này đang được xử lý hoặc đã duyệt.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // Balance check
        int year = request.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, request.getLeaveTypeId(), year)
                .orElse(null);

        if (balance != null) {
            if (balance.getRemainingDays().compareTo(request.getTotalDays()) < 0) {
                throw new BusinessException("BAD_REQUEST",
                        "Số ngày xin nghỉ (" + request.getTotalDays() + ") vượt quá quỹ phép khả dụng còn lại (" + balance.getRemainingDays() + " ngày).",
                        HttpStatus.BAD_REQUEST);
            }
            balance.setPendingDays(balance.getPendingDays().add(request.getTotalDays()));
            leaveBalanceRepository.save(balance);
        }

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployeeId(employeeId);
        leaveRequest.setLeaveTypeId(request.getLeaveTypeId());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setTotalDays(request.getTotalDays());
        leaveRequest.setReason(request.getReason());
        leaveRequest.setAttachmentUrl(request.getAttachmentUrl());
        leaveRequest.setStatus("SUBMITTED");

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return toDto(saved);
    }

    @Transactional
    public LeaveRequestDto reviewLeaveRequest(Long requestId, ReviewLeaveRequestDto request, Long reviewerUserId) {
        LeaveRequest leave = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn xin nghỉ phép", requestId));

        if (!"SUBMITTED".equalsIgnoreCase(leave.getStatus())) {
            throw new BusinessException("CONFLICT", "Đơn nghỉ phép này đã được xử lý trước đó", HttpStatus.CONFLICT);
        }

        int year = leave.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(leave.getEmployeeId(), leave.getLeaveTypeId(), year)
                .orElse(null);

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            leave.setStatus("APPROVED");
            if (balance != null) {
                balance.setPendingDays(balance.getPendingDays().subtract(leave.getTotalDays()));
                balance.setUsedDays(balance.getUsedDays().add(leave.getTotalDays()));
                leaveBalanceRepository.save(balance);
            }
        } else {
            leave.setStatus("REJECTED");
            leave.setRejectionReason(request.getRejectionReason());
            if (balance != null) {
                balance.setPendingDays(balance.getPendingDays().subtract(leave.getTotalDays()));
                leaveBalanceRepository.save(balance);
            }
        }

        leave.setTier1ReviewedBy(reviewerUserId != null ? reviewerUserId : 1L);
        leave.setTier1ReviewedAt(LocalDateTime.now());
        LeaveRequest saved = leaveRequestRepository.save(leave);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDto> getEmployeeLeaveRequests(Long employeeId, Pageable pageable) {
        return leaveRequestRepository.findAllByEmployeeIdOrderByCreatedAtDesc(employeeId, pageable)
                .map(this::toDto);
    }

    public LeaveRequestDto toDto(LeaveRequest l) {
        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setId(l.getId());
        dto.setEmployeeId(l.getEmployeeId());
        dto.setLeaveTypeId(l.getLeaveTypeId());

        leaveTypeRepository.findById(l.getLeaveTypeId())
                .ifPresent(t -> dto.setLeaveTypeName(t.getTypeName()));

        dto.setStartDate(l.getStartDate());
        dto.setEndDate(l.getEndDate());
        dto.setTotalDays(l.getTotalDays());
        dto.setReason(l.getReason());
        dto.setAttachmentUrl(l.getAttachmentUrl());
        dto.setStatus(l.getStatus());
        dto.setTier1ReviewedBy(l.getTier1ReviewedBy());
        dto.setTier1ReviewedAt(l.getTier1ReviewedAt());
        dto.setRejectionReason(l.getRejectionReason());
        dto.setCreatedAt(l.getCreatedAt());
        return dto;
    }

    private int LocalDateNowYear() {
        return java.time.LocalDate.now().getYear();
    }
}
