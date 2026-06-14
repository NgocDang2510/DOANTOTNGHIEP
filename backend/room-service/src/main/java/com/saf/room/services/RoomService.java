package com.saf.room.services;

import com.saf.room.clients.AuthServiceClient;
import com.saf.room.clients.BookingServiceClient;
import com.saf.room.clients.PaymentServiceClient;
import com.saf.room.dtos.RoomRequest;
import com.saf.room.dtos.RoomResponse;
import com.saf.room.dtos.UserInfo;
import com.saf.room.entities.Room;
import com.saf.room.entities.RoomAmenity;
import com.saf.room.entities.RoomImage;
import com.saf.room.entities.enums.AmenityType;
import com.saf.room.entities.enums.RoomStatus;
import com.saf.room.entities.enums.RoomType;
import com.saf.room.repositories.ReviewRepository;
import com.saf.room.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReviewRepository reviewRepository;
    private final AuthServiceClient authServiceClient;
    private final BookingServiceClient bookingServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    @Transactional
    public RoomResponse createRoom(UserInfo landlord, RoomRequest request) {
        if (!"LANDLORD".equals(landlord.getRole()) && !"ADMIN".equals(landlord.getRole())) {
            throw new RuntimeException("Chỉ chủ nhà mới được đăng phòng!");
        }
        Room room = Room.builder()
                .landlordId(landlord.getId())
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .address(request.getAddress())
                .district(request.getDistrict())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .area(request.getArea())
                .roomType(request.getRoomType() != null ? request.getRoomType() : RoomType.SINGLE)
                .status(RoomStatus.AVAILABLE)
                .build();
        addImages(room, request.getImageUrls());
        addAmenities(room, request.getAmenities());
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoom(UserInfo currentUser, Long roomId, RoomRequest request) {
        Room room = getById(roomId);
        checkOwnership(currentUser, room);
        room.setTitle(request.getTitle());
        room.setDescription(request.getDescription());
        room.setPrice(request.getPrice());
        room.setAddress(request.getAddress());
        room.setDistrict(request.getDistrict());
        room.setCity(request.getCity());
        room.setLatitude(request.getLatitude());
        room.setLongitude(request.getLongitude());
        room.setArea(request.getArea());
        if (request.getRoomType() != null) room.setRoomType(request.getRoomType());
        room.getImages().clear();
        room.getAmenities().clear();
        addImages(room, request.getImageUrls());
        addAmenities(room, request.getAmenities());
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(UserInfo currentUser, Long roomId) {
        Room room = getById(roomId);
        checkOwnership(currentUser, room);
        roomRepository.delete(room);
    }

    @Transactional
    public RoomResponse changeStatus(UserInfo currentUser, Long roomId, RoomStatus newStatus) {
        Room room = getById(roomId);
        checkOwnership(currentUser, room);
        RoomStatus statusToSet = newStatus;
        if (newStatus == RoomStatus.AVAILABLE) {
            try {
                Boolean hasPaid = paymentServiceClient.hasSuccessPayment(roomId).getData();
                if (Boolean.TRUE.equals(hasPaid)) statusToSet = RoomStatus.RENTED;
            } catch (Exception ignored) {}
        }
        room.setStatus(statusToSet);
        return toResponse(roomRepository.save(room));
    }

    public RoomResponse getRoomDetail(Long roomId) {
        return toResponse(getById(roomId));
    }

    @Transactional
    public RoomResponse viewRoom(Long roomId) {
        Room room = getById(roomId);
        room.setViewCount((room.getViewCount() == null ? 0L : room.getViewCount()) + 1);
        return toResponse(roomRepository.save(room));
    }

    public Page<RoomResponse> searchRooms(String city, String district, BigDecimal minPrice,
                                          BigDecimal maxPrice, RoomType roomType, String keyword,
                                          Pageable pageable) {
        return roomRepository.searchRooms(RoomStatus.AVAILABLE, city, district, minPrice, maxPrice, roomType, keyword, pageable)
                .map(this::toResponse);
    }

    public Page<RoomResponse> getLandlordRooms(Long landlordId, Pageable pageable) {
        return roomRepository.findByLandlordId(landlordId, pageable).map(this::toResponse);
    }

    @Transactional
    public void updateRoomStatusInternal(Long roomId, RoomStatus status) {
        Room room = getById(roomId);
        room.setStatus(status);
        roomRepository.save(room);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public Room getById(Long id) {
        return roomRepository.findById(id).orElseThrow(() -> new RuntimeException("Phòng không tồn tại!"));
    }

    private void checkOwnership(UserInfo user, Room room) {
        if ("ADMIN".equals(user.getRole())) return;
        if (!room.getLandlordId().equals(user.getId())) throw new RuntimeException("Bạn không có quyền thực hiện thao tác này!");
    }

    private void addImages(Room room, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        for (int i = 0; i < imageUrls.size(); i++) {
            room.getImages().add(RoomImage.builder().room(room).imageUrl(imageUrls.get(i)).isPrimary(i == 0).displayOrder(i).build());
        }
    }

    private void addAmenities(Room room, List<AmenityType> amenities) {
        if (amenities == null || amenities.isEmpty()) return;
        for (AmenityType type : amenities) {
            room.getAmenities().add(RoomAmenity.builder().room(room).amenityType(type).build());
        }
    }

    public Map<String, Object> getRoomStats() {
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalRooms", roomRepository.count());
        stats.put("availableRooms", roomRepository.countByStatus(RoomStatus.AVAILABLE));
        stats.put("rentedRooms", roomRepository.countByStatus(RoomStatus.RENTED));
        return stats;
    }

    public RoomResponse toResponse(Room room) {
        Double avg = reviewRepository.findAverageRatingByRoomId(room.getId());
        long reviewCount = reviewRepository.countByRoomId(room.getId());
        List<String> imageUrls = room.getImages().stream()
                .sorted(java.util.Comparator.comparingInt(img -> (img.getDisplayOrder() != null ? img.getDisplayOrder() : 0)))
                .map(RoomImage::getImageUrl).toList();
        List<AmenityType> amenities = room.getAmenities().stream().map(RoomAmenity::getAmenityType).toList();

        String landlordName = null, landlordPhone = null, landlordAvatarUrl = null;
        try {
            UserInfo landlord = authServiceClient.getUserById(room.getLandlordId()).getData();
            landlordName = landlord.getFullName();
            landlordPhone = landlord.getPhone();
            landlordAvatarUrl = landlord.getAvatarUrl();
        } catch (Exception ignored) {}

        return RoomResponse.builder()
                .id(room.getId())
                .landlordId(room.getLandlordId())
                .landlordName(landlordName)
                .landlordPhone(landlordPhone)
                .landlordAvatarUrl(landlordAvatarUrl)
                .title(room.getTitle())
                .description(room.getDescription())
                .price(room.getPrice())
                .address(room.getAddress())
                .district(room.getDistrict())
                .city(room.getCity())
                .latitude(room.getLatitude())
                .longitude(room.getLongitude())
                .area(room.getArea())
                .roomType(room.getRoomType())
                .status(room.getStatus())
                .imageUrls(imageUrls)
                .amenities(amenities)
                .averageRating(avg)
                .reviewCount(reviewCount)
                .viewCount(room.getViewCount() != null ? room.getViewCount() : 0L)
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
