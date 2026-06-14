package com.saf.notification.dtos;

import lombok.Data;

@Data
public class UserInfo {
    private Long id;
    private String phone;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String role;
}
