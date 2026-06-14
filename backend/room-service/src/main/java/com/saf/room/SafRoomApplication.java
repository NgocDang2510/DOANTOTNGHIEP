package com.saf.room;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class SafRoomApplication {
    public static void main(String[] args) {
        SpringApplication.run(SafRoomApplication.class, args);
    }
}
