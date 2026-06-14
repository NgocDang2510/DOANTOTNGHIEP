package com.saf.core.services;

import com.saf.core.dtos.ReviewRequest;
import com.saf.core.dtos.ReviewResponse;
import com.saf.core.entities.Review;
import com.saf.core.entities.Room;
import com.saf.core.entities.User;
import com.saf.core.entities.enums.BookingStatus;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.ReviewRepository;
import com.saf.core.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public ReviewResponse createReview(User student, ReviewRequest request) {
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Chỉ sinh viên mới được đánh giá phòng!");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao!");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại!"));

        boolean hasCompleted = bookingRepository.existsByStudentIdAndRoomIdAndStatusIn(
                student.getId(), room.getId(), List.of(BookingStatus.COMPLETED));
        if (!hasCompleted) {
            throw new RuntimeException("Bạn cần hoàn thành lịch xem phòng trước khi đánh giá!");
        }

        if (reviewRepository.findByRoomIdAndStudentId(room.getId(), student.getId()).isPresent()) {
            throw new RuntimeException("Bạn đã đánh giá phòng này rồi!");
        }

        Review review = Review.builder()
                .room(room)
                .student(student)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(User student, Long reviewId, ReviewRequest request) {
        Review review = getById(reviewId);
        if (!review.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa đánh giá này!");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao!");
        }
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(User currentUser, Long reviewId) {
        Review review = getById(reviewId);
        boolean isOwner = review.getStudent().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này!");
        }
        reviewRepository.delete(review);
    }

    public Page<ReviewResponse> getRoomReviews(Long roomId, Pageable pageable) {
        return reviewRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable)
                .map(this::toResponse);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Review getById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Đánh giá không tồn tại!"));
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .roomId(review.getRoom().getId())
                .studentId(review.getStudent().getId())
                .studentName(review.getStudent().getFullName())
                .studentAvatarUrl(review.getStudent().getAvatarUrl())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
