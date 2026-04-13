package com.trustpay.backend.service;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    @Value("${aws.s3.bucket:trustpay-proofs}")
    private String bucketName;

    @Value("${aws.access.key:xxxxxxxxxxxxxxxxxxxx}")
    private String accessKey;

    @Value("${aws.secret.key:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}")
    private String secretKey;

    @Value("${aws.region:ap-south-1}")
    private String region;

    private AmazonS3 s3Client;
    private final String LOCAL_STORAGE_DIR = "uploads/";

    @PostConstruct
    public void init() {
        try {
            BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
            s3Client = AmazonS3ClientBuilder.standard()
                    .withCredentials(new AWSStaticCredentialsProvider(credentials))
                    .withRegion(region)
                    .build();
            log.info("S3 client initialized for bucket: {}", bucketName);
        } catch (Exception e) {
            log.warn("S3 initialization failed. Falling back to local storage: {}", e.getMessage());
            File dir = new File(LOCAL_STORAGE_DIR);
            if (!dir.exists()) dir.mkdirs();
        }
    }

    public String uploadFile(MultipartFile file, String subDir) {
        String fileName = subDir + "/" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        
        if (s3Client != null) {
            try {
                ObjectMetadata metadata = new ObjectMetadata();
                metadata.setContentLength(file.getSize());
                metadata.setContentType(file.getContentType());

                s3Client.putObject(new PutObjectRequest(bucketName, fileName, file.getInputStream(), metadata));
                return s3Client.getUrl(bucketName, fileName).toString();
            } catch (IOException e) {
                log.error("S3 upload failed: {}", e.getMessage());
            }
        }
        
        // Fallback to local storage
        try {
            Path path = Paths.get(LOCAL_STORAGE_DIR + fileName);
            Files.createDirectories(path.getParent());
            Files.copy(file.getInputStream(), path);
            return "/api/files/" + fileName;
        } catch (IOException e) {
            log.error("Local upload failed: {}", e.getMessage());
            return null;
        }
    }
}
