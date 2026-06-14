package com.saf.room.repositories;

import com.saf.room.entities.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUserIdAndRoomId(Long userId, Long roomId);

    Page<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT f.room.id FROM Favorite f WHERE f.userId = :userId AND f.room.id IN :roomIds")
    List<Long> findFavoritedRoomIds(@Param("userId") Long userId, @Param("roomIds") List<Long> roomIds);
}
