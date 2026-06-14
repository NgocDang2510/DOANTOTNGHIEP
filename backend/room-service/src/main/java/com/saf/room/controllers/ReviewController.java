package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.PageResponse;
import com.saf.room.dtos.ReviewRequest;
import com.saf.room.dtos.ReviewResponse;
import com.saf.room.security.AuthorizationUtil;
import com.saf.room.services.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthorizationUtil authorizationUtil;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<ApiResponse<?>> getRoomReviews(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReviewResponse> result = reviewService.getRoomReviews(roomId, pageable);
            return ResponseEntity.ok(ApiResponse.success("Lấy đánh giá thành công", PageResponse.from(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createReview(@RequestBody ReviewRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đánh giá phòng thành công", reviewService.createReview(user, request)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateReview(@PathVariable Long id, @RequestBody ReviewRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();
            return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá thành công", reviewService.updateReview(user, id, request)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteReview(@PathVariable Long id) {
        try {
            var user = authorizationUtil.getCurrentUser();
            reviewService.deleteReview(user, id);
            return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
