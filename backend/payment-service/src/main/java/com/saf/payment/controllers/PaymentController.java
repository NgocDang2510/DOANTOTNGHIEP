package com.saf.payment.controllers;

import com.saf.payment.dtos.ApiResponse;
import com.saf.payment.dtos.PaymentResponse;
import com.saf.payment.security.AuthorizationUtil;
import com.saf.payment.services.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthorizationUtil authorizationUtil;

    @PostMapping("/booking/{bookingId}/vnpay")
    public ResponseEntity<ApiResponse<String>> createVNPayUrl(
            @PathVariable Long bookingId,
            HttpServletRequest request) {
        var user = authorizationUtil.getCurrentUser();
        String url = paymentService.createVNPayUrl(bookingId, user, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("URL thanh toán tạo thành công", url));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<PaymentResponse>> vnpayReturn(
            @RequestParam Map<String, String> params) {
        PaymentResponse response = paymentService.handleVNPayReturn(params);
        return ResponseEntity.ok(ApiResponse.success("Xử lý thanh toán thành công", response));
    }

    @GetMapping("/booking/{bookingId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(@PathVariable Long bookingId) {
        var user = authorizationUtil.getCurrentUser();
        PaymentResponse response = paymentService.getPaymentStatus(bookingId, user);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }
}
