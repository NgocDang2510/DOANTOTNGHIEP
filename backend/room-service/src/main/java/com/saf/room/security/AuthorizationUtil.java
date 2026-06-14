package com.saf.room.security;

import com.saf.room.clients.AuthServiceClient;
import com.saf.room.dtos.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthorizationUtil {

    private final AuthServiceClient authServiceClient;

    public UserInfo getCurrentUser() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return authServiceClient.getUserByPhone(phone).getData();
    }

    public boolean isAuthenticated() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
        } catch (Exception e) {
            return false;
        }
    }
}
