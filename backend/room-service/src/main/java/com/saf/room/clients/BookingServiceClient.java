package com.saf.room.clients;

import com.saf.room.dtos.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "booking-service", url = "${services.booking-service.url}")
public interface BookingServiceClient {

    @GetMapping("/api/internal/bookings/booked-room-ids")
    ApiResponse<List<Long>> getBookedRoomIds(@RequestParam Long studentId);

    @GetMapping("/api/internal/bookings/has-completed")
    ApiResponse<Boolean> hasCompletedBooking(@RequestParam Long studentId, @RequestParam Long roomId);
}
