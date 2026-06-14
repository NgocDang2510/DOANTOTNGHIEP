package com.saf.payment.repositories;

import com.saf.payment.entities.Payment;
import com.saf.payment.entities.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTxnRef(String txnRef);

    Optional<Payment> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);

    boolean existsByRoomIdAndStatus(Long roomId, PaymentStatus status);

    long countByStatus(PaymentStatus status);
}
