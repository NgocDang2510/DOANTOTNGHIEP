package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.entities.enums.RoomStatus;
import com.saf.room.repositories.RoomRepository;
import com.saf.room.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/rooms")
@RequiredArgsConstructor
public class InternalRoomController {

    private final RoomService roomService;
    private final RoomRepository roomRepository;

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getRoomById(@PathVariable Long id) {
        return ApiResponse.success("OK", roomService.getRoomDetail(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateRoomStatus(@PathVariable Long id, @RequestParam String status) {
        roomService.updateRoomStatusInternal(id, RoomStatus.valueOf(status));
        return ApiResponse.success("OK");
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getRoomStats() {
        return ApiResponse.success("OK", roomService.getRoomStats());
    }

    @GetMapping("/landlord-stats")
    public ApiResponse<Map<String, Object>> getLandlordRoomStats(@RequestParam Long landlordId) {
        long totalRooms = roomRepository.countByLandlordId(landlordId);
        long availableRooms = roomRepository.countByLandlordIdAndStatus(landlordId, RoomStatus.AVAILABLE);
        List<Map<String, Object>> topRooms = roomRepository
                .findTopByLandlordOrderByViewCount(landlordId, PageRequest.of(0, 5))
                .stream().map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("title", r.getTitle());
                    m.put("viewCount", r.getViewCount() != null ? r.getViewCount() : 0L);
                    m.put("status", r.getStatus().name());
                    m.put("price", r.getPrice());
                    return m;
                }).toList();
        Map<String, Object> result = new HashMap<>();
        result.put("totalRooms", totalRooms);
        result.put("availableRooms", availableRooms);
        result.put("topRooms", topRooms);
        return ApiResponse.success("OK", result);
    }
}
