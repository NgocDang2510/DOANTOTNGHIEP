package com.saf.booking.services;

import com.saf.booking.config.RabbitMQConfig;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final RabbitTemplate rabbitTemplate;

    @CircuitBreaker(name = "rabbitmq", fallbackMethod = "notificationFallback")
    public void sendBookingNotification(Map<String, Object> payload) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, payload);
        log.info("Booking notification sent: {}", payload.get("type"));
    }

    private void notificationFallback(Map<String, Object> payload, Exception e) {
        log.warn("RabbitMQ circuit breaker open - notification dropped: {}", e.getMessage());
    }
}
