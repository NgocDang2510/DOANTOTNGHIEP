package com.saf.auth.dtos;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
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
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
}
