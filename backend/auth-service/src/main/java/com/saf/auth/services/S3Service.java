package com.saf.auth.services;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    @Value("${aws.access-key:}") private String accessKey;
    @Value("${aws.secret-key:}") private String secretKey;
    @Value("${aws.s3.region:ap-southeast-1}") private String region;
    @Value("${aws.s3.bucket:}") private String bucketName;
    @Value("${app.upload.base-url:http://localhost:8081}") private String baseUrl;
    @Value("${app.upload.dir:uploads}") private String uploadDir;

    private S3Client s3Client;
    private boolean useLocal = false;

    @PostConstruct
    public void init() {
        if (!accessKey.isEmpty() && !secretKey.isEmpty()) {
            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
            log.info("S3Service: using AWS S3 bucket={}", bucketName);
        } else {
            useLocal = true;
            log.info("S3Service: using local storage at ./{}", uploadDir);
            try { Files.createDirectories(Paths.get(uploadDir)); } catch (IOException e) { log.warn("Could not create upload dir", e); }
        }
    }

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file.isEmpty()) throw new RuntimeException("File rỗng");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) throw new RuntimeException("Chỉ chấp nhận file ảnh");
        if (useLocal) return saveLocally(file, folder);

        String key = buildKey(file, folder);
        s3Client.putObject(PutObjectRequest.builder().bucket(bucketName).key(key).contentType(contentType).build(),
                RequestBody.fromBytes(file.getBytes()));
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    private String saveLocally(MultipartFile file, String folder) throws IOException {
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) ext = original.substring(original.lastIndexOf("."));
        String filename = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, folder);
        Files.createDirectories(dir);
        Files.write(dir.resolve(filename), file.getBytes());
        return baseUrl + "/uploads/" + folder + "/" + filename;
    }

    private String buildKey(MultipartFile file, String folder) {
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) ext = original.substring(original.lastIndexOf("."));
        return folder + "/" + UUID.randomUUID() + ext;
    }
}
