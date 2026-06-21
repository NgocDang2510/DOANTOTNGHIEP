package com.saf.auth.services;

import com.saf.auth.dtos.*;
import com.saf.auth.entities.User;
import com.saf.auth.repositories.UserRepository;
import com.saf.auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public User register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã tồn tại!");
        }
        User.Role userRole = "LANDLORD".equalsIgnoreCase(request.getRole()) ? User.Role.LANDLORD : User.Role.STUDENT;
        User user = User.builder()
                .phone(request.getPhone())
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .role(userRole)
                .isLocked(false)
                .build();
        return userRepository.save(user);
    }

    public User login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
        if (Boolean.TRUE.equals(user.getIsLocked())) throw new RuntimeException("Tài khoản đã bị khóa bởi quản trị viên!");
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) throw new RuntimeException("Mật khẩu không chính xác!");
        return user;
    }

    public User getUserByPhone(String phone) {
        return userRepository.findByPhone(phone).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
    }

    @Transactional
    public UserResponse updateProfile(User user, UpdateUserProfileRequest request) {
        user.setFullName(request.getFullName());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getCoverUrl() != null) user.setCoverUrl(request.getCoverUrl());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthday() != null) user.setBirthday(request.getBirthday());
        if (request.getEmail() != null) user.setEmail(request.getEmail().trim().isEmpty() ? null : request.getEmail().trim());
        if (request.getBankName() != null) user.setBankName(request.getBankName().trim().isEmpty() ? null : request.getBankName().trim());
        if (request.getBankAccountNumber() != null) user.setBankAccountNumber(request.getBankAccountNumber().trim().isEmpty() ? null : request.getBankAccountNumber().trim());
        if (request.getBankAccountHolder() != null) user.setBankAccountHolder(request.getBankAccountHolder().trim().isEmpty() ? null : request.getBankAccountHolder().trim());
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void updatePassword(User user, UpdatePasswordRequest request) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash()))
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Số điện thoại không tồn tại!"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && (user.getEmail() == null || user.getEmail().trim().isEmpty())) {
            user.setEmail(request.getEmail().trim());
        }
        userRepository.save(user);
    }

    public UserResponse getUserProfile(User user) {
        return toUserResponse(user);
    }

    public Page<UserResponse> searchUsers(String search, Pageable pageable) {
        return userRepository.searchUsers(search, pageable).map(this::toUserResponse);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserResponse);
    }

    @Transactional
    public UserResponse lockUser(Long userId, boolean lock) {
        User user = getUserById(userId);
        if (user.getRole() == User.Role.ADMIN) throw new RuntimeException("Không thể khóa tài khoản admin!");
        user.setIsLocked(lock);
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        if (user.getRole() == User.Role.ADMIN) throw new RuntimeException("Không thể xóa tài khoản admin!");
        userRepository.delete(user);
    }

    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        LocalDateTime today = LocalDate.now().atStartOfDay();
        stats.put("newUsersToday", userRepository.countByCreatedAtIsNotNullAndCreatedAtAfter(today));
        LocalDateTime week = LocalDate.now().minusDays(7).atStartOfDay();
        stats.put("newUsersThisWeek", userRepository.countByCreatedAtIsNotNullAndCreatedAtAfter(week));
        LocalDateTime month = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        stats.put("newUsersThisMonth", userRepository.countByCreatedAtIsNotNullAndCreatedAtAfter(month));
        List<Map<String, Object>> chartData = new ArrayList<>();
        try {
            LocalDateTime since7Days = LocalDate.now().minusDays(6).atStartOfDay();
            for (Object[] row : userRepository.countNewUsersPerDay(since7Days)) {
                chartData.add(Map.of("date", row[0].toString(), "count", ((Number) row[1]).longValue()));
            }
        } catch (Exception ignored) {}
        stats.put("userGrowthChart", chartData);
        return stats;
    }

    @Transactional
    public void ensureAdminAccount() {
        Optional<User> existing = userRepository.findByPhone("9999999999");
        if (existing.isEmpty()) {
            userRepository.save(User.builder()
                    .phone("9999999999").fullName("Admin")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(User.Role.ADMIN).isLocked(false).build());
        } else {
            User u = existing.get();
            if (u.getRole() != User.Role.ADMIN) { u.setRole(User.Role.ADMIN); userRepository.save(u); }
        }
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId()).phone(user.getPhone()).email(user.getEmail())
                .fullName(user.getFullName()).avatarUrl(user.getAvatarUrl()).coverUrl(user.getCoverUrl())
                .gender(user.getGender()).birthday(user.getBirthday())
                .role(user.getRole().toString()).isLocked(user.getIsLocked()).createdAt(user.getCreatedAt())
                .bankName(user.getBankName()).bankAccountNumber(user.getBankAccountNumber())
                .bankAccountHolder(user.getBankAccountHolder())
                .build();
    }
}
