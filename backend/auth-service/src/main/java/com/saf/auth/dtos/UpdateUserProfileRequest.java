package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserProfileRequest {
    @NotBlank private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String gender;
    private LocalDate birthday;
    private String email;
}
