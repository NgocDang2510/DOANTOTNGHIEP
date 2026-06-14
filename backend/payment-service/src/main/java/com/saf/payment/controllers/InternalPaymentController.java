package com.saf.payment.controllers;

import com.saf.payment.dtos.ApiResponse;
import com.saf.payment.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/payments")
@RequiredArgsConstructor
public class InternalPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/has-success")
    public ResponseEntity<ApiResponse<Boolean>> hasSuccessPayment(@RequestParam Long roomId) {
        return ResponseEntity.ok(ApiResponse.success("OK", paymentService.hasSuccessPayment(roomId)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = Map.of(
                "totalPayments", paymentService.countTotal(),
                "successPayments", paymentService.countByStatus("SUCCESS")
        );
        return ResponseEntity.ok(ApiResponse.success("OK", stats));
    }
}
