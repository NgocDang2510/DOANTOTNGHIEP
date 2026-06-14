package com.saf.room.dtos;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserInfo {
    private Long id;
    private String phone;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String gender;
    private LocalDate birthday;
    private String role;
    private Boolean isLocked;
    private LocalDateTime createdAt;
}
