package com.company.hrms.modules.notification.repository;

import com.company.hrms.modules.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientUserIdOrRecipientEmployeeIdOrderByCreatedAtDesc(Long userId, Long employeeId);

    @Query("SELECT COUNT(n) FROM Notification n " +
            "WHERE (n.recipientUserId = :userId OR n.recipientEmployeeId = :empId) AND n.isRead = false")
    long countUnread(@Param("userId") Long userId, @Param("empId") Long empId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
            "WHERE (n.recipientUserId = :userId OR n.recipientEmployeeId = :empId) AND n.isRead = false")
    int markAllRead(@Param("userId") Long userId, @Param("empId") Long empId, @Param("now") LocalDateTime now);
}