package com.saf.booking.clients;

import com.saf.booking.dtos.ApiResponse;
import com.saf.booking.dtos.UserInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service", url = "${services.auth-service.url}")
public interface AuthServiceClient {

    @GetMapping("/api/internal/users/{id}")
    ApiResponse<UserInfo> getUserById(@PathVariable("id") Long id);

    @GetMapping("/api/internal/users/by-phone")
    ApiResponse<UserInfo> getUserByPhone(@RequestParam("phone") String phone);

    @GetMapping("/api/internal/users/stats")
    ApiResponse<Object> getUserStats();
}
