package com.saf.payment.controllers;

import com.saf.payment.dtos.ApiResponse;
import com.saf.payment.dtos.PaymentResponse;
import com.saf.payment.security.AuthorizationUtil;
import com.saf.payment.services.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthorizationUtil authorizationUtil;

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPayment(
            @PathVariable Long bookingId,
            HttpServletRequest request) {
        var user = authorizationUtil.getCurrentUser();
        String url = paymentService.createVNPayUrl(bookingId, user, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("URL thanh toán tạo thành công", Map.of("payUrl", url)));
    }

    @PostMapping("/booking/{bookingId}/vnpay")
    public ResponseEntity<ApiResponse<String>> createVNPayUrl(
            @PathVariable Long bookingId,
            HttpServletRequest request) {
        var user = authorizationUtil.getCurrentUser();
        String url = paymentService.createVNPayUrl(bookingId, user, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("URL thanh toán tạo thành công", url));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        PaymentResponse response = paymentService.handleVNPayReturn(params);
        String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
        String redirectUrl;
        if ("00".equals(responseCode) && response != null) {
            redirectUrl = "http://localhost/payment-result?status=success"
                    + "&amount=" + params.getOrDefault("vnp_Amount", "")
                    + "&txnRef=" + response.getTxnRef();
        } else {
            redirectUrl = "http://localhost/payment-result?status=failed&code=" + responseCode;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", redirectUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/booking/{bookingId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(@PathVariable Long bookingId) {
        var user = authorizationUtil.getCurrentUser();
        PaymentResponse response = paymentService.getPaymentStatus(bookingId, user);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }
}
