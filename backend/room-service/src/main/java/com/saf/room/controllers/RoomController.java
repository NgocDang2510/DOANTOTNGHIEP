package com.saf.room.controllers;

import com.saf.room.clients.BookingServiceClient;
import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.PageResponse;
import com.saf.room.dtos.RoomRequest;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.dtos.UserInfo;
import com.saf.room.entities.Room;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final AuthorizationUtil authorizationUtil;
    private final RoomRepository roomRepository;
    private final BookingServiceClient bookingServiceClient;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> searchRooms(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<RoomResponse> result = roomService.searchRooms(city, district, minPrice, maxPrice, roomType, keyword, pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm phòng thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tìm kiếm: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getRoom(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng thành công", roomService.viewRoom(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<?>> getMyRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            var user = authorizationUtil.getCurrentUser();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng thành công",
                    PageResponse.from(roomService.getLandlordRooms(user.getId(), pageable))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createRoom(@RequestBody RoomRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đăng phòng thành công", roomService.createRoom(user, request)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateRoom(@PathVariable Long id, @RequestBody RoomRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng thành công", roomService.updateRoom(user, id, request)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteRoom(@PathVariable Long id) {
        try {
            var user = authorizationUtil.getCurrentUser();
            roomService.deleteRoom(user, id);
            return ResponseEntity.ok(ApiResponse.success("Xóa phòng thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<?>> getRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "8") int limit) {
        try {
            List<Long> excludedIds = List.of(-1L);
            String city = null;
            RoomType roomType = null;
            BigDecimal minPrice = null, maxPrice = null;

            if (authorizationUtil.isAuthenticated()) {
                try {
                    UserInfo user = authorizationUtil.getCurrentUser();
                    List<Long> booked = bookingServiceClient.getBookedRoomIds(user.getId()).getData();
                    if (!booked.isEmpty()) {
                        excludedIds = booked;
                        List<Room> bookedRooms = roomRepository.findAllById(booked);
                        if (!bookedRooms.isEmpty()) {
                            Room topRoom = bookedRooms.get(0);
                            city = topRoom.getCity();
                            roomType = topRoom.getRoomType();
                            BigDecimal total = bookedRooms.stream().map(Room::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
                            BigDecimal avg = total.divide(BigDecimal.valueOf(bookedRooms.size()));
                            minPrice = avg.multiply(BigDecimal.valueOf(0.5));
                            maxPrice = avg.multiply(BigDecimal.valueOf(1.8));
                        }
                    }
                } catch (Exception ignored) {}
            }

            List<RoomResponse> rooms = roomRepository.findRecommendations(excludedIds, city, roomType, minPrice, maxPrice, PageRequest.of(0, limit))
                    .stream().map(roomService::toResponse).toList();

            if (rooms.size() < limit) {
                List<Long> finalExcluded = new ArrayList<>(excludedIds);
                rooms.forEach(r -> finalExcluded.add(r.getId()));
                int need = limit - rooms.size();
                List<RoomResponse> popular = roomRepository.findRecommendations(finalExcluded, null, null, null, null, PageRequest.of(0, need))
                        .stream().map(roomService::toResponse).toList();
                List<RoomResponse> combined = new ArrayList<>(rooms);
                combined.addAll(popular);
                rooms = combined;
            }

            return ResponseEntity.ok(ApiResponse.success("Gợi ý phòng thành công", rooms));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<?>> getNearbyRooms(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<RoomResponse> rooms = roomRepository.findNearby(lat, lng, radius, PageRequest.of(0, limit))
                    .stream().map(roomService::toResponse).toList();
            return ResponseEntity.ok(ApiResponse.success("Tìm phòng gần bạn thành công", rooms));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> changeStatus(@PathVariable Long id, @RequestParam RoomStatus status) {
        try {
            var user = authorizationUtil.getCurrentUser();
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái phòng thành công", roomService.changeStatus(user, id, status)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
