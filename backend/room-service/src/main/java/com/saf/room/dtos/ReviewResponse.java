package com.saf.room.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long roomId;
    private Long studentId;
    private String studentName;
    private String studentAvatarUrl;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
