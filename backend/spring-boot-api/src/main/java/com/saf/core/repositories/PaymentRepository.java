package com.saf.core.repositories;

import com.saf.core.entities.Booking;
import com.saf.core.entities.Payment;
import com.saf.core.entities.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTxnRef(String txnRef);

    Optional<Payment> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);

    Optional<Payment> findTopByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, PaymentStatus status);

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    boolean existsByBooking_Room_IdAndStatus(Long roomId, PaymentStatus status);

    @Query("SELECT p.booking FROM Payment p WHERE p.booking.room.id = :roomId AND p.status = :status ORDER BY p.paidAt DESC")
    Optional<Booking> findTenantBookingByRoomAndStatus(@Param("roomId") Long roomId, @Param("status") PaymentStatus status);
}
