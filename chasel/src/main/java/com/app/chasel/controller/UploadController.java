package com.app.chasel.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final Path uploadDirectory =
            Paths.get("uploads").toAbsolutePath().normalize();

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> uploadImages(
            @RequestParam("files") List<MultipartFile> files
    ) throws IOException {

        if (files.size() > 5) {
            throw new RuntimeException("Maximum 5 files allowed");
        }

        Files.createDirectories(uploadDirectory);

        List<String> imageUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.getContentType() == null ||
                    (!file.getContentType().startsWith("image/") && !file.getContentType().startsWith("video/"))) {
                throw new RuntimeException("Only image and video files are allowed");
            }
            if (file.getSize() > 25L * 1024 * 1024) throw new RuntimeException("Each file must be 25 MB or smaller");

            String originalName = file.getOriginalFilename();
            String extension = "";

            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(
                        originalName.lastIndexOf(".")
                );
            }

            String fileName = UUID.randomUUID() + extension;
            Path destination = uploadDirectory.resolve(fileName);

            file.transferTo(destination);

            String imageUrl = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();

            imageUrls.add(imageUrl);
        }

        return imageUrls;
    }
}
