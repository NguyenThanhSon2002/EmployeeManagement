package com.company.hrms.modules.swap.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionEngine;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.swap.domain.ShiftSwapRequest;
import com.company.hrms.modules.swap.domain.SwapStatus;
import com.company.hrms.modules.swap.domain.SwapType;
import com.company.hrms.modules.swap.dto.*;
import com.company.hrms.modules.swap.repository.ShiftSwapRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ShiftSwapService {

    private final ShiftSwapRequestRepository swapRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final ConflictDetectionEngine conflictEngine;

    public ShiftSwapService(
            ShiftSwapRequestRepository swapRepository,
            ShiftAssignmentRepository assignmentRepository,
            ScheduleRepository scheduleRepository,
            EmployeeRepository employeeRepository,
            BranchRepository branchRepository,
            ConflictDetectionEngine conflictEngine) {
        this.swapRepository = swapRepository;
        this.assignmentRepository = assignmentRepository;
        this.scheduleRepository = scheduleRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.conflictEngine = conflictEngine;
    }

    @Transactional(readOnly = true)
    public SimulateSwapResponse simulateSwap(SimulateSwapRequest request, Long currentUserId) {
        ShiftAssignment reqAssign = assignmentRepository.findById(request.getRequesterAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca của người yêu cầu", request.getRequesterAssignmentId()));

        Schedule schedule = scheduleRepository.findById(reqAssign.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", reqAssign.getScheduleId()));

        Employee targetEmp = employeeRepository.findByIdAndDeletedAtIsNull(request.getTargetEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên đối tác", request.getTargetEmployeeId()));

        if (targetEmp.getId().equals(reqAssign.getEmployeeId())) {
            throw new BusinessException("INVALID_TARGET", "Không thể tự nhường ca cho chính mình.", HttpStatus.BAD_REQUEST);
        }

        SimulateSwapResponse response = new SimulateSwapResponse();
        List<ScheduleConflictDto> targetConflicts = new ArrayList<>();

        // Kiểm tra đồng nghiệp B nhận thêm ca của A
        ConflictValidationResult bResult = conflictEngine.validateAssignment(
                request.getTargetEmployeeId(),
                reqAssign.getWorkShiftId(),
                reqAssign.getWorkDate(),
                reqAssign.getId(),
                schedule.getId(),
                schedule.getBranchId()
        );

        if (bResult.getHasMandatoryErrors()) {
            targetConflicts.addAll(bResult.getMandatoryErrors());
        }
        if (bResult.getHasWarnings()) {
            targetConflicts.addAll(bResult.getWarnings());
        }

        boolean hasError = targetConflicts.stream().anyMatch(c -> "ERROR".equalsIgnoreCase(c.getSeverity()) || "MANDATORY".equalsIgnoreCase(c.getSeverity()));
        boolean hasWarning = !targetConflicts.isEmpty();

        response.setValid(!hasError);
        response.setHasError(hasError);
        response.setHasWarning(hasWarning);
        response.setRequesterConflicts(Collections.emptyList());
        response.setTargetConflicts(targetConflicts);

        if (hasError) {
            response.setMessage("Không thể nhường ca: Đồng nghiệp vi phạm quy định làm việc (nghỉ ngơi tối thiểu hoặc vượt trần giờ làm).");
        } else if (hasWarning) {
            response.setMessage("Có cảnh báo nhẹ về quy định làm việc nhưng vẫn có thể gửi đề xuất để Quản lý xem xét.");
        } else {
            response.setMessage("Ca làm việc hoàn toàn hợp lệ, đồng nghiệp có thể nhận ca.");
        }

        return response;
    }

    @Transactional
    public ShiftSwapResponse createSwapRequest(CreateSwapRequest request, Long currentUserId) {
        return createSwapRequest(request, currentUserId, false, false);
    }

    @Transactional
    public ShiftSwapResponse createSwapRequest(CreateSwapRequest request, Long currentUserId, boolean isDirectorOrAdmin, boolean isManager) {
        ShiftAssignment reqAssign = assignmentRepository.findById(request.getRequesterAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca của người yêu cầu", request.getRequesterAssignmentId()));

        Schedule schedule = scheduleRepository.findById(reqAssign.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", reqAssign.getScheduleId()));

        // Phân quyền đề xuất:
        // - Admin & Giám đốc: Toàn quyền đề xuất cho mọi nhân sự
        // - Quản lý: Đề xuất cho nhân sự cùng chi nhánh quản lý
        // - Nhân viên: Chỉ đề xuất cho ca của chính mình
        boolean isOwner = reqAssign.getEmployeeId().equals(currentUserId);
        if (!isOwner && !isDirectorOrAdmin) {
            if (isManager) {
                Employee manager = currentUserId != null ? employeeRepository.findByIdAndDeletedAtIsNull(currentUserId).orElse(null) : null;
                if (manager == null || manager.getBranchId() == null || !manager.getBranchId().equals(schedule.getBranchId())) {
                    throw new BusinessException("FORBIDDEN_SWAP", "Quản lý chỉ được phép tạo đề xuất cho nhân sự thuộc chi nhánh mình phụ trách.", HttpStatus.FORBIDDEN);
                }
            } else {
                throw new BusinessException("FORBIDDEN_SWAP", "Bạn chỉ được phép đề xuất nhường ca làm việc của chính mình.", HttpStatus.FORBIDDEN);
            }
        }

        // Kiểm tra xem ca này đã có đơn chờ duyệt nào chưa
        List<SwapStatus> pendingStatuses = List.of(SwapStatus.PENDING_PEER, SwapStatus.PEER_ACCEPTED);
        boolean exists = swapRepository.existsByRequesterAssignmentIdAndStatusIn(reqAssign.getId(), pendingStatuses);
        if (exists) {
            throw new BusinessException("SWAP_ALREADY_EXISTS", "Ca làm việc này đã có đơn đổi ca đang chờ xử lý.", HttpStatus.BAD_REQUEST);
        }

        // Kiểm tra xung đột trước khi tạo
        SimulateSwapRequest simReq = new SimulateSwapRequest();
        simReq.setRequesterAssignmentId(request.getRequesterAssignmentId());
        simReq.setTargetEmployeeId(request.getTargetEmployeeId());
        simReq.setType(SwapType.HANDOVER);

        SimulateSwapResponse simRes = simulateSwap(simReq, reqAssign.getEmployeeId());
        if (simRes.isHasError()) {
            throw new BusinessException("SWAP_CONFLICT", simRes.getMessage(), HttpStatus.BAD_REQUEST);
        }

        String requestCode = "HANDOVER-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
                + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        ShiftSwapRequest swap = new ShiftSwapRequest();
        swap.setRequestCode(requestCode);
        swap.setBranchId(schedule.getBranchId());
        swap.setRequesterId(reqAssign.getEmployeeId());
        swap.setRequesterAssignmentId(reqAssign.getId());
        swap.setTargetId(request.getTargetEmployeeId());
        swap.setTargetAssignmentId(null);
        swap.setType(SwapType.HANDOVER);
        swap.setReason(request.getReason());
        swap.setStatus(SwapStatus.PENDING_PEER);

        ShiftSwapRequest saved = swapRepository.save(swap);
        return toResponse(saved);
    }

    @Transactional
    public ShiftSwapResponse peerRespond(Long swapId, PeerRespondRequest request, Long currentUserId) {
        ShiftSwapRequest swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu đổi ca", swapId));

        if (!swap.getTargetId().equals(currentUserId)) {
            throw new BusinessException("FORBIDDEN_PEER", "Chỉ đồng nghiệp được đề xuất mới có quyền phản hồi yêu cầu này.", HttpStatus.FORBIDDEN);
        }

        if (swap.getStatus() != SwapStatus.PENDING_PEER) {
            throw new BusinessException("INVALID_STATUS", "Yêu cầu đổi ca không còn ở trạng thái chờ đồng nghiệp phản hồi.", HttpStatus.BAD_REQUEST);
        }

        swap.setPeerRespondedAt(LocalDateTime.now());
        swap.setPeerNote(request.getPeerNote());

        if ("ACCEPT".equalsIgnoreCase(request.getAction())) {
            swap.setStatus(SwapStatus.PEER_ACCEPTED);
        } else {
            swap.setStatus(SwapStatus.PEER_REJECTED);
        }

        ShiftSwapRequest saved = swapRepository.save(swap);
        return toResponse(saved);
    }

    @Transactional
    public ShiftSwapResponse managerReview(Long swapId, ManagerReviewRequest request, Long managerId, boolean isDirectorOrAdmin) {
        ShiftSwapRequest swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu đổi ca", swapId));

        if (swap.getStatus() != SwapStatus.PEER_ACCEPTED && swap.getStatus() != SwapStatus.PENDING_PEER) {
            throw new BusinessException("INVALID_STATUS", "Yêu cầu đổi ca không ở trạng thái có thể xét duyệt.", HttpStatus.BAD_REQUEST);
        }

        if (!isDirectorOrAdmin) {
            Employee manager = managerId != null ? employeeRepository.findByIdAndDeletedAtIsNull(managerId).orElse(null) : null;
            if (manager == null || manager.getBranchId() == null || !manager.getBranchId().equals(swap.getBranchId())) {
                throw new BusinessException("FORBIDDEN_BRANCH", "Bạn chỉ có quyền xét duyệt đơn đổi ca của chi nhánh mình phụ trách.", HttpStatus.FORBIDDEN);
            }
        }

        // Nếu phê duyệt trực tiếp khi đang ở trạng thái PENDING_PEER
        if (swap.getStatus() == SwapStatus.PENDING_PEER) {
            swap.setPeerRespondedAt(LocalDateTime.now());
            if (swap.getPeerNote() == null || swap.getPeerNote().isBlank()) {
                swap.setPeerNote("(Quản lý / Admin phê duyệt trực tiếp)");
            }
        }

        swap.setManagerId(managerId);
        if (request.getManagerNote() != null && !request.getManagerNote().isBlank()) {
            swap.setManagerNote(request.getManagerNote());
        } else if (swap.getManagerNote() == null) {
            swap.setManagerNote("Phê duyệt điều động trực tiếp bởi cấp quản lý");
        }

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            // Kiểm tra xung đột lần cuối trước khi áp dụng
            SimulateSwapRequest simReq = new SimulateSwapRequest();
            simReq.setRequesterAssignmentId(swap.getRequesterAssignmentId());
            simReq.setTargetEmployeeId(swap.getTargetId());
            simReq.setType(SwapType.HANDOVER);

            SimulateSwapResponse simRes = simulateSwap(simReq, swap.getRequesterId());
            if (simRes.isHasError()) {
                throw new BusinessException("SWAP_CONFLICT", "Không thể phê duyệt do phát sinh vi phạm quy định làm việc: " + simRes.getMessage(), HttpStatus.BAD_REQUEST);
            }

            ShiftAssignment reqAssign = assignmentRepository.findById(swap.getRequesterAssignmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân ca của người yêu cầu", swap.getRequesterAssignmentId()));

            // Chuyển quyền phân ca sang đồng nghiệp nhận ca
            reqAssign.setEmployeeId(swap.getTargetId());
            reqAssign.setOverrideReason("Nhường ca theo " + swap.getRequestCode());
            assignmentRepository.save(reqAssign);

            // Tăng phiên bản schedule
            Schedule sched = scheduleRepository.findById(reqAssign.getScheduleId()).orElse(null);
            if (sched != null) {
                sched.setVersion(sched.getVersion() + 1);
                scheduleRepository.save(sched);
            }

            swap.setStatus(SwapStatus.APPROVED);
            swap.setApprovedAt(LocalDateTime.now());
        } else {
            swap.setStatus(SwapStatus.REJECTED);
        }

        ShiftSwapRequest saved = swapRepository.save(swap);
        return toResponse(saved);
    }

    @Transactional
    public ShiftSwapResponse cancelRequest(Long swapId, Long currentUserId) {
        return cancelRequest(swapId, currentUserId, false);
    }

    @Transactional
    public ShiftSwapResponse cancelRequest(Long swapId, Long currentUserId, boolean isDirectorOrAdmin) {
        ShiftSwapRequest swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu đổi ca", swapId));

        if (!isDirectorOrAdmin && !swap.getRequesterId().equals(currentUserId)) {
            throw new BusinessException("FORBIDDEN_CANCEL", "Chỉ người khởi tạo mới có quyền hủy yêu cầu này.", HttpStatus.FORBIDDEN);
        }

        if (swap.getStatus() == SwapStatus.APPROVED || swap.getStatus() == SwapStatus.CANCELLED) {
            throw new BusinessException("INVALID_STATUS", "Không thể hủy yêu cầu đã được phê duyệt hoặc đã hủy trước đó.", HttpStatus.BAD_REQUEST);
        }

        swap.setStatus(SwapStatus.CANCELLED);
        ShiftSwapRequest saved = swapRepository.save(swap);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ShiftSwapResponse> getMyRequests(Long currentUserId) {
        List<ShiftSwapRequest> list = swapRepository.findAllByEmployeeId(currentUserId);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftSwapResponse> getPendingManagerRequests(Long branchId) {
        List<ShiftSwapRequest> list = swapRepository.findByBranchIdAndStatus(branchId, SwapStatus.PEER_ACCEPTED);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftSwapResponse> getAllBranchRequests(Long branchId) {
        List<ShiftSwapRequest> list = swapRepository.findByBranchId(branchId);
        return list.stream().map(this::toResponse).toList();
    }

    private ShiftSwapResponse toResponse(ShiftSwapRequest swap) {
        ShiftSwapResponse res = new ShiftSwapResponse();
        res.setId(swap.getId());
        res.setRequestCode(swap.getRequestCode());
        res.setBranchId(swap.getBranchId());

        Branch b = branchRepository.findById(swap.getBranchId()).orElse(null);
        res.setBranchName(b != null ? b.getBranchName() : "");

        Employee reqEmp = employeeRepository.findByIdAndDeletedAtIsNull(swap.getRequesterId()).orElse(null);
        if (reqEmp != null) {
            res.setRequesterId(reqEmp.getId());
            res.setRequesterCode(reqEmp.getEmployeeCode());
            res.setRequesterName(reqEmp.getFullName());
        }

        ShiftAssignment reqAssign = assignmentRepository.findById(swap.getRequesterAssignmentId()).orElse(null);
        if (reqAssign != null) {
            res.setRequesterAssignmentId(reqAssign.getId());
            res.setRequesterShiftName(reqAssign.getSnapshotShiftName());
            res.setRequesterWorkDate(reqAssign.getWorkDate());
            res.setRequesterStartTime(reqAssign.getSnapshotStartTime());
            res.setRequesterEndTime(reqAssign.getSnapshotEndTime());
        }

        Employee targetEmp = employeeRepository.findByIdAndDeletedAtIsNull(swap.getTargetId()).orElse(null);
        if (targetEmp != null) {
            res.setTargetId(targetEmp.getId());
            res.setTargetCode(targetEmp.getEmployeeCode());
            res.setTargetName(targetEmp.getFullName());
        }

        if (swap.getTargetAssignmentId() != null) {
            ShiftAssignment targetAssign = assignmentRepository.findById(swap.getTargetAssignmentId()).orElse(null);
            if (targetAssign != null) {
                res.setTargetAssignmentId(targetAssign.getId());
                res.setTargetShiftName(targetAssign.getSnapshotShiftName());
                res.setTargetWorkDate(targetAssign.getWorkDate());
                res.setTargetStartTime(targetAssign.getSnapshotStartTime());
                res.setTargetEndTime(targetAssign.getSnapshotEndTime());
            }
        }

        res.setType(swap.getType());
        res.setReason(swap.getReason());
        res.setStatus(swap.getStatus());
        res.setPeerNote(swap.getPeerNote());
        res.setPeerRespondedAt(swap.getPeerRespondedAt());
        res.setManagerId(swap.getManagerId());

        if (swap.getManagerId() != null) {
            Employee m = employeeRepository.findByIdAndDeletedAtIsNull(swap.getManagerId()).orElse(null);
            res.setManagerName(m != null ? m.getFullName() : "");
        }

        res.setManagerNote(swap.getManagerNote());
        res.setApprovedAt(swap.getApprovedAt());
        res.setCreatedAt(swap.getCreatedAt());

        return res;
    }
}
