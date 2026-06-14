package com.saf.booking.clients;

import com.saf.booking.dtos.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "payment-service", url = "${services.payment-service.url}")
public interface PaymentServiceClient {

    @GetMapping("/api/internal/payments/stats")
    ApiResponse<Object> getPaymentStats();
}
