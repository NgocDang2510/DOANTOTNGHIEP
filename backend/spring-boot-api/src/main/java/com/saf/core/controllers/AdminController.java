package com.saf.core.controllers;

import com.saf.core.dtos.*;
import com.saf.core.entities.enums.BookingStatus;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.entities.enums.RoomType;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.RoomRepository;
import com.saf.core.security.AuthorizationUtil;
import com.saf.core.services.RoomService;
import com.saf.core.services.UserService;
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
public class AdminController {

    private final UserService userService;
    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final AuthorizationUtil authorizationUtil;

    /**
     * Middleware-like check: ensure current user is ADMIN
     */
    private void requireAdmin() {
        if (!authorizationUtil.isAdmin()) {
            throw new SecurityException("Bạn không có quyền truy cập chức năng quản trị");
        }
    }

    /**
     * GET /api/admin/users — List all users with pagination & search
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> getAllUsers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "id") String sort,
            @RequestParam(name = "direction", defaultValue = "DESC") Sort.Direction direction) {
        try {
            requireAdmin();

            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));

            Page<UserResponse> result;
            if (search != null && !search.trim().isEmpty()) {
                result = userService.searchUsers(search, pageable);
            } else {
                result = userService.getAllUsers(pageable);
            }

            PageResponse<UserResponse> pageResponse = PageResponse.from(result);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách user thành công", pageResponse));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/stats — Get admin statistics (users, rooms, bookings)
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<?>> getAdminStats() {
        try {
            requireAdmin();
            Map<String, Object> stats = userService.getAdminStats();

            // Room stats
            stats.put("totalRooms", roomRepository.count());
            stats.put("availableRooms", roomRepository.countByStatus(RoomStatus.AVAILABLE));
            stats.put("rentedRooms", roomRepository.countByStatus(RoomStatus.RENTED));
            stats.put("hiddenRooms", roomRepository.countByStatus(RoomStatus.HIDDEN));

            // Booking stats
            stats.put("totalBookings", bookingRepository.count());
            stats.put("pendingBookings", bookingRepository.countByStatus(BookingStatus.PENDING));
            stats.put("confirmedBookings", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
            stats.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));
            stats.put("cancelledBookings", bookingRepository.countByStatus(BookingStatus.CANCELLED));

            return ResponseEntity.ok(ApiResponse.success("Lấy thống kê thành công", stats));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/rooms — List all rooms with search/filter
     */
    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<?>> getAllRooms(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            requireAdmin();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<RoomResponse> result = roomService.searchRooms(city, district, null, null, roomType, keyword, pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng thành công", PageResponse.from(result)));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/admin/rooms/{roomId} — Force delete any room
     */
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<?>> deleteRoom(@PathVariable Long roomId) {
        try {
            requireAdmin();
            var admin = authorizationUtil.getCurrentUser();
            roomService.deleteRoom(admin, roomId);
            return ResponseEntity.ok(ApiResponse.success("Xóa phòng thành công", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/users/{userId}/lock — Lock or unlock user account
     */
    @PutMapping("/users/{userId}/lock")
    public ResponseEntity<ApiResponse<?>> lockUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body) {
        try {
            requireAdmin();
            boolean lock = body.getOrDefault("locked", true);
            UserResponse updated = userService.lockUser(userId, lock);
            String msg = lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản";
            return ResponseEntity.ok(ApiResponse.success(msg, updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/admin/users/{userId} — Delete user account
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<?>> deleteUser(@PathVariable Long userId) {
        try {
            requireAdmin();
            userService.deleteUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản thành công", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}

