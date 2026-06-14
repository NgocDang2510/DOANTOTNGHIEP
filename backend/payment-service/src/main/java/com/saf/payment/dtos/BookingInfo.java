package com.saf.payment.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingInfo {
    private Long id;
    private Long roomId;
    private Long studentId;
    private Long landlordId;
    private String status;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
}
