package com.saf.room.services;

import com.saf.room.clients.AuthServiceClient;
import com.saf.room.clients.BookingServiceClient;
import com.saf.room.dtos.ReviewRequest;
import com.saf.room.dtos.ReviewResponse;
import com.saf.room.dtos.UserInfo;
import com.saf.room.entities.Review;
import com.saf.room.entities.Room;
import com.saf.room.repositories.ReviewRepository;
import com.saf.room.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final AuthServiceClient authServiceClient;
    private final BookingServiceClient bookingServiceClient;

    @Transactional
    public ReviewResponse createReview(UserInfo student, ReviewRequest request) {
        if (!"STUDENT".equals(student.getRole())) throw new RuntimeException("Chỉ sinh viên mới được đánh giá phòng!");
        if (request.getRating() < 1 || request.getRating() > 5) throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao!");

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại!"));

        try {
            if (!Boolean.TRUE.equals(bookingServiceClient.hasCompletedBooking(student.getId(), room.getId()).getData())) {
                throw new RuntimeException("Bạn cần hoàn thành lịch xem phòng trước khi đánh giá!");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không thể xác minh lịch đặt phòng. Vui lòng thử lại.");
        }

        if (reviewRepository.findByRoomIdAndStudentId(room.getId(), student.getId()).isPresent()) {
            throw new RuntimeException("Bạn đã đánh giá phòng này rồi!");
        }

        Review review = Review.builder()
                .room(room).studentId(student.getId())
                .rating(request.getRating()).comment(request.getComment())
                .build();
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(UserInfo student, Long reviewId, ReviewRequest request) {
        Review review = getById(reviewId);
        if (!review.getStudentId().equals(student.getId())) throw new RuntimeException("Bạn không có quyền chỉnh sửa đánh giá này!");
        if (request.getRating() < 1 || request.getRating() > 5) throw new RuntimeException("Đánh giá phải từ 1 đến 5 sao!");
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(UserInfo currentUser, Long reviewId) {
        Review review = getById(reviewId);
        boolean isOwner = review.getStudentId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());
        if (!isOwner && !isAdmin) throw new RuntimeException("Bạn không có quyền xóa đánh giá này!");
        reviewRepository.delete(review);
    }

    public Page<ReviewResponse> getRoomReviews(Long roomId, Pageable pageable) {
        return reviewRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable).map(this::toResponse);
    }

    private Review getById(Long id) {
        return reviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Đánh giá không tồn tại!"));
    }

    private ReviewResponse toResponse(Review review) {
        String studentName = null, studentAvatarUrl = null;
        try {
            UserInfo student = authServiceClient.getUserById(review.getStudentId()).getData();
            studentName = student.getFullName();
            studentAvatarUrl = student.getAvatarUrl();
        } catch (Exception ignored) {}

        return ReviewResponse.builder()
                .id(review.getId())
                .roomId(review.getRoom().getId())
                .studentId(review.getStudentId())
                .studentName(studentName)
                .studentAvatarUrl(studentAvatarUrl)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
