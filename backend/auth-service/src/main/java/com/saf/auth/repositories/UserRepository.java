package com.saf.auth.repositories;

import com.saf.auth.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Boolean existsByPhone(String phone);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "u.phone LIKE CONCAT('%', :search, '%')")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    long countByCreatedAtIsNotNullAndCreatedAtAfter(LocalDateTime dateTime);

    @Query(value = "SELECT DATE(created_at) as d, COUNT(*) as cnt FROM users " +
            "WHERE created_at >= :since AND created_at IS NOT NULL GROUP BY DATE(created_at) ORDER BY d ASC",
            nativeQuery = true)
    List<Object[]> countNewUsersPerDay(@Param("since") LocalDateTime since);
}
