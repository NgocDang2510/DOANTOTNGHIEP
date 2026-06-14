package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.entities.enums.RoomStatus;
import com.saf.room.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/rooms")
@RequiredArgsConstructor
public class InternalRoomController {

    private final RoomService roomService;

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getRoomById(@PathVariable Long id) {
        return ApiResponse.success("OK", roomService.getRoomDetail(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateRoomStatus(@PathVariable Long id, @RequestParam String status) {
        roomService.updateRoomStatusInternal(id, RoomStatus.valueOf(status));
        return ApiResponse.success("OK");
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getRoomStats() {
        return ApiResponse.success("OK", roomService.getRoomStats());
    }
}
