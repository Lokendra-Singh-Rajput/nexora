package com.nexora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponseDto {
    private String datasetId;
    private String filename;
    private int rowsProcessed;
    private BigDecimal qualityScore;
    private String validationStatus;
    private int version;
    private Object qualityReport;
    private Map<String, String> columnMapping;
}
