package com.company.hrms.modules.notification.service;

import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.notification.domain.Notification;
import com.company.hrms.modules.notification.dto.NotificationDto;
import com.company.hrms.modules.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Service
public class NotificationService {

    private static final Long MANAGER_POSITION_ID = 2L;

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               EmployeeRepository employeeRepository) {
        this.notificationRepository = notificationRepository;
        this.employeeRepository = employeeRepository;
    }

    // ---------- GỬI THEO NHÂN SỰ (đổi ca / nhường ca) ----------

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void send(Long recipientEmployeeId, Long branchId, String type,
                     String title, String message, Long swapId) {
        if (recipientEmployeeId == null) {
            return;
        }
        saveOne(recipientEmployeeId, null, branchId, type, title, message, "SWAP", swapId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendToBranchManagers(Long branchId, String type,
                                     String title, String message, Long swapId) {
        if (branchId == null) {
            return;
        }
        employeeRepository.findAllByBranchIdAndPositionIdAndDeletedAtIsNull(branchId, MANAGER_POSITION_ID)
                .stream()
                .filter(m -> !"RESIGNED".equals(m.getEmploymentStatus()))
                .forEach(m -> saveOne(m.getId(), null, branchId, type, title, message, "SWAP", swapId));
    }

    // ---------- GỬI THEO TÀI KHOẢN (nghỉ phép, và các thông báo mới) ----------

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendToUsers(Collection<Long> userIds, Long branchId, String type,
                            String title, String message, String refType, Long refId) {
        if (userIds == null) {
            return;
        }
        userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .forEach(uid -> saveOne(null, uid, branchId, type, title, message, refType, refId));
    }

    private void saveOne(Long employeeId, Long userId, Long branchId, String type,
                         String title, String message, String refType, Long refId) {
        Notification n = new Notification();
        n.setRecipientEmployeeId(employeeId);
        n.setRecipientUserId(userId);
        n.setBranchId(branchId);
        n.setType(type);
        n.setTitle(truncate(title, 150));
        n.setMessage(truncate(message, 500));
        n.setRefType(refType);
        n.setRefId(refId);
        notificationRepository.save(n);
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    // ---------- ĐỌC THÔNG BÁO (người dùng) ----------

    public Long resolveEmployeeId(Long userId, Long employeeId) {
        if (employeeId != null) {
            return employeeId;
        }
        if (userId == null) {
            return null;
        }
        return employeeRepository.findByUserIdAndDeletedAtIsNull(userId)
                .map(Employee::getId)
                .orElse(null);
    }

    /** Khóa -1 không khớp bản ghi nào, dùng khi người dùng không có id nhân sự / tài khoản. */
    private static Long key(Long id) {
        return id != null ? id : -1L;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(Long userId, Long employeeId) {
        return notificationRepository
                .findTop50ByRecipientUserIdOrRecipientEmployeeIdOrderByCreatedAtDesc(key(userId), key(employeeId))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId, Long employeeId) {
        return notificationRepository.countUnread(key(userId), key(employeeId));
    }

    @Transactional
    public void markRead(Long notificationId, Long userId, Long employeeId) {
        Notification n = notificationRepository.findById(notificationId)
                .filter(x -> isRecipient(x, userId, employeeId))
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo", notificationId));
        if (!Boolean.TRUE.equals(n.getIsRead())) {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Transactional
    public void markAllRead(Long userId, Long employeeId) {
        notificationRepository.markAllRead(key(userId), key(employeeId), LocalDateTime.now());
    }

    private boolean isRecipient(Notification n, Long userId, Long employeeId) {
        return (userId != null && userId.equals(n.getRecipientUserId()))
                || (employeeId != null && employeeId.equals(n.getRecipientEmployeeId()));
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.getRefType(), n.getRefId(), n.getIsRead(), n.getCreatedAt());
    }
}