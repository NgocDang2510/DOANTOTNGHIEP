package com.saf.booking.controllers;

import com.saf.booking.dtos.*;
import com.saf.booking.entities.enums.BookingStatus;
import com.saf.booking.security.AuthorizationUtil;
import com.saf.booking.services.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthorizationUtil authorizationUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(@RequestBody BookingRequest request) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.createBooking(user, request);
        return ResponseEntity.ok(ApiResponse.success("Đặt phòng thành công", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable Long id) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.getBookingById(id, user);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> result = bookingService.getBookingsByStudent(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("OK", PageResponse.from(result)));
    }

    @GetMapping("/landlord-bookings")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getLandlordBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> result = bookingService.getBookingsByLandlord(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("OK", PageResponse.from(result)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.updateStatus(id, status, user);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", response));
    }
}
