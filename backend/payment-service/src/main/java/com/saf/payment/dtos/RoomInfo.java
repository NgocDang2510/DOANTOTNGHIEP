package com.saf.payment.dtos;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomInfo {
    private Long id;
    private Long landlordId;
    private String title;
    private String address;
    private BigDecimal price;
    private String status;
}
