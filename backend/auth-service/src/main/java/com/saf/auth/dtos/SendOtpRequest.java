package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequest {
    @NotBlank private String phone;
    private String email;
}
