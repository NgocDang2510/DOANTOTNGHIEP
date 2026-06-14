package com.saf.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class SafNotificationApplication {
    public static void main(String[] args) {
        SpringApplication.run(SafNotificationApplication.class, args);
    }
}
