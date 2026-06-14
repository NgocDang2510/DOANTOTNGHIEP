package com.saf.core.controllers;

import com.saf.core.dtos.ApiResponse;
import com.saf.core.dtos.PageResponse;
import com.saf.core.dtos.RoomRequest;
import com.saf.core.dtos.RoomResponse;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.entities.enums.RoomType;
import com.saf.core.entities.enums.PaymentStatus;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.PaymentRepository;
import com.saf.core.repositories.RoomRepository;
import com.saf.core.security.AuthorizationUtil;
import com.saf.core.services.RoomService;
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
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final AuthorizationUtil authorizationUtil;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

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
            RoomResponse room = roomService.viewRoom(id);
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng thành công", room));
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
            Page<RoomResponse> result = roomService.getLandlordRooms(user.getId(), pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createRoom(@RequestBody RoomRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            RoomResponse room = roomService.createRoom(user, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đăng phòng thành công", room));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateRoom(@PathVariable Long id,
                                                     @RequestBody RoomRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            RoomResponse room = roomService.updateRoom(user, id, request);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng thành công", room));
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
            List<Long> excludedIds = List.of(-1L); // placeholder so NOT IN never empty
            String city = null;
            RoomType roomType = null;
            BigDecimal minPrice = null, maxPrice = null;

            if (authentication != null && authentication.isAuthenticated()) {
                try {
                    var user = authorizationUtil.getCurrentUser();
                    List<Long> booked = bookingRepository.findBookedRoomIdsByStudent(user.getId());
                    if (!booked.isEmpty()) excludedIds = booked;

                    List<Object[]> prefs = bookingRepository.findPreferencesByStudent(user.getId());
                    if (!prefs.isEmpty()) {
                        Object[] top = prefs.get(0);
                        city = (String) top[0];
                        roomType = top[1] != null ? RoomType.valueOf(top[1].toString()) : null;
                        BigDecimal avgPrice = top[2] != null ? new BigDecimal(top[2].toString()) : null;
                        if (avgPrice != null) {
                            minPrice = avgPrice.multiply(BigDecimal.valueOf(0.5));
                            maxPrice = avgPrice.multiply(BigDecimal.valueOf(1.8));
                        }
                    }
                } catch (Exception ignored) {}
            }

            List<RoomResponse> rooms = roomRepository
                    .findRecommendations(excludedIds, city, roomType, minPrice, maxPrice, PageRequest.of(0, limit))
                    .stream().map(roomService::toResponse).toList();

            // Fallback: nếu chưa đủ kết quả thì lấy phòng phổ biến bổ sung
            if (rooms.size() < limit) {
                List<Long> finalExcluded = new java.util.ArrayList<>(excludedIds);
                rooms.forEach(r -> finalExcluded.add(r.getId()));
                int need = limit - rooms.size();
                List<RoomResponse> popular = roomRepository
                        .findRecommendations(finalExcluded, null, null, null, null, PageRequest.of(0, need))
                        .stream().map(roomService::toResponse).toList();
                List<RoomResponse> combined = new java.util.ArrayList<>(rooms);
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
            List<RoomResponse> rooms = roomRepository
                    .findNearby(lat, lng, radius, PageRequest.of(0, limit))
                    .stream().map(roomService::toResponse).toList();
            return ResponseEntity.ok(ApiResponse.success("Tìm phòng gần bạn thành công", rooms));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/tenant")
    public ResponseEntity<ApiResponse<?>> getRoomTenant(@PathVariable Long id) {
        try {
            authorizationUtil.getCurrentUser(); // phải đăng nhập
            var booking = paymentRepository.findTenantBookingByRoomAndStatus(id, PaymentStatus.SUCCESS);
            if (booking.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("Chưa có người thuê", null));
            }
            var student = booking.get().getStudent();
            var result = new java.util.HashMap<String, Object>();
            result.put("name", student.getFullName() != null ? student.getFullName() : student.getEmail());
            result.put("phone", student.getPhone() != null ? student.getPhone() : "");
            result.put("email", student.getEmail());
            result.put("depositAt", booking.get().getUpdatedAt());
            return ResponseEntity.ok(ApiResponse.success("OK", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> changeStatus(@PathVariable Long id,
                                                       @RequestParam RoomStatus status) {
        try {
            var user = authorizationUtil.getCurrentUser();
            RoomResponse room = roomService.changeStatus(user, id, status);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái phòng thành công", room));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
