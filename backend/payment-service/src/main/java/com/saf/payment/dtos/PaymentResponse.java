package com.saf.payment.dtos;

import com.saf.payment.entities.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long roomId;
    private Long userId;
    private BigDecimal amount;
    private String txnRef;
    private String orderInfo;
    private String bankCode;
    private String transactionNo;
    private PaymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
