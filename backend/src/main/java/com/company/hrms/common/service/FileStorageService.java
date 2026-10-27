package com.company.hrms.common.service;

import com.company.hrms.common.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    @Value("${app.upload.dir:uploads}")
    private String baseUploadDir;

    public String storeAvatar(Long employeeId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("BAD_REQUEST", "Vui lòng chọn tập tin ảnh để tải lên", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("BAD_REQUEST", "Kích thước ảnh tối đa cho phép là 5MB", HttpStatus.BAD_REQUEST);
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException("BAD_REQUEST", "Định dạng ảnh không được hỗ trợ. Vui lòng tải ảnh .jpg, .jpeg, .png hoặc .webp", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("BAD_REQUEST", "Kiểu nội dung tập tin không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        try {
            Path targetDir = Paths.get(baseUploadDir, "avatars").toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String uniqueFilename = String.format("avatar_emp_%d_%d_%s%s",
                    employeeId,
                    System.currentTimeMillis(),
                    UUID.randomUUID().toString().substring(0, 8),
                    extension
            );

            Path targetPath = targetDir.resolve(uniqueFilename);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("[FileStorageService] Lưu thành công ảnh đại diện cho nhân viên {}: {}", employeeId, uniqueFilename);
            return "/uploads/avatars/" + uniqueFilename;
        } catch (IOException e) {
            log.error("[FileStorageService] Lỗi khi lưu tập tin ảnh", e);
            throw new BusinessException("INTERNAL_ERROR", "Không thể lưu tập tin tải lên: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
