package com.saf.room.clients;

import com.saf.room.dtos.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "payment-service", url = "${services.payment-service.url}")
public interface PaymentServiceClient {

    @GetMapping("/api/internal/payments/has-success")
    ApiResponse<Boolean> hasSuccessPayment(@RequestParam Long roomId);
}
