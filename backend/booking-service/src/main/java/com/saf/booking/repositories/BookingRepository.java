package com.saf.booking.repositories;

import com.saf.booking.entities.Booking;
import com.saf.booking.entities.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    Page<Booking> findByLandlordIdOrderByCreatedAtDesc(Long landlordId, Pageable pageable);

    List<Booking> findByRoomIdAndStatus(Long roomId, BookingStatus status);

    boolean existsByStudentIdAndRoomIdAndStatusIn(Long studentId, Long roomId, List<BookingStatus> statuses);

    long countByStatus(BookingStatus status);

    long countByLandlordId(Long landlordId);

    long countByLandlordIdAndStatus(Long landlordId, BookingStatus status);

    @Query("SELECT DISTINCT b.roomId FROM Booking b WHERE b.studentId = :studentId AND b.status IN :statuses")
    List<Long> findBookedRoomIdsByStudent(@Param("studentId") Long studentId, @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT MONTH(b.createdAt), YEAR(b.createdAt), COUNT(b) FROM Booking b WHERE b.landlordId = :landlordId AND b.createdAt >= :since GROUP BY YEAR(b.createdAt), MONTH(b.createdAt)")
    List<Object[]> countByMonthForLandlord(@Param("landlordId") Long landlordId, @Param("since") LocalDateTime since);
}
