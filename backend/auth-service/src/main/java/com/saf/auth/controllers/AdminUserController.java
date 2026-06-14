package com.saf.auth.controllers;

import com.saf.auth.dtos.*;
import com.saf.auth.security.AuthorizationUtil;
import com.saf.auth.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final AuthorizationUtil authorizationUtil;

    private void requireAdmin() {
        if (!authorizationUtil.isAdmin()) throw new SecurityException("Bạn không có quyền truy cập chức năng quản trị");
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        try {
            requireAdmin();
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
            Page<UserResponse> result = (search != null && !search.trim().isEmpty())
                    ? userService.searchUsers(search, pageable) : userService.getAllUsers(pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách user thành công", PageResponse.from(result)));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/user-stats")
    public ResponseEntity<ApiResponse<?>> getUserStats() {
        try {
            requireAdmin();
            return ResponseEntity.ok(ApiResponse.success("OK", userService.getUserStats()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/lock")
    public ResponseEntity<ApiResponse<?>> lockUser(@PathVariable Long userId, @RequestBody Map<String, Boolean> body) {
        try {
            requireAdmin();
            boolean lock = body.getOrDefault("locked", true);
            UserResponse updated = userService.lockUser(userId, lock);
            return ResponseEntity.ok(ApiResponse.success(lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<?>> deleteUser(@PathVariable Long userId) {
        try {
            requireAdmin();
            userService.deleteUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản thành công", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}
