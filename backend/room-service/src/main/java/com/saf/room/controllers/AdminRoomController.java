package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.PageResponse;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.entities.enums.RoomStatus;
import com.saf.room.entities.enums.RoomType;
import com.saf.room.repositories.RoomRepository;
import com.saf.room.security.AuthorizationUtil;
import com.saf.room.services.RoomService;
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
public class AdminRoomController {

    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final AuthorizationUtil authorizationUtil;

    private void requireAdmin() {
        var user = authorizationUtil.getCurrentUser();
        if (!"ADMIN".equals(user.getRole())) throw new SecurityException("Bạn không có quyền truy cập chức năng quản trị");
    }

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
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/room-stats")
    public ResponseEntity<ApiResponse<?>> getRoomStats() {
        try {
            requireAdmin();
            Map<String, Object> stats = Map.of(
                "totalRooms", roomRepository.count(),
                "availableRooms", roomRepository.countByStatus(RoomStatus.AVAILABLE),
                "rentedRooms", roomRepository.countByStatus(RoomStatus.RENTED),
                "hiddenRooms", roomRepository.countByStatus(RoomStatus.HIDDEN)
            );
            return ResponseEntity.ok(ApiResponse.success("OK", stats));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<?>> deleteRoom(@PathVariable Long roomId) {
        try {
            requireAdmin();
            var admin = authorizationUtil.getCurrentUser();
            roomService.deleteRoom(admin, roomId);
            return ResponseEntity.ok(ApiResponse.success("Xóa phòng thành công", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}
