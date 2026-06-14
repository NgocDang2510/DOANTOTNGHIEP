package com.saf.room.repositories;

import com.saf.room.entities.Room;
import com.saf.room.entities.enums.RoomStatus;
import com.saf.room.entities.enums.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Page<Room> findByLandlordId(Long landlordId, Pageable pageable);

    @Query("""
        SELECT r FROM Room r
        WHERE r.status = :status
        AND (:city IS NULL OR LOWER(r.city) LIKE LOWER(CONCAT('%', :city, '%')))
        AND (:district IS NULL OR LOWER(r.district) LIKE LOWER(CONCAT('%', :district, '%')))
        AND (:minPrice IS NULL OR r.price >= :minPrice)
        AND (:maxPrice IS NULL OR r.price <= :maxPrice)
        AND (:roomType IS NULL OR r.roomType = :roomType)
        AND (:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(r.address) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY r.createdAt DESC
    """)
    Page<Room> searchRooms(
        @Param("status") RoomStatus status,
        @Param("city") String city,
        @Param("district") String district,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("roomType") RoomType roomType,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    List<Room> findByStatus(RoomStatus status);

    long countByStatus(RoomStatus status);

    long countByLandlordId(Long landlordId);

    @Query("SELECT r FROM Room r WHERE r.landlordId = :landlordId ORDER BY r.viewCount DESC")
    List<Room> findTopByLandlordOrderByViewCount(@Param("landlordId") Long landlordId, Pageable pageable);

    @Query("""
        SELECT r FROM Room r
        WHERE r.status = 'AVAILABLE'
        AND r.id NOT IN :excludedIds
        AND (:city IS NULL OR r.city = :city)
        AND (:roomType IS NULL OR r.roomType = :roomType)
        AND (:minPrice IS NULL OR r.price >= :minPrice)
        AND (:maxPrice IS NULL OR r.price <= :maxPrice)
        ORDER BY r.viewCount DESC, r.createdAt DESC
    """)
    List<Room> findRecommendations(
        @Param("excludedIds") List<Long> excludedIds,
        @Param("city") String city,
        @Param("roomType") RoomType roomType,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable
    );

    @Query(value = """
        SELECT r.* FROM rooms r
        WHERE r.status = 'AVAILABLE'
          AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
          AND (6371 * acos(LEAST(1.0,
                cos(radians(:lat)) * cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(r.latitude))
              ))) <= :radius
        ORDER BY (6371 * acos(LEAST(1.0,
                cos(radians(:lat)) * cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(r.latitude))
              )))
        """, nativeQuery = true)
    List<Room> findNearby(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radius") double radius,
        Pageable pageable
    );

    long countByStatus(RoomStatus status);
}
