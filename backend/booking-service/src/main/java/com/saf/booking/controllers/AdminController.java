package com.saf.booking.controllers;

import com.saf.booking.clients.AuthServiceClient;
import com.saf.booking.clients.PaymentServiceClient;
import com.saf.booking.clients.RoomServiceClient;
import com.saf.booking.dtos.ApiResponse;
import com.saf.booking.dtos.UserInfo;
import com.saf.booking.entities.enums.BookingStatus;
import com.saf.booking.repositories.BookingRepository;
import com.saf.booking.security.AuthorizationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BookingRepository bookingRepository;
    private final AuthServiceClient authServiceClient;
    private final RoomServiceClient roomServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final AuthorizationUtil authorizationUtil;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        UserInfo admin = authorizationUtil.getCurrentUser();
        if (!"ADMIN".equals(admin.getRole())) throw new RuntimeException("Không có quyền truy cập");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", bookingRepository.count());
        stats.put("pendingBookings", bookingRepository.countByStatus(BookingStatus.PENDING));
        stats.put("confirmedBookings", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));

        try { stats.put("userStats", authServiceClient.getUserStats().getData()); }
        catch (Exception e) { stats.put("userStats", null); }

        try { stats.put("roomStats", roomServiceClient.getRoomStats().getData()); }
        catch (Exception e) { stats.put("roomStats", null); }

        try { stats.put("paymentStats", paymentServiceClient.getPaymentStats().getData()); }
        catch (Exception e) { stats.put("paymentStats", null); }

        return ResponseEntity.ok(ApiResponse.success("OK", stats));
    }
}
