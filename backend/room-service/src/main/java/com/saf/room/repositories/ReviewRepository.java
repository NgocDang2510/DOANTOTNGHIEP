package com.saf.room.repositories;

import com.saf.room.entities.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByRoomIdOrderByCreatedAtDesc(Long roomId, Pageable pageable);

    Optional<Review> findByRoomIdAndStudentId(Long roomId, Long studentId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.room.id = :roomId")
    Double findAverageRatingByRoomId(@Param("roomId") Long roomId);

    long countByRoomId(Long roomId);
}
