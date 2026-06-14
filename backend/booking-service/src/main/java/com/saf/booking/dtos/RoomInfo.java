package com.saf.booking.dtos;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RoomInfo {
    private Long id;
    private Long landlordId;
    private String landlordName;
    private String landlordPhone;
    private String title;
    private String address;
    private BigDecimal price;
    private String status;
    private List<String> imageUrls;
}
