package com.saf.notification.controllers;

import com.saf.notification.clients.AuthServiceClient;
import com.saf.notification.dtos.ApiResponse;
import com.saf.notification.dtos.NotificationResponse;
import com.saf.notification.dtos.PageResponse;
import com.saf.notification.dtos.UserInfo;
import com.saf.notification.services.NotificationStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationStorageService storageService;
    private final AuthServiceClient authServiceClient;

    private Long getCurrentUserId() {
        String phone = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserInfo user = authServiceClient.getUserByPhone(phone).getData();
        return user.getId();
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("OK", storageService.getNotifications(userId, page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("OK", Map.of("count", storageService.getUnreadCount(userId))));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> markAllRead() {
        Long userId = getCurrentUserId();
        storageService.markAllRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đọc tất cả", Map.of("ok", true)));
    }
}
