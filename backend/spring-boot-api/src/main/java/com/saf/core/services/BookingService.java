package com.saf.core.services;

import com.saf.core.dtos.BookingRequest;
import com.saf.core.dtos.BookingResponse;
import com.saf.core.entities.Booking;
import com.saf.core.entities.Room;
import com.saf.core.entities.User;
import com.saf.core.entities.enums.BookingStatus;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(User student, BookingRequest request) {
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Chỉ sinh viên mới được đặt lịch xem phòng!");
        }

        if (request.getScheduledAt() == null || request.getScheduledAt().isBefore(LocalDateTime.now().plusDays(3))) {
            throw new RuntimeException("Ngày hẹn phải cách ngày hiện tại ít nhất 3 ngày!");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại!"));

        if (room.getStatus() == com.saf.core.entities.enums.RoomStatus.RENTED) {
            throw new RuntimeException("Phòng này đã có người thuê, không thể đặt lịch!");
        }
        if (room.getStatus() == com.saf.core.entities.enums.RoomStatus.HIDDEN) {
            throw new RuntimeException("Phòng này hiện không còn nhận đặt lịch!");
        }

        boolean hasPending = bookingRepository.existsByStudentIdAndRoomIdAndStatusIn(
                student.getId(), room.getId(),
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));
        if (hasPending) {
            throw new RuntimeException("Bạn đã có lịch hẹn chờ xác nhận cho phòng này!");
        }

        Booking booking = Booking.builder()
                .room(room)
                .student(student)
                .landlord(room.getLandlord())
                .scheduledAt(request.getScheduledAt())
                .note(request.getNote())
                .status(BookingStatus.PENDING)
                .build();

        BookingResponse saved = toResponse(bookingRepository.save(booking));
        // Notify landlord: lịch hẹn mới
        notificationService.notify(
                room.getLandlord().getId(),
                "booking_new",
                "Lịch hẹn mới",
                student.getFullName() + " muốn xem phòng \"" + room.getTitle() + "\"",
                "/incoming-bookings"
        );
        return saved;
    }

    public Page<BookingResponse> getStudentBookings(Long studentId, Pageable pageable) {
        return bookingRepository.findByStudentIdOrderByCreatedAtDesc(studentId, pageable)
                .map(this::toResponse);
    }

    public Page<BookingResponse> getLandlordBookings(Long landlordId, Pageable pageable) {
        return bookingRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public BookingResponse confirmBooking(User landlord, Long bookingId) {
        Booking booking = getById(bookingId);
        if (!booking.getLandlord().getId().equals(landlord.getId())) {
            throw new RuntimeException("Bạn không có quyền xác nhận lịch hẹn này!");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Lịch hẹn không ở trạng thái chờ xác nhận!");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        BookingResponse confirmed = toResponse(bookingRepository.save(booking));
        // Notify student: lịch hẹn được xác nhận
        notificationService.notify(
                booking.getStudent().getId(),
                "booking_confirmed",
                "Lịch hẹn được xác nhận ✅",
                "Chủ nhà đã xác nhận lịch xem phòng \"" + booking.getRoom().getTitle() + "\"",
                "/my-bookings"
        );
        return confirmed;
    }

    @Transactional
    public BookingResponse cancelBooking(User currentUser, Long bookingId) {
        Booking booking = getById(bookingId);
        boolean isStudent = booking.getStudent().getId().equals(currentUser.getId());
        boolean isLandlord = booking.getLandlord().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;

        if (!isStudent && !isLandlord && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền hủy lịch hẹn này!");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Không thể hủy lịch hẹn đã hoàn thành hoặc đã hủy!");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        BookingResponse cancelled = toResponse(bookingRepository.save(booking));
        // Notify the other party
        String roomTitle = booking.getRoom().getTitle();
        if (isStudent) {
            notificationService.notify(booking.getLandlord().getId(), "booking_cancelled",
                    "Lịch hẹn bị hủy ❌",
                    booking.getStudent().getFullName() + " đã hủy lịch xem phòng \"" + roomTitle + "\"",
                    "/incoming-bookings");
        } else if (isLandlord) {
            notificationService.notify(booking.getStudent().getId(), "booking_cancelled",
                    "Lịch hẹn bị hủy ❌",
                    "Chủ nhà đã hủy lịch xem phòng \"" + roomTitle + "\"",
                    "/my-bookings");
        }
        return cancelled;
    }

    @Transactional
    public BookingResponse completeBooking(User landlord, Long bookingId) {
        Booking booking = getById(bookingId);
        if (!booking.getLandlord().getId().equals(landlord.getId())) {
            throw new RuntimeException("Bạn không có quyền hoàn thành lịch hẹn này!");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Lịch hẹn phải ở trạng thái đã xác nhận!");
        }
        booking.setStatus(BookingStatus.COMPLETED);
        BookingResponse completed = toResponse(bookingRepository.save(booking));
        // Notify student: lịch hẹn hoàn thành
        notificationService.notify(
                booking.getStudent().getId(),
                "booking_completed",
                "Lịch hẹn hoàn thành 🎉",
                "Bạn đã xem phòng \"" + booking.getRoom().getTitle() + "\". Hãy để lại đánh giá nhé!",
                "/my-bookings"
        );
        return completed;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lịch hẹn không tồn tại!"));
    }

    private BookingResponse toResponse(Booking booking) {
        Room room = booking.getRoom();
        String roomImageUrl = room.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst()
                .map(img -> img.getImageUrl())
                .orElse(room.getImages().isEmpty() ? null : room.getImages().get(0).getImageUrl());

        return BookingResponse.builder()
                .id(booking.getId())
                .roomId(room.getId())
                .roomTitle(room.getTitle())
                .roomAddress(room.getAddress())
                .roomImageUrl(roomImageUrl)
                .studentId(booking.getStudent().getId())
                .studentName(booking.getStudent().getFullName())
                .studentPhone(booking.getStudent().getPhone())
                .landlordId(booking.getLandlord().getId())
                .landlordName(booking.getLandlord().getFullName())
                .landlordPhone(booking.getLandlord().getPhone())
                .scheduledAt(booking.getScheduledAt())
                .status(booking.getStatus())
                .roomStatus(room.getStatus().name())
                .note(booking.getNote())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
