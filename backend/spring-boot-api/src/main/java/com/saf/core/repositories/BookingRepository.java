package com.saf.core.repositories;

import com.saf.core.entities.Booking;
import com.saf.core.entities.enums.BookingStatus;
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

    @Query("SELECT DISTINCT b.room.id FROM Booking b WHERE b.student.id = :studentId AND b.status IN ('CONFIRMED', 'COMPLETED')")
    List<Long> findBookedRoomIdsByStudent(@Param("studentId") Long studentId);

    @Query("SELECT b.room.city, b.room.roomType, AVG(b.room.price) FROM Booking b WHERE b.student.id = :studentId AND b.status IN ('CONFIRMED', 'COMPLETED') GROUP BY b.room.city, b.room.roomType ORDER BY COUNT(b) DESC")
    List<Object[]> findPreferencesByStudent(@Param("studentId") Long studentId);

    @Query("""
        SELECT FUNCTION('MONTH', b.createdAt) as month,
               FUNCTION('YEAR', b.createdAt) as year,
               COUNT(b) as count
        FROM Booking b
        WHERE b.landlord.id = :landlordId AND b.createdAt >= :startDate
        GROUP BY FUNCTION('YEAR', b.createdAt), FUNCTION('MONTH', b.createdAt)
        ORDER BY FUNCTION('YEAR', b.createdAt), FUNCTION('MONTH', b.createdAt)
    """)
    List<Object[]> countByMonthForLandlord(@Param("landlordId") Long landlordId, @Param("startDate") LocalDateTime startDate);
}
