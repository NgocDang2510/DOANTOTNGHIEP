package com.saf.booking.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequest {
    private Long roomId;
    private LocalDateTime scheduledAt;
    private String note;
}
