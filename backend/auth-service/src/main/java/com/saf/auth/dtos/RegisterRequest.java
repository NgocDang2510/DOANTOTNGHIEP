package com.saf.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String phone;
    @NotBlank private String fullName;
    @NotBlank private String password;
    private String email;
    private String role;
}
