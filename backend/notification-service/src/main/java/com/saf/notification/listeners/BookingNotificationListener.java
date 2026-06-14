package com.saf.notification.listeners;

import com.saf.notification.clients.AuthServiceClient;
import com.saf.notification.dtos.UserInfo;
import com.saf.notification.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationListener {

    private final EmailService emailService;
    private final AuthServiceClient authServiceClient;

    @RabbitListener(queues = "saf.notification.queue")
    public void handleBookingEvent(Map<String, Object> payload) {
        String type = (String) payload.get("type");
        log.info("Received booking notification: {}", type);

        try {
            Long studentId = toLong(payload.get("studentId"));
            Long landlordId = toLong(payload.get("landlordId"));
            String roomTitle = (String) payload.getOrDefault("roomTitle", "");
            String studentName = (String) payload.getOrDefault("studentName", "Sinh viên");
            String landlordName = (String) payload.getOrDefault("landlordName", "Chủ nhà");

            UserInfo student = fetchUser(studentId);
            UserInfo landlord = fetchUser(landlordId);

            switch (type) {
                case "NEW_BOOKING" -> {
                    // Notify landlord
                    emailService.send(
                        landlord != null ? landlord.getEmail() : null,
                        "Yêu cầu đặt phòng mới — SAF",
                        buildEmail(landlordName,
                            "Bạn có một yêu cầu đặt phòng mới từ <b>" + studentName + "</b>.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Vui lòng đăng nhập vào ứng dụng để xác nhận hoặc từ chối yêu cầu.")
                    );
                }
                case "BOOKING_CONFIRMED" -> {
                    // Notify student
                    emailService.send(
                        student != null ? student.getEmail() : null,
                        "Yêu cầu đặt phòng đã được xác nhận — SAF",
                        buildEmail(studentName,
                            "Yêu cầu đặt phòng của bạn đã được <b>" + landlordName + "</b> xác nhận.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Vui lòng chuẩn bị và đến đúng lịch hẹn.")
                    );
                }
                case "BOOKING_REJECTED" -> {
                    // Notify student
                    emailService.send(
                        student != null ? student.getEmail() : null,
                        "Yêu cầu đặt phòng bị từ chối — SAF",
                        buildEmail(studentName,
                            "Rất tiếc, yêu cầu đặt phòng của bạn đã bị từ chối.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Bạn có thể tìm kiếm các phòng khác phù hợp trên ứng dụng.")
                    );
                }
                case "BOOKING_CANCELLED" -> {
                    // Notify landlord
                    emailService.send(
                        landlord != null ? landlord.getEmail() : null,
                        "Yêu cầu đặt phòng đã bị huỷ — SAF",
                        buildEmail(landlordName,
                            "<b>" + studentName + "</b> đã huỷ yêu cầu đặt phòng.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Phòng sẽ tiếp tục được hiển thị cho các sinh viên khác.")
                    );
                }
                case "BOOKING_COMPLETED" -> {
                    // Notify student
                    emailService.send(
                        student != null ? student.getEmail() : null,
                        "Lịch xem phòng hoàn thành — SAF",
                        buildEmail(studentName,
                            "Lịch xem phòng của bạn đã hoàn thành.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Cảm ơn bạn đã sử dụng SAF. Hãy để lại đánh giá cho phòng trọ nhé!")
                    );
                }
                case "PAYMENT_SUCCESS" -> {
                    // Notify both
                    emailService.send(
                        student != null ? student.getEmail() : null,
                        "Thanh toán thành công — SAF",
                        buildEmail(studentName,
                            "Thanh toán đặt phòng của bạn đã thành công.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Chúc mừng bạn đã thuê được phòng!")
                    );
                    emailService.send(
                        landlord != null ? landlord.getEmail() : null,
                        "Phòng đã được thuê — SAF",
                        buildEmail(landlordName,
                            "<b>" + studentName + "</b> đã hoàn tất thanh toán thuê phòng.",
                            "Phòng: <b>" + roomTitle + "</b>",
                            "Phòng đã chuyển trạng thái sang 'Đã cho thuê'.")
                    );
                }
                default -> log.warn("Unknown notification type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing notification {}: {}", type, e.getMessage());
        }
    }

    private UserInfo fetchUser(Long userId) {
        if (userId == null) return null;
        try {
            return authServiceClient.getUserById(userId).getData();
        } catch (Exception e) {
            log.warn("Could not fetch user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    private String buildEmail(String recipientName, String... lines) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px'>");
        sb.append("<h2 style='color:#1976d2'>SmartAccommodationFinder</h2>");
        sb.append("<p>Xin chào <b>").append(recipientName).append("</b>,</p>");
        for (String line : lines) {
            sb.append("<p>").append(line).append("</p>");
        }
        sb.append("<hr style='border:none;border-top:1px solid #eee'>");
        sb.append("<p style='color:#888;font-size:12px'>Email này được gửi tự động từ hệ thống SAF. Vui lòng không trả lời.</p>");
        sb.append("</div>");
        return sb.toString();
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Long l) return l;
        if (val instanceof Integer i) return i.longValue();
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return null; }
    }
}
