package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.dtos.UserInfo;
import com.saf.room.entities.Favorite;
import com.saf.room.entities.Room;
import com.saf.room.repositories.FavoriteRepository;
import com.saf.room.repositories.RoomRepository;
import com.saf.room.security.AuthorizationUtil;
import com.saf.room.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final AuthorizationUtil authorizationUtil;

    @PostMapping("/{roomId}")
    public ResponseEntity<ApiResponse<?>> toggle(@PathVariable Long roomId) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndRoomId(user.getId(), roomId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return ResponseEntity.ok(ApiResponse.success("Đã bỏ yêu thích", Map.of("favorited", false)));
        }
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));
        favoriteRepository.save(new Favorite(user.getId(), room));
        return ResponseEntity.ok(ApiResponse.success("Đã thêm yêu thích", Map.of("favorited", true)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getMyFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Page<Favorite> favPage = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size));
        List<RoomResponse> rooms = favPage.getContent().stream()
                .map(f -> roomService.getRoomDetail(f.getRoom().getId()))
                .collect(Collectors.toList());
        Map<String, Object> result = Map.of(
                "content", rooms, "totalElements", favPage.getTotalElements(),
                "totalPages", favPage.getTotalPages(), "currentPage", favPage.getNumber());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích thành công", result));
    }

    @PostMapping("/status")
    public ResponseEntity<ApiResponse<?>> getBatchStatus(@RequestBody List<Long> roomIds) {
        UserInfo user = authorizationUtil.getCurrentUser();
        Set<Long> favoritedIds = Set.copyOf(favoriteRepository.findFavoritedRoomIds(user.getId(), roomIds));
        Map<Long, Boolean> result = roomIds.stream().collect(Collectors.toMap(id -> id, favoritedIds::contains));
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }
}
