package com.saf.booking.controllers;

import com.saf.booking.clients.RoomServiceClient;
import com.saf.booking.dtos.ApiResponse;
import com.saf.booking.entities.enums.BookingStatus;
import com.saf.booking.repositories.BookingRepository;
import com.saf.booking.security.AuthorizationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final BookingRepository bookingRepository;
    private final RoomServiceClient roomServiceClient;
    private final AuthorizationUtil authorizationUtil;

    @SuppressWarnings("unchecked")
    @GetMapping("/landlord")
    public ResponseEntity<ApiResponse<?>> getLandlordStats() {
        try {
            var user = authorizationUtil.getCurrentUser();
            Long landlordId = user.getId();

            // Room stats from room-service
            Map<String, Object> roomStats = (Map<String, Object>) roomServiceClient.getLandlordRoomStats(landlordId).getData();
            long totalRooms = roomStats != null ? ((Number) roomStats.get("totalRooms")).longValue() : 0;
            long availableRooms = roomStats != null ? ((Number) roomStats.get("availableRooms")).longValue() : 0;
            List<?> topRooms = roomStats != null ? (List<?>) roomStats.get("topRooms") : List.of();

            // Booking stats
            long totalBookings = bookingRepository.countByLandlordId(landlordId);
            long pendingBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.PENDING);
            long confirmedBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.CONFIRMED);
            long completedBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.COMPLETED);
            long cancelledBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.CANCELLED);

            // Bookings by month (last 12 months)
            LocalDateTime since = LocalDateTime.now().minusMonths(11).withDayOfMonth(1)
                    .withHour(0).withMinute(0).withSecond(0);
            List<Object[]> rawMonthly = bookingRepository.countByMonthForLandlord(landlordId, since);

            String[] viMonths = {"T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"};
            Map<String, Long> monthlyMap = new LinkedHashMap<>();
            LocalDateTime cursor = since;
            for (int i = 0; i < 12; i++) {
                monthlyMap.put(viMonths[cursor.getMonthValue() - 1] + "/" + (cursor.getYear() % 100), 0L);
                cursor = cursor.plusMonths(1);
            }
            for (Object[] row : rawMonthly) {
                int m = ((Number) row[0]).intValue();
                int y = ((Number) row[1]).intValue();
                long count = ((Number) row[2]).longValue();
                monthlyMap.put(viMonths[m - 1] + "/" + (y % 100), count);
            }
            List<Map<String, Object>> bookingsByMonth = new ArrayList<>();
            monthlyMap.forEach((month, count) -> bookingsByMonth.add(Map.of("month", month, "count", count)));

            Map<String, Object> result = new HashMap<>();
            result.put("totalRooms", totalRooms);
            result.put("availableRooms", availableRooms);
            result.put("topRooms", topRooms);
            result.put("totalBookings", totalBookings);
            result.put("pendingBookings", pendingBookings);
            result.put("confirmedBookings", confirmedBookings);
            result.put("completedBookings", completedBookings);
            result.put("cancelledBookings", cancelledBookings);
            result.put("bookingsByMonth", bookingsByMonth);

            return ResponseEntity.ok(ApiResponse.success("Thống kê thành công", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
