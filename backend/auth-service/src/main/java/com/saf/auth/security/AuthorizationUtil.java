package com.saf.auth.security;

import com.saf.auth.entities.User;
import com.saf.auth.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthorizationUtil {

    private final UserService userService;

    public User getCurrentUser() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByPhone(phone);
    }

    public boolean isAdmin() {
        try {
            return getCurrentUser().getRole() == User.Role.ADMIN;
        } catch (Exception e) {
            return false;
        }
    }
}
