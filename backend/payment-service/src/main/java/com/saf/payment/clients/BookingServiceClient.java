package com.saf.payment.clients;

import com.saf.payment.dtos.ApiResponse;
import com.saf.payment.dtos.BookingInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "booking-service", url = "${services.booking-service.url}")
public interface BookingServiceClient {

    @GetMapping("/api/internal/bookings/{id}")
    ApiResponse<BookingInfo> getBookingById(@PathVariable("id") Long id);

    @PatchMapping("/api/internal/bookings/{id}/status")
    ApiResponse<Void> updateBookingStatus(@PathVariable("id") Long id, @RequestParam("status") String status);
}
