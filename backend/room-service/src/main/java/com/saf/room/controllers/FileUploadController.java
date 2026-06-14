package com.saf.room.controllers;

import com.saf.room.dtos.ApiResponse;
import com.saf.room.services.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final S3Service s3Service;

    @PostMapping(value = "/room", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> uploadRoomImage(@RequestParam("file") MultipartFile file) {
        try {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/"))
                return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ chấp nhận file ảnh!"));
            String url = s3Service.uploadFile(file, "rooms");
            return ResponseEntity.ok(ApiResponse.success("Upload ảnh phòng thành công", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload ảnh phòng thất bại: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/rooms", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> uploadRoomImages(@RequestParam("files") MultipartFile[] files) {
        try {
            if (files.length > 10) return ResponseEntity.badRequest().body(ApiResponse.error("Tối đa 10 ảnh mỗi lần upload!"));
            List<String> urls = new ArrayList<>();
            for (MultipartFile file : files) {
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/"))
                    return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ chấp nhận file ảnh!"));
                urls.add(s3Service.uploadFile(file, "rooms"));
            }
            return ResponseEntity.ok(ApiResponse.success("Upload ảnh phòng thành công", Map.of("urls", urls)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload ảnh phòng thất bại: " + e.getMessage()));
        }
    }
}
