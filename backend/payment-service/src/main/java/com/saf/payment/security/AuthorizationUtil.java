package com.saf.payment.security;

import com.saf.payment.clients.AuthServiceClient;
import com.saf.payment.dtos.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthorizationUtil {

    private final AuthServiceClient authServiceClient;

    public UserInfo getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Not authenticated");
        }
        return authServiceClient.getUserByPhone((String) auth.getPrincipal()).getData();
    }
}
