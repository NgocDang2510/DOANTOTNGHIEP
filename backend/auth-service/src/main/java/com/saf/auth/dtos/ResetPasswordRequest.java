package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank private String phone;
    @NotBlank private String otp;
    @NotBlank private String newPassword;
    private String email;
}
