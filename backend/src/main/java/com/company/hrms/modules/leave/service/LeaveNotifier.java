package com.company.hrms.modules.leave.service;

import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.leave.domain.LeaveType;
import com.company.hrms.modules.leave.repository.LeaveTypeRepository;
import com.company.hrms.modules.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Gửi thông báo cho nghiệp vụ nghỉ phép. Mọi lỗi đều được nuốt và ghi log
 * để việc gửi thông báo không bao giờ làm hỏng việc nộp hoặc duyệt đơn.
 */
@Component
public class LeaveNotifier {

    private static final Logger log = LoggerFactory.getLogger(LeaveNotifier.class);
    private static final Long DIRECTOR_POSITION_ID = 1L;
    private static final Long MANAGER_POSITION_ID = 2L;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    public LeaveNotifier(NotificationService notificationService,
                         EmployeeRepository employeeRepository,
                         UserRepository userRepository,
                         LeaveTypeRepository leaveTypeRepository) {
        this.notificationService = notificationService;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    /** Nhân viên nộp đơn: Quản lý cùng chi nhánh + Giám đốc + Admin. Quản lý nộp đơn: Giám đốc + Admin. */
    public void notifySubmitted(LeaveRequest leave) {
        try {
            Employee requester = employeeRepository.findByIdAndDeletedAtIsNull(leave.getEmployeeId()).orElse(null);
            if (requester == null || DIRECTOR_POSITION_ID.equals(requester.getPositionId())) {
                return; // Giám đốc tự xin nghỉ: không báo ai
            }

            Set<Long> recipients = new LinkedHashSet<>();
            if (!MANAGER_POSITION_ID.equals(requester.getPositionId())) {
                employeeRepository.findAllByBranchIdAndPositionIdAndDeletedAtIsNull(
                                requester.getBranchId(), MANAGER_POSITION_ID)
                        .stream()
                        .filter(m -> !"RESIGNED".equals(m.getEmploymentStatus()))
                        .map(Employee::getUserId)
                        .filter(Objects::nonNull)
                        .forEach(recipients::add);
            }
            recipients.addAll(userRepository.findActiveUserIdsByRoleCodes(List.of("ROLE_DIRECTOR", "ROLE_ADMIN")));
            if (requester.getUserId() != null) {
                recipients.remove(requester.getUserId());
            }
            if (recipients.isEmpty()) {
                return;
            }

            String message = requester.getFullName() + " xin " + summary(leave)
                    + ". Lý do: " + leave.getReason();
            notificationService.sendToUsers(recipients, requester.getBranchId(), "LEAVE_SUBMITTED",
                    "Đơn xin nghỉ phép mới", message, "LEAVE", leave.getId());
        } catch (Exception e) {
            log.warn("Không gửi được thông báo đơn nghỉ phép mới: {}", e.getMessage());
        }
    }

    /** Duyệt hoặc từ chối: báo cho người xin nghỉ. */
    public void notifyReviewed(LeaveRequest leave, boolean approved, Long reviewerUserId) {
        try {
            Employee requester = employeeRepository.findByIdAndDeletedAtIsNull(leave.getEmployeeId()).orElse(null);
            if (requester == null || requester.getUserId() == null) {
                return;
            }

            String reviewerName = reviewerUserId == null ? "Quản trị viên"
                    : employeeRepository.findByUserIdAndDeletedAtIsNull(reviewerUserId)
                    .map(Employee::getFullName)
                    .orElse("Quản trị viên");

            String title;
            String message;
            if (approved) {
                title = "Đơn xin nghỉ phép đã được duyệt";
                message = "Đơn xin " + summary(leave) + " của bạn đã được " + reviewerName + " duyệt.";
            } else {
                title = "Đơn xin nghỉ phép bị từ chối";
                String reason = leave.getRejectionReason();
                message = "Đơn xin " + summary(leave) + " của bạn đã bị " + reviewerName + " từ chối."
                        + (reason != null && !reason.isBlank() ? " Lý do: " + reason : "");
            }

            notificationService.sendToUsers(List.of(requester.getUserId()), requester.getBranchId(),
                    approved ? "LEAVE_APPROVED" : "LEAVE_REJECTED", title, message, "LEAVE", leave.getId());
        } catch (Exception e) {
            log.warn("Không gửi được thông báo kết quả đơn nghỉ phép: {}", e.getMessage());
        }
    }

    /** Ví dụ: "nghỉ phép năm ngày 06/11/2026 (1 ngày)". */
    private String summary(LeaveRequest leave) {
        String typeName = leaveTypeRepository.findById(leave.getLeaveTypeId())
                .map(LeaveType::getTypeName)
                .orElse("nghỉ phép")
                .toLowerCase(Locale.ROOT);
        String period = leave.getStartDate().equals(leave.getEndDate())
                ? "ngày " + leave.getStartDate().format(DATE_FMT)
                : "từ " + leave.getStartDate().format(DATE_FMT) + " đến " + leave.getEndDate().format(DATE_FMT);
        String days = leave.getTotalDays().stripTrailingZeros().toPlainString();
        return typeName + " " + period + " (" + days + " ngày)";
    }
}