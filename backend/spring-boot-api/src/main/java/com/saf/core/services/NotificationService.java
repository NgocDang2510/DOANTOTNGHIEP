package com.saf.core.services;

import com.saf.core.config.RabbitMQConfig;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Publishes notification events to RabbitMQ.
 * nodejs-messaging service consumes the queue and pushes via Socket.io.
 * Circuit Breaker prevents cascade failure when RabbitMQ is unavailable.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final AmqpTemplate amqpTemplate;

    @CircuitBreaker(name = "notification", fallbackMethod = "notifyFallback")
    public void notify(Long userId, String type, String title, String body, String link) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("id", UUID.randomUUID().toString());
        notification.put("type", type);
        notification.put("title", title);
        notification.put("body", body);
        notification.put("link", link != null ? link : "");
        notification.put("createdAt", LocalDateTime.now().toString());

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", String.valueOf(userId));
        payload.put("notification", notification);

        amqpTemplate.convertAndSend(RabbitMQConfig.BOOKING_EXCHANGE, "booking." + type, payload);
        log.debug("[Notification] Published booking.{} for user {}", type, userId);
    }

    // Circuit breaker fallback — log and continue, never crash the business flow
    private void notifyFallback(Long userId, String type, String title, String body, String link, Throwable t) {
        if (t instanceof AmqpException) {
            log.warn("[Notification] RabbitMQ unavailable — circuit OPEN. Skipped notification for user {}: {}", userId, type);
        } else {
            log.warn("[Notification] Circuit fallback for user {}: {} — {}", userId, type, t.getMessage());
        }
    }
}
