package com.saf.payment.clients;

import com.saf.payment.dtos.ApiResponse;
import com.saf.payment.dtos.RoomInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "room-service", url = "${services.room-service.url}")
public interface RoomServiceClient {

    @GetMapping("/api/internal/rooms/{id}")
    ApiResponse<RoomInfo> getRoomById(@PathVariable("id") Long id);

    @PatchMapping("/api/internal/rooms/{id}/status")
    ApiResponse<Void> updateRoomStatus(@PathVariable("id") Long id, @RequestParam("status") String status);
}
