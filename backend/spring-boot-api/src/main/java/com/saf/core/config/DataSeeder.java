package com.saf.core.config;

import com.saf.core.entities.*;
import com.saf.core.entities.enums.*;
import com.saf.core.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (roomRepository.count() > 0) return;

        String pw = passwordEncoder.encode("123456");

        // ── Landlords ──────────────────────────────────────────
        User l1 = saveUser("0901111111", "Nguyễn Văn An", pw, User.Role.LANDLORD);
        User l2 = saveUser("0902222222", "Trần Thị Bình", pw, User.Role.LANDLORD);
        User l3 = saveUser("0903333333", "Lê Minh Cường", pw, User.Role.LANDLORD);

        // ── Students ───────────────────────────────────────────
        User s1 = saveUser("0911111111", "Phạm Thị Dung", pw, User.Role.STUDENT);
        User s2 = saveUser("0912222222", "Vũ Hoàng Em", pw, User.Role.STUDENT);

        // ── Rooms ──────────────────────────────────────────────
        Room r1 = saveRoom(l1, "Phòng trọ sạch sẽ, đầy đủ nội thất Quận 1",
            "Phòng rộng 25m², có ban công nhìn ra đường, nội thất mới, an ninh 24/7.",
            3_500_000L, "12 Nguyễn Huệ", "Quận 1", "TP. Hồ Chí Minh",
            25.0, RoomType.SINGLE, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room1a/800/600",
                "https://picsum.photos/seed/room1b/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.AIR_CONDITIONER, AmenityType.PRIVATE_BATHROOM));

        Room r2 = saveRoom(l1, "Căn hộ mini Bình Thạnh, gần ĐH Văn Lang",
            "Căn hộ mini 35m², bếp riêng, máy giặt chung, gần trường đại học và siêu thị.",
            4_200_000L, "45 Đinh Bộ Lĩnh", "Bình Thạnh", "TP. Hồ Chí Minh",
            35.0, RoomType.APARTMENT, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room2a/800/600",
                "https://picsum.photos/seed/room2b/800/600",
                "https://picsum.photos/seed/room2c/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.AIR_CONDITIONER, AmenityType.KITCHEN,
                    AmenityType.FRIDGE, AmenityType.WASHING_MACHINE));

        Room r3 = saveRoom(l2, "Ở ghép sinh viên Thủ Đức, giá rẻ",
            "Phòng ở ghép 2 người, thoáng mát, gần ĐHQG TP.HCM, có chỗ để xe miễn phí.",
            1_800_000L, "78 Tô Vĩnh Diện", "Thủ Đức", "TP. Hồ Chí Minh",
            20.0, RoomType.SHARED, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room3a/800/600",
                "https://picsum.photos/seed/room3b/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.PARKING, AmenityType.WASHING_MACHINE));

        Room r4 = saveRoom(l2, "Nhà nguyên căn Gò Vấp, 4 phòng ngủ",
            "Nhà nguyên căn 4PN, 2WC, có sân thượng, phù hợp nhóm 4-6 sinh viên thuê chung.",
            8_000_000L, "120 Quang Trung", "Gò Vấp", "TP. Hồ Chí Minh",
            80.0, RoomType.HOUSE, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room4a/800/600",
                "https://picsum.photos/seed/room4b/800/600",
                "https://picsum.photos/seed/room4c/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.AIR_CONDITIONER, AmenityType.KITCHEN,
                    AmenityType.FRIDGE, AmenityType.WASHING_MACHINE, AmenityType.PARKING,
                    AmenityType.SECURITY_CAMERA));

        Room r5 = saveRoom(l2, "Phòng trọ giá rẻ Quận 12, gần KCN",
            "Phòng 18m², có WC riêng, gần khu công nghiệp và chợ Tân Thới Nhất.",
            2_500_000L, "34 Thạnh Xuân", "Quận 12", "TP. Hồ Chí Minh",
            18.0, RoomType.SINGLE, RoomStatus.RENTED,
            List.of("https://picsum.photos/seed/room5a/800/600"),
            List.of(AmenityType.PRIVATE_BATHROOM, AmenityType.PARKING));

        Room r6 = saveRoom(l3, "Căn hộ cao cấp Hoàn Kiếm, view hồ",
            "Căn hộ 40m², view Hồ Hoàn Kiếm, đầy đủ tiện nghi, thang máy, bảo vệ 24/7.",
            6_500_000L, "5 Đinh Tiên Hoàng", "Hoàn Kiếm", "Hà Nội",
            40.0, RoomType.APARTMENT, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room6a/800/600",
                "https://picsum.photos/seed/room6b/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.AIR_CONDITIONER, AmenityType.ELEVATOR,
                    AmenityType.SECURITY_CAMERA, AmenityType.PRIVATE_BATHROOM, AmenityType.KITCHEN));

        Room r7 = saveRoom(l3, "Phòng trọ Cầu Giấy, gần ĐH Quốc Gia HN",
            "Phòng 22m², yên tĩnh, gần trường, có máy lạnh, WC khép kín.",
            2_800_000L, "67 Xuân Thủy", "Cầu Giấy", "Hà Nội",
            22.0, RoomType.SINGLE, RoomStatus.AVAILABLE,
            List.of(
                "https://picsum.photos/seed/room7a/800/600",
                "https://picsum.photos/seed/room7b/800/600"
            ),
            List.of(AmenityType.WIFI, AmenityType.AIR_CONDITIONER, AmenityType.PRIVATE_BATHROOM));

        Room r8 = saveRoom(l3, "Ở ghép Đống Đa, giá tốt cho sinh viên",
            "Phòng ở ghép 3 người, tủ lạnh chung, bếp chung, gần hồ Tây và các trường ĐH.",
            1_500_000L, "23 Láng Hạ", "Đống Đa", "Hà Nội",
            30.0, RoomType.SHARED, RoomStatus.AVAILABLE,
            List.of("https://picsum.photos/seed/room8a/800/600"),
            List.of(AmenityType.WIFI, AmenityType.FRIDGE, AmenityType.KITCHEN,
                    AmenityType.PET_ALLOWED));

        // ── Bookings ────────────────────────────────────────────
        Booking b1 = Booking.builder()
            .room(r1).student(s1).landlord(l1)
            .scheduledAt(LocalDateTime.now().minusDays(10))
            .note("Tôi muốn xem phòng vào buổi sáng")
            .status(BookingStatus.COMPLETED)
            .build();
        bookingRepository.save(b1);

        Booking b2 = Booking.builder()
            .room(r2).student(s2).landlord(l1)
            .scheduledAt(LocalDateTime.now().minusDays(5))
            .note("Cho tôi xem phòng chiều thứ 7")
            .status(BookingStatus.CONFIRMED)
            .build();
        bookingRepository.save(b2);

        Booking b3 = Booking.builder()
            .room(r6).student(s1).landlord(l3)
            .scheduledAt(LocalDateTime.now().plusDays(3))
            .note("Mình muốn thuê dài hạn 1 năm")
            .status(BookingStatus.PENDING)
            .build();
        bookingRepository.save(b3);

        Booking b4 = Booking.builder()
            .room(r7).student(s2).landlord(l3)
            .scheduledAt(LocalDateTime.now().minusDays(15))
            .note(null)
            .status(BookingStatus.COMPLETED)
            .build();
        bookingRepository.save(b4);

        // ── Reviews ─────────────────────────────────────────────
        Review rv1 = Review.builder()
            .room(r1).student(s1)
            .rating(5)
            .comment("Phòng rất sạch sẽ, chủ nhà nhiệt tình, vị trí thuận tiện. Rất hài lòng!")
            .build();
        reviewRepository.save(rv1);

        Review rv2 = Review.builder()
            .room(r7).student(s2)
            .rating(4)
            .comment("Phòng ổn, gần trường. Chủ nhà dễ tính. Chỉ hơi ồn một chút ban ngày.")
            .build();
        reviewRepository.save(rv2);

        log.info("Sample data seeded: 3 landlords, 2 students, 8 rooms, 4 bookings, 2 reviews.");
    }

    private User saveUser(String phone, String fullName, String pw, User.Role role) {
        return userRepository.findByPhone(phone).orElseGet(() ->
            userRepository.save(User.builder()
                .phone(phone).fullName(fullName).passwordHash(pw).role(role)
                .isLocked(false).createdAt(LocalDateTime.now())
                .build()));
    }

    private Room saveRoom(User landlord, String title, String description, long price,
                          String address, String district, String city,
                          double area, RoomType type, RoomStatus status,
                          List<String> imageUrls, List<AmenityType> amenityTypes) {
        Room room = Room.builder()
            .landlord(landlord).title(title).description(description)
            .price(BigDecimal.valueOf(price))
            .address(address).district(district).city(city).area(BigDecimal.valueOf(area))
            .roomType(type).status(status)
            .build();

        for (int i = 0; i < imageUrls.size(); i++) {
            RoomImage img = new RoomImage();
            img.setRoom(room);
            img.setImageUrl(imageUrls.get(i));
            img.setIsPrimary(i == 0);
            img.setDisplayOrder(i);
            room.getImages().add(img);
        }
        for (AmenityType a : amenityTypes) {
            RoomAmenity am = new RoomAmenity();
            am.setRoom(room);
            am.setAmenityType(a);
            room.getAmenities().add(am);
        }
        return roomRepository.save(room);
    }
}
