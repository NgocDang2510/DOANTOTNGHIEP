package com.saf.payment.services;

import com.saf.payment.clients.BookingServiceClient;
import com.saf.payment.clients.RoomServiceClient;
import com.saf.payment.dtos.BookingInfo;
import com.saf.payment.dtos.PaymentResponse;
import com.saf.payment.dtos.RoomInfo;
import com.saf.payment.dtos.UserInfo;
import com.saf.payment.entities.Payment;
import com.saf.payment.entities.enums.PaymentStatus;
import com.saf.payment.repositories.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final VNPayService vnPayService;
    private final BookingServiceClient bookingServiceClient;
    private final RoomServiceClient roomServiceClient;

    public String createVNPayUrl(Long bookingId, UserInfo user, String ipAddr) {
        BookingInfo booking = bookingServiceClient.getBookingById(bookingId).getData();
        if (booking == null) throw new RuntimeException("Booking không tồn tại");
        if (!booking.getStudentId().equals(user.getId())) throw new RuntimeException("Không có quyền thanh toán booking này");
        if (!"CONFIRMED".equals(booking.getStatus())) throw new RuntimeException("Booking chưa được xác nhận");

        RoomInfo room = roomServiceClient.getRoomById(booking.getRoomId()).getData();
        if (room == null) throw new RuntimeException("Phòng không tồn tại");

        return vnPayService.createPaymentUrl(bookingId, room.getPrice().longValue(), ipAddr);
    }

    @Transactional
    public PaymentResponse handleVNPayReturn(Map<String, String> params) {
        boolean valid = vnPayService.verifyReturn(params);
        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        boolean success = valid && "00".equals(responseCode);

        Long bookingId = Long.parseLong(txnRef.split("_")[0]);
        BookingInfo booking = bookingServiceClient.getBookingById(bookingId).getData();
        if (booking == null) throw new RuntimeException("Booking không tồn tại");

        Payment payment = Payment.builder()
                .bookingId(bookingId)
                .roomId(booking.getRoomId())
                .userId(booking.getStudentId())
                .amount(BigDecimal.valueOf(Long.parseLong(params.getOrDefault("vnp_Amount", "0")) / 100))
                .txnRef(txnRef)
                .orderInfo(params.get("vnp_OrderInfo"))
                .bankCode(params.get("vnp_BankCode"))
                .transactionNo(params.get("vnp_TransactionNo"))
                .status(success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED)
                .build();

        if (success) {
            payment.setPaidAt(LocalDateTime.now());
            try {
                bookingServiceClient.updateBookingStatus(bookingId, "COMPLETED");
            } catch (Exception e) {
                log.warn("Could not update booking status: {}", e.getMessage());
            }
            try {
                roomServiceClient.updateRoomStatus(booking.getRoomId(), "RENTED");
            } catch (Exception e) {
                log.warn("Could not update room status: {}", e.getMessage());
            }
        }

        payment = paymentRepository.save(payment);
        return toResponse(payment);
    }

    public PaymentResponse getPaymentStatus(Long bookingId, UserInfo user) {
        BookingInfo booking = bookingServiceClient.getBookingById(bookingId).getData();
        if (booking == null) throw new RuntimeException("Booking không tồn tại");
        if (!booking.getStudentId().equals(user.getId()) && !booking.getLandlordId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền xem thanh toán này");
        }
        Payment payment = paymentRepository.findTopByBookingIdOrderByCreatedAtDesc(bookingId)
                .orElseThrow(() -> new RuntimeException("Chưa có thanh toán"));
        return toResponse(payment);
    }

    public boolean hasSuccessPayment(Long roomId) {
        return paymentRepository.existsByRoomIdAndStatus(roomId, PaymentStatus.SUCCESS);
    }

    public long countTotal() {
        return paymentRepository.count();
    }

    public long countByStatus(String status) {
        return paymentRepository.countByStatus(PaymentStatus.valueOf(status));
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .bookingId(p.getBookingId())
                .roomId(p.getRoomId())
                .userId(p.getUserId())
                .amount(p.getAmount())
                .txnRef(p.getTxnRef())
                .orderInfo(p.getOrderInfo())
                .bankCode(p.getBankCode())
                .transactionNo(p.getTransactionNo())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .paidAt(p.getPaidAt())
                .build();
    }
}
