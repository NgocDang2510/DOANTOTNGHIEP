package com.saf.core.repositories;

import com.saf.core.entities.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndRoomId(Long userId, Long roomId);

    Optional<Favorite> findByUserIdAndRoomId(Long userId, Long roomId);

    Page<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT f.room.id FROM Favorite f WHERE f.user.id = :userId AND f.room.id IN :roomIds")
    List<Long> findFavoritedRoomIds(@Param("userId") Long userId, @Param("roomIds") List<Long> roomIds);
}
