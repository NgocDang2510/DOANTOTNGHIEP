package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank private String phone;
    @NotBlank private String otp;
}
