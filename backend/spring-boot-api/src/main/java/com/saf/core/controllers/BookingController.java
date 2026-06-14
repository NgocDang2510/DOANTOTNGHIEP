package com.saf.core.controllers;

import com.saf.core.dtos.ApiResponse;
import com.saf.core.dtos.BookingRequest;
import com.saf.core.dtos.BookingResponse;
import com.saf.core.dtos.PageResponse;
import com.saf.core.security.AuthorizationUtil;
import com.saf.core.services.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthorizationUtil authorizationUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createBooking(@RequestBody BookingRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            BookingResponse booking = bookingService.createBooking(user, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đặt lịch xem phòng thành công", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<?>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            var user = authorizationUtil.getCurrentUser();
            Pageable pageable = PageRequest.of(page, size);
            Page<BookingResponse> result = bookingService.getStudentBookings(user.getId(), pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy lịch hẹn thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse<?>> getIncomingBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            var user = authorizationUtil.getCurrentUser();
            Pageable pageable = PageRequest.of(page, size);
            Page<BookingResponse> result = bookingService.getLandlordBookings(user.getId(), pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy lịch hẹn thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<?>> confirmBooking(@PathVariable Long id) {
        try {
            var user = authorizationUtil.getCurrentUser();
            BookingResponse booking = bookingService.confirmBooking(user, id);
            return ResponseEntity.ok(ApiResponse.success("Xác nhận lịch hẹn thành công", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<?>> cancelBooking(@PathVariable Long id) {
        try {
            var user = authorizationUtil.getCurrentUser();
            BookingResponse booking = bookingService.cancelBooking(user, id);
            return ResponseEntity.ok(ApiResponse.success("Hủy lịch hẹn thành công", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<?>> completeBooking(@PathVariable Long id) {
        try {
            var user = authorizationUtil.getCurrentUser();
            BookingResponse booking = bookingService.completeBooking(user, id);
            return ResponseEntity.ok(ApiResponse.success("Hoàn thành lịch hẹn thành công", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
