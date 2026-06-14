package com.saf.auth.controllers;

import com.saf.auth.dtos.*;
import com.saf.auth.security.AuthorizationUtil;
import com.saf.auth.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthorizationUtil authorizationUtil;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Lấy hồ sơ thành công", userService.getUserProfile(authorizationUtil.getCurrentUser())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lấy hồ sơ thất bại: " + e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(@Valid @RequestBody UpdateUserProfileRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", userService.updateProfile(authorizationUtil.getCurrentUser(), request)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cập nhật hồ sơ thất bại: " + e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<?>> updatePassword(@Valid @RequestBody UpdatePasswordRequest request) {
        try {
            userService.updatePassword(authorizationUtil.getCurrentUser(), request);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật mật khẩu thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cập nhật mật khẩu thất bại: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<?>> getUserById(@PathVariable String userId) {
        try {
            if ("system".equalsIgnoreCase(userId)) {
                UserResponse sys = new UserResponse(); sys.setId(0L); sys.setFullName("Hệ thống");
                return ResponseEntity.ok(ApiResponse.success("OK", sys));
            }
            if ("ai_food_bot".equalsIgnoreCase(userId)) {
                UserResponse ai = new UserResponse(); ai.setId(0L); ai.setFullName("Bếp AI");
                return ResponseEntity.ok(ApiResponse.success("OK", ai));
            }
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin user thành công",
                    userService.getUserProfile(userService.getUserById(Long.parseLong(userId)))));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ID người dùng không hợp lệ"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lấy thông tin user thất bại: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchUsers(
            @RequestParam String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName") String sort,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
        try {
            if (search == null || search.trim().isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.error("Tìm kiếm không được để trống"));
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
            Page<UserResponse> result = userService.searchUsers(search, pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tìm kiếm thất bại: " + e.getMessage()));
        }
    }
}
