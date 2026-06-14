package com.saf.auth.controllers;

import com.saf.auth.dtos.ApiResponse;
import com.saf.auth.dtos.UserResponse;
import com.saf.auth.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.success("OK", userService.toUserResponse(userService.getUserById(id)));
    }

    @GetMapping("/by-phone")
    public ApiResponse<UserResponse> getUserByPhone(@RequestParam String phone) {
        return ApiResponse.success("OK", userService.toUserResponse(userService.getUserByPhone(phone)));
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getUserStats() {
        return ApiResponse.success("OK", userService.getUserStats());
    }
}
