package com.saf.core.services;

import com.saf.core.dtos.RoomRequest;
import com.saf.core.dtos.RoomResponse;
import com.saf.core.entities.Room;
import com.saf.core.entities.RoomAmenity;
import com.saf.core.entities.RoomImage;
import com.saf.core.entities.User;
import com.saf.core.entities.enums.AmenityType;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.entities.enums.RoomType;
import com.saf.core.entities.enums.PaymentStatus;
import com.saf.core.repositories.PaymentRepository;
import com.saf.core.repositories.ReviewRepository;
import com.saf.core.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public RoomResponse createRoom(User landlord, RoomRequest request) {
        if (landlord.getRole() != User.Role.LANDLORD && landlord.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Chỉ chủ nhà mới được đăng phòng!");
        }

        Room room = Room.builder()
                .landlord(landlord)
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
    public RoomResponse updateRoom(User currentUser, Long roomId, RoomRequest request) {
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
    public void deleteRoom(User currentUser, Long roomId) {
        Room room = getById(roomId);
        checkOwnership(currentUser, room);
        roomRepository.delete(room);
    }

    @Transactional
    public RoomResponse changeStatus(User currentUser, Long roomId, RoomStatus newStatus) {
        Room room = getById(roomId);
        checkOwnership(currentUser, room);
        // Nếu chủ nhà un-hide → AVAILABLE nhưng phòng đã có người đặt cọc thành công, giữ RENTED
        RoomStatus statusToSet = newStatus;
        if (newStatus == RoomStatus.AVAILABLE &&
                paymentRepository.existsByBooking_Room_IdAndStatus(roomId, PaymentStatus.SUCCESS)) {
            statusToSet = RoomStatus.RENTED;
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
        return roomRepository.searchRooms(
                RoomStatus.AVAILABLE, city, district, minPrice, maxPrice, roomType, keyword, pageable
        ).map(this::toResponse);
    }

    public Page<RoomResponse> getLandlordRooms(Long landlordId, Pageable pageable) {
        return roomRepository.findByLandlordId(landlordId, pageable).map(this::toResponse);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Room getById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại!"));
    }

    private void checkOwnership(User user, Room room) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (!room.getLandlord().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này!");
        }
    }

    private void addImages(Room room, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        for (int i = 0; i < imageUrls.size(); i++) {
            room.getImages().add(RoomImage.builder()
                    .room(room)
                    .imageUrl(imageUrls.get(i))
                    .isPrimary(i == 0)
                    .displayOrder(i)
                    .build());
        }
    }

    private void addAmenities(Room room, List<AmenityType> amenities) {
        if (amenities == null || amenities.isEmpty()) return;
        for (AmenityType type : amenities) {
            room.getAmenities().add(RoomAmenity.builder()
                    .room(room)
                    .amenityType(type)
                    .build());
        }
    }

    public RoomResponse toResponse(Room room) {
        Double avg = reviewRepository.findAverageRatingByRoomId(room.getId());
        long reviewCount = reviewRepository.countByRoomId(room.getId());

        List<String> imageUrls = room.getImages().stream()
                .sorted(java.util.Comparator.comparingInt(img -> (img.getDisplayOrder() != null ? img.getDisplayOrder() : 0)))
                .map(RoomImage::getImageUrl)
                .toList();

        List<AmenityType> amenities = room.getAmenities().stream()
                .map(RoomAmenity::getAmenityType)
                .toList();

        return RoomResponse.builder()
                .id(room.getId())
                .landlordId(room.getLandlord().getId())
                .landlordName(room.getLandlord().getFullName())
                .landlordPhone(room.getLandlord().getPhone())
                .landlordAvatarUrl(room.getLandlord().getAvatarUrl())
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
