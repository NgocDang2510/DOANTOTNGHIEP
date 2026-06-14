package com.saf.core.dtos;

import com.saf.core.entities.enums.AmenityType;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.entities.enums.RoomType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RoomResponse {
    private Long id;
    private Long landlordId;
    private String landlordName;
    private String landlordPhone;
    private String landlordAvatarUrl;
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
    private RoomStatus status;
    private List<String> imageUrls;
    private List<AmenityType> amenities;
    private Double averageRating;
    private Long reviewCount;
    private Long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
