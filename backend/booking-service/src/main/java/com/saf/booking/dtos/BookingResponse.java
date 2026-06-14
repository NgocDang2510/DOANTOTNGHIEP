package com.saf.booking.dtos;

import com.saf.booking.entities.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private Long roomId;
    private String roomTitle;
    private String roomAddress;
    private String roomImageUrl;
    private Long studentId;
    private String studentName;
    private String studentPhone;
    private Long landlordId;
    private String landlordName;
    private String landlordPhone;
    private LocalDateTime scheduledAt;
    private BookingStatus status;
    private String roomStatus;
    private String note;
    private LocalDateTime createdAt;
}
