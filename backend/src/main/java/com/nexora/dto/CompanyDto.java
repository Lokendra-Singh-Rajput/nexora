package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyDto {
    private String id;

    @NotBlank(message = "Company name is required")
    private String name;

    @NotBlank(message = "Industry is required")
    private String industry; // RETAIL, BANKING, MANUFACTURING

    private String description;

    private Long recordCount;
    private Long datasetCount;
    private LocalDateTime createdAt;
}
