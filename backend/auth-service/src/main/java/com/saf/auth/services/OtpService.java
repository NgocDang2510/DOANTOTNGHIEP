package com.saf.auth.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final JavaMailSender mailSender;
    private final ConcurrentHashMap<String, String> otpStorage = new ConcurrentHashMap<>();

    public String generateAndSendOtp(String phone, String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(phone, otp);
        log.info("OTP for {}: {}", phone, otp);

        if (email != null && !email.isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Mã xác thực OTP - Smart Accommodation Finder");
                message.setText("Mã OTP của bạn là: " + otp + "\n\nMã có hiệu lực trong 5 phút.");
                mailSender.send(message);
            } catch (Exception e) {
                log.error("Lỗi gửi email OTP: {}", e.getMessage());
            }
        }
        return otp;
    }

    public boolean verifyOtp(String phone, String otpInput) {
        String stored = otpStorage.get(phone);
        if (stored != null && stored.equals(otpInput)) {
            otpStorage.remove(phone);
            return true;
        }
        return false;
    }
}
