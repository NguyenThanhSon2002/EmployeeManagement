package com.company.hrms.modules.notification.controller;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.notification.dto.NotificationDto;
import com.company.hrms.modules.notification.service.NotificationService;
import com.company.hrms.security.service.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification", description = "Thông báo trong ứng dụng (đổi ca, nhường ca)")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private Long currentEmployeeId(UserPrincipal principal) {
        return principal == null ? null
                : notificationService.resolveEmployeeId(principal.getId(), principal.getEmployeeId());
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Danh sách thông báo của tôi", description = "50 thông báo mới nhất")
    public ApiResponse<List<NotificationDto>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(notificationService.list(currentEmployeeId(principal)));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Số thông báo chưa đọc")
    public ApiResponse<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(Map.of("count", notificationService.countUnread(currentEmployeeId(principal))));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu một thông báo đã đọc")
    public ApiResponse<Void> markRead(@PathVariable Long id,
                                      @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(id, currentEmployeeId(principal));
        return ApiResponse.success(null);
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu tất cả đã đọc")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(currentEmployeeId(principal));
        return ApiResponse.success(null);
    }
}