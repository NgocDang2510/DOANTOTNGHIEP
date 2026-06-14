package com.saf.booking.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingInfo {
    private Long id;
    private Long roomId;
    private Long studentId;
    private Long landlordId;
    private String status;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
}
