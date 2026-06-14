package com.saf.core.controllers;

import com.saf.core.dtos.ApiResponse;
import com.saf.core.entities.Booking;
import com.saf.core.entities.Payment;
import com.saf.core.entities.enums.BookingStatus;
import com.saf.core.entities.enums.PaymentStatus;
import com.saf.core.entities.enums.RoomStatus;
import com.saf.core.repositories.BookingRepository;
import com.saf.core.repositories.PaymentRepository;
import com.saf.core.repositories.RoomRepository;
import com.saf.core.security.AuthorizationUtil;
import com.saf.core.services.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final VNPayService vnPayService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RoomRepository roomRepository;
    private final AuthorizationUtil authorizationUtil;

    @Value("${vnpay.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<?>> createPayment(
            @PathVariable Long bookingId,
            HttpServletRequest request) {
        try {
            var user = authorizationUtil.getCurrentUser();

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Lịch hẹn không tồn tại!"));

            if (!booking.getStudent().getId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Bạn không có quyền thanh toán lịch hẹn này!"));
            }
            if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.COMPLETED) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ có thể đặt cọc sau khi lịch hẹn được xác nhận và đã xem phòng!"));
            }
            if (paymentRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.SUCCESS)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Lịch hẹn này đã được đặt cọc!"));
            }

            String txnRef = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
            String orderInfo = "Dat coc phong: " + booking.getRoom().getTitle();
            String ipAddr = getClientIp(request);

            Payment payment = Payment.builder()
                    .booking(booking)
                    .user(user)
                    .amount(booking.getRoom().getPrice())
                    .txnRef(txnRef)
                    .orderInfo(orderInfo)
                    .status(PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(payment);

            String payUrl = vnPayService.createPaymentUrl(txnRef, booking.getRoom().getPrice(), orderInfo, ipAddr);

            Map<String, String> result = new HashMap<>();
            result.put("payUrl", payUrl);
            return ResponseEntity.ok(ApiResponse.success("Tạo URL thanh toán thành công", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> params,
                            HttpServletResponse response) throws IOException {
        try {
            boolean valid = vnPayService.verifyReturn(params);
            String txnRef = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");

            if (valid && txnRef != null) {
                paymentRepository.findByTxnRef(txnRef).ifPresent(payment -> {
                    if ("00".equals(responseCode)) {
                        payment.setStatus(PaymentStatus.SUCCESS);
                        payment.setBankCode(params.get("vnp_BankCode"));
                        payment.setTransactionNo(params.get("vnp_TransactionNo"));
                        payment.setPaidAt(LocalDateTime.now());
                        // Đặt cọc thành công → phòng chuyển sang RENTED, ẩn khỏi tìm kiếm
                        var room = payment.getBooking().getRoom();
                        room.setStatus(RoomStatus.RENTED);
                        roomRepository.save(room);
                    } else {
                        payment.setStatus(PaymentStatus.FAILED);
                    }
                    paymentRepository.save(payment);
                });
            }

            String status = (valid && "00".equals(responseCode)) ? "success" : "failed";
            String redirectUrl = frontendUrl + "/payment-result?status=" + status
                    + "&txnRef=" + (txnRef != null ? txnRef : "")
                    + "&amount=" + params.getOrDefault("vnp_Amount", "");
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            log.error("VNPay return error", e);
            response.sendRedirect(frontendUrl + "/payment-result?status=error");
        }
    }

    @GetMapping("/booking/{bookingId}/status")
    public ResponseEntity<ApiResponse<?>> getPaymentStatus(@PathVariable Long bookingId) {
        try {
            // Ưu tiên payment SUCCESS, tránh PENDING mới nhất che khuất
            var payment = paymentRepository
                    .findTopByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, PaymentStatus.SUCCESS)
                    .or(() -> paymentRepository.findTopByBookingIdOrderByCreatedAtDesc(bookingId));
            if (payment.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("Chưa có thanh toán", null));
            }
            Map<String, Object> result = new HashMap<>();
            result.put("status", payment.get().getStatus().name());
            result.put("amount", payment.get().getAmount());
            result.put("paidAt", payment.get().getPaidAt());
            return ResponseEntity.ok(ApiResponse.success("OK", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        return ip != null ? ip.split(",")[0].trim() : "127.0.0.1";
    }
}
