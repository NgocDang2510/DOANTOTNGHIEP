package com.saf.core.controllers;

import com.saf.core.dtos.ApiResponse;
import com.saf.core.entities.enums.BookingStatus;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.RoomRepository;
import com.saf.core.security.AuthorizationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
    private final RoomRepository roomRepository;
    private final AuthorizationUtil authorizationUtil;

    @GetMapping("/landlord")
    public ResponseEntity<ApiResponse<?>> getLandlordStats() {
        try {
            var user = authorizationUtil.getCurrentUser();
            Long landlordId = user.getId();

            long totalRooms = roomRepository.countByLandlordId(landlordId);
            long availableRooms = roomRepository.findByLandlordId(landlordId, PageRequest.of(0, Integer.MAX_VALUE))
                    .stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).count();

            long totalBookings = bookingRepository.countByLandlordId(landlordId);
            long pendingBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.PENDING);
            long confirmedBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.CONFIRMED);
            long completedBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.COMPLETED);
            long cancelledBookings = bookingRepository.countByLandlordIdAndStatus(landlordId, BookingStatus.CANCELLED);

            // Bookings by month for last 12 months
            LocalDateTime startDate = LocalDateTime.now().minusMonths(11).withDayOfMonth(1)
                    .withHour(0).withMinute(0).withSecond(0);
            List<Object[]> rawMonthly = bookingRepository.countByMonthForLandlord(landlordId, startDate);

            Map<String, Long> monthlyMap = new LinkedHashMap<>();
            String[] viMonths = {"T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"};
            LocalDateTime cursor = startDate;
            for (int i = 0; i < 12; i++) {
                int m = cursor.getMonthValue();
                int y = cursor.getYear();
                monthlyMap.put(viMonths[m - 1] + "/" + (y % 100), 0L);
                cursor = cursor.plusMonths(1);
            }
            for (Object[] row : rawMonthly) {
                int m = ((Number) row[0]).intValue();
                int y = ((Number) row[1]).intValue();
                long count = ((Number) row[2]).longValue();
                String key = viMonths[m - 1] + "/" + (y % 100);
                monthlyMap.put(key, count);
            }
            List<Map<String, Object>> bookingsByMonth = new ArrayList<>();
            monthlyMap.forEach((month, count) -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("month", month);
                entry.put("count", count);
                bookingsByMonth.add(entry);
            });

            // Top 5 rooms by viewCount
            var topRoomsRaw = roomRepository.findTopByLandlordOrderByViewCount(landlordId, PageRequest.of(0, 5));
            List<Map<String, Object>> topRooms = topRoomsRaw.stream().map(r -> {
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
            result.put("totalBookings", totalBookings);
            result.put("pendingBookings", pendingBookings);
            result.put("confirmedBookings", confirmedBookings);
            result.put("completedBookings", completedBookings);
            result.put("cancelledBookings", cancelledBookings);
            result.put("bookingsByMonth", bookingsByMonth);
            result.put("topRooms", topRooms);

            return ResponseEntity.ok(ApiResponse.success("Thống kê thành công", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
