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
import java.util.List;

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

    // ---------- GỬI THÔNG BÁO (transaction riêng, không ảnh hưởng nghiệp vụ gọi nó) ----------

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void send(Long recipientEmployeeId, Long branchId, String type,
                     String title, String message, Long swapId) {
        saveOne(recipientEmployeeId, branchId, type, title, message, swapId);
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
                .forEach(m -> saveOne(m.getId(), branchId, type, title, message, swapId));
    }

    private void saveOne(Long recipientEmployeeId, Long branchId, String type,
                         String title, String message, Long swapId) {
        if (recipientEmployeeId == null) {
            return;
        }
        Notification n = new Notification();
        n.setRecipientEmployeeId(recipientEmployeeId);
        n.setBranchId(branchId);
        n.setType(type);
        n.setTitle(truncate(title, 150));
        n.setMessage(truncate(message, 500));
        n.setRefType("SWAP");
        n.setRefId(swapId);
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

    @Transactional(readOnly = true)
    public List<NotificationDto> list(Long employeeId) {
        if (employeeId == null) {
            return List.of();
        }
        return notificationRepository.findTop50ByRecipientEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long employeeId) {
        return employeeId == null ? 0L : notificationRepository.countUnread(employeeId);
    }

    @Transactional
    public void markRead(Long notificationId, Long employeeId) {
        Notification n = notificationRepository.findById(notificationId)
                .filter(x -> x.getRecipientEmployeeId().equals(employeeId))
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo", notificationId));
        if (!Boolean.TRUE.equals(n.getIsRead())) {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Transactional
    public void markAllRead(Long employeeId) {
        if (employeeId != null) {
            notificationRepository.markAllRead(employeeId, LocalDateTime.now());
        }
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.getRefType(), n.getRefId(), n.getIsRead(), n.getCreatedAt());
    }
}