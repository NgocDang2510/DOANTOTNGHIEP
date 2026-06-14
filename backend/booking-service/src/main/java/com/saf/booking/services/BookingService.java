package com.saf.booking.services;

import com.saf.booking.clients.AuthServiceClient;
import com.saf.booking.clients.RoomServiceClient;
import com.saf.booking.dtos.*;
import com.saf.booking.entities.Booking;
import com.saf.booking.entities.enums.BookingStatus;
import com.saf.booking.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AuthServiceClient authServiceClient;
    private final RoomServiceClient roomServiceClient;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(UserInfo student, BookingRequest request) {
        RoomInfo room = roomServiceClient.getRoomById(request.getRoomId()).getData();
        if (room == null) throw new RuntimeException("Phòng không tồn tại");
        if (!"AVAILABLE".equals(room.getStatus())) throw new RuntimeException("Phòng không khả dụng");

        boolean alreadyBooked = bookingRepository.existsByStudentIdAndRoomIdAndStatusIn(
                student.getId(), request.getRoomId(),
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));
        if (alreadyBooked) throw new RuntimeException("Bạn đã đặt phòng này rồi");

        Booking booking = new Booking();
        booking.setRoomId(request.getRoomId());
        booking.setStudentId(student.getId());
        booking.setLandlordId(room.getLandlordId());
        booking.setScheduledAt(request.getScheduledAt());
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        UserInfo landlord = authServiceClient.getUserById(room.getLandlordId()).getData();
        sendNotification("NEW_BOOKING", booking, room, student, landlord);
        return buildResponse(booking, room, student, landlord);
    }

    public BookingResponse getBookingById(Long id, UserInfo currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));
        if (!booking.getStudentId().equals(currentUser.getId())
                && !booking.getLandlordId().equals(currentUser.getId())
                && !"ADMIN".equals(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem booking này");
        }
        return fetchAndBuild(booking);
    }

    public BookingInfo getBookingInfo(Long id) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));
        return BookingInfo.builder()
                .id(b.getId())
                .roomId(b.getRoomId())
                .studentId(b.getStudentId())
                .landlordId(b.getLandlordId())
                .status(b.getStatus().name())
                .scheduledAt(b.getScheduledAt())
                .createdAt(b.getCreatedAt())
                .build();
    }

    public Page<BookingResponse> getBookingsByStudent(Long studentId, Pageable pageable) {
        return bookingRepository.findByStudentIdOrderByCreatedAtDesc(studentId, pageable)
                .map(this::fetchAndBuild);
    }

    public Page<BookingResponse> getBookingsByLandlord(Long landlordId, Pageable pageable) {
        return bookingRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId, pageable)
                .map(this::fetchAndBuild);
    }

    @Transactional
    public BookingResponse updateStatus(Long bookingId, BookingStatus newStatus, UserInfo currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));

        if (!booking.getLandlordId().equals(currentUser.getId())
                && !booking.getStudentId().equals(currentUser.getId())
                && !"ADMIN".equals(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền cập nhật booking này");
        }

        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        RoomInfo room = fetchRoom(booking.getRoomId());
        UserInfo student = fetchUser(booking.getStudentId());
        UserInfo landlord = fetchUser(booking.getLandlordId());

        String notifType = switch (newStatus) {
            case CONFIRMED -> "BOOKING_CONFIRMED";
            case REJECTED -> "BOOKING_REJECTED";
            case CANCELLED -> "BOOKING_CANCELLED";
            case COMPLETED -> "BOOKING_COMPLETED";
            default -> null;
        };
        if (notifType != null) sendNotification(notifType, booking, room, student, landlord);
        return buildResponse(booking, room, student, landlord);
    }

    @Transactional
    public void updateStatusInternal(Long bookingId, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));
        booking.setStatus(newStatus);
        bookingRepository.save(booking);
    }

    public List<Long> getBookedRoomIdsByStudent(Long studentId, List<BookingStatus> statuses) {
        return bookingRepository.findBookedRoomIdsByStudent(studentId, statuses);
    }

    public boolean hasCompletedBooking(Long studentId, Long roomId) {
        return bookingRepository.existsByStudentIdAndRoomIdAndStatusIn(
                studentId, roomId, List.of(BookingStatus.COMPLETED));
    }

    private BookingResponse fetchAndBuild(Booking booking) {
        return buildResponse(booking,
                fetchRoom(booking.getRoomId()),
                fetchUser(booking.getStudentId()),
                fetchUser(booking.getLandlordId()));
    }

    private RoomInfo fetchRoom(Long roomId) {
        try { return roomServiceClient.getRoomById(roomId).getData(); }
        catch (Exception e) { log.warn("Could not fetch room {}: {}", roomId, e.getMessage()); return null; }
    }

    private UserInfo fetchUser(Long userId) {
        try { return authServiceClient.getUserById(userId).getData(); }
        catch (Exception e) { log.warn("Could not fetch user {}: {}", userId, e.getMessage()); return null; }
    }

    private BookingResponse buildResponse(Booking b, RoomInfo room, UserInfo student, UserInfo landlord) {
        return BookingResponse.builder()
                .id(b.getId())
                .roomId(b.getRoomId())
                .roomTitle(room != null ? room.getTitle() : null)
                .roomAddress(room != null ? room.getAddress() : null)
                .roomImageUrl(room != null && room.getImageUrls() != null && !room.getImageUrls().isEmpty()
                        ? room.getImageUrls().get(0) : null)
                .studentId(b.getStudentId())
                .studentName(student != null ? student.getFullName() : null)
                .studentPhone(student != null ? student.getPhone() : null)
                .landlordId(b.getLandlordId())
                .landlordName(landlord != null ? landlord.getFullName() : null)
                .landlordPhone(landlord != null ? landlord.getPhone() : null)
                .scheduledAt(b.getScheduledAt())
                .status(b.getStatus())
                .roomStatus(room != null ? room.getStatus() : null)
                .note(b.getNote())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private void sendNotification(String type, Booking booking, RoomInfo room,
                                   UserInfo student, UserInfo landlord) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("bookingId", booking.getId());
        payload.put("roomId", booking.getRoomId());
        payload.put("roomTitle", room != null ? room.getTitle() : "");
        payload.put("studentId", booking.getStudentId());
        payload.put("studentName", student != null ? student.getFullName() : "");
        payload.put("landlordId", booking.getLandlordId());
        payload.put("landlordName", landlord != null ? landlord.getFullName() : "");
        notificationService.sendBookingNotification(payload);
    }
}
