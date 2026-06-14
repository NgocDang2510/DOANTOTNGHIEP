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

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> result = bookingService.getBookingsByStudent(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("OK", PageResponse.from(result)));
    }

    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getLandlordBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingResponse> result = bookingService.getBookingsByLandlord(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("OK", PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(@PathVariable Long id) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.getBookingById(id, user);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(@PathVariable Long id) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.updateStatus(id, BookingStatus.CONFIRMED, user);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận lịch hẹn", response));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long id) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.updateStatus(id, BookingStatus.CANCELLED, user);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lịch hẹn", response));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<BookingResponse>> completeBooking(@PathVariable Long id) {
        UserInfo user = authorizationUtil.getCurrentUser();
        BookingResponse response = bookingService.updateStatus(id, BookingStatus.COMPLETED, user);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành lịch hẹn", response));
    }
}
