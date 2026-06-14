package com.saf.booking.controllers;

import com.saf.booking.dtos.ApiResponse;
import com.saf.booking.dtos.BookingInfo;
import com.saf.booking.entities.enums.BookingStatus;
import com.saf.booking.services.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internal/bookings")
@RequiredArgsConstructor
public class InternalBookingController {

    private final BookingService bookingService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingInfo>> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", bookingService.getBookingInfo(id)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        bookingService.updateStatusInternal(id, BookingStatus.valueOf(status));
        return ResponseEntity.ok(ApiResponse.success("OK"));
    }

    @GetMapping("/booked-room-ids")
    public ResponseEntity<ApiResponse<List<Long>>> getBookedRoomIds(
            @RequestParam Long studentId,
            @RequestParam(required = false) List<BookingStatus> statuses) {
        if (statuses == null) {
            statuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED);
        }
        return ResponseEntity.ok(ApiResponse.success("OK",
                bookingService.getBookedRoomIdsByStudent(studentId, statuses)));
    }

    @GetMapping("/has-completed")
    public ResponseEntity<ApiResponse<Boolean>> hasCompletedBooking(
            @RequestParam Long studentId,
            @RequestParam Long roomId) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                bookingService.hasCompletedBooking(studentId, roomId)));
    }
}
