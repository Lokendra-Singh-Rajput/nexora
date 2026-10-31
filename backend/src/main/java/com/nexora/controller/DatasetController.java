package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.dto.UploadResponseDto;
import com.nexora.entity.Dataset;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.DatasetRepository;
import com.nexora.service.DataIngestionService;
import com.nexora.service.DemoDataInitializationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/datasets")
@RequiredArgsConstructor
@Tag(name = "Data Management", description = "Endpoints for file upload, column mapping, dataset versioning and reset")
public class DatasetController {

    private final DataIngestionService dataIngestionService;
    private final DatasetRepository datasetRepository;
    private final DemoDataInitializationService demoDataInitializationService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and ingest business dataset (CSV or Excel)")
    public ApiResponse<UploadResponseDto> uploadDataset(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "companyId", defaultValue = "novamart") String companyId,
            @RequestParam(value = "replaceExisting", defaultValue = "false") boolean replaceExisting) {
        UploadResponseDto result = dataIngestionService.ingestFile(companyId, file, replaceExisting);
        return ApiResponse.success("Dataset ingested and validated successfully", result);
    }

    @GetMapping
    @Operation(summary = "List all datasets for a company")
    public ApiResponse<List<Dataset>> listDatasets(
            @RequestParam(value = "companyId", defaultValue = "novamart") String companyId) {
        return ApiResponse.success(datasetRepository.findByCompanyIdOrderByCreatedAtDesc(companyId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get dataset details by ID")
    public ApiResponse<Dataset> getDataset(@PathVariable String id) {
        Dataset ds = datasetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found: " + id));
        return ApiResponse.success(ds);
    }

    @PostMapping("/reset-demo")
    @Operation(summary = "Reset company dataset to pristine NovaMart synthetic benchmark")
    public ApiResponse<String> resetDemoData() {
        demoDataInitializationService.resetDemoData();
        return ApiResponse.success("Demo dataset reset successfully to baseline state.", "RESET_SUCCESS");
    }
}
