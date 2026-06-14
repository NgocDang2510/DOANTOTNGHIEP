package com.saf.room.dtos;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long roomId;
    private Integer rating;
    private String comment;
}
