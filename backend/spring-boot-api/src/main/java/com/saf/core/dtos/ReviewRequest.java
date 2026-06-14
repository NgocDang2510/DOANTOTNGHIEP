package com.saf.core.dtos;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long roomId;
    private Integer rating; // 1-5
    private String comment;
}
