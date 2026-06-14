package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdatePasswordRequest {
    @NotBlank private String oldPassword;
    @NotBlank private String newPassword;
}
