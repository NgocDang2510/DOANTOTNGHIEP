package com.saf.notification.services;

import com.saf.notification.dtos.NotificationResponse;
import com.saf.notification.dtos.PageResponse;
import com.saf.notification.entities.Notification;
import com.saf.notification.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationStorageService {

    private final NotificationRepository repository;

    @Transactional
    public void save(Long userId, String type, String title, String body, String link) {
        if (userId == null) return;
        try {
            Notification n = Notification.builder()
                    .userId(userId)
                    .type(type)
                    .title(title)
                    .body(body)
                    .link(link)
                    .build();
            repository.save(n);
        } catch (Exception e) {
            log.error("Failed to save notification for user {}: {}", userId, e.getMessage());
        }
    }

    public PageResponse<NotificationResponse> getNotifications(Long userId, int page, int size) {
        var result = repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return PageResponse.from(result.map(NotificationResponse::from));
    }

    public long getUnreadCount(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllReadByUserId(userId);
    }
}
