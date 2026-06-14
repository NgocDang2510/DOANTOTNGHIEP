package com.saf.core.dtos;

import com.saf.core.entities.enums.AmenityType;
import com.saf.core.entities.enums.RoomType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RoomRequest {
    private String title;
    private String description;
    private BigDecimal price;
    private String address;
    private String district;
    private String city;
    private Double latitude;
    private Double longitude;
    private BigDecimal area;
    private RoomType roomType;
    private List<String> imageUrls;
    private List<AmenityType> amenities;
}
