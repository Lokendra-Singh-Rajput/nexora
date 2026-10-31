package com.nexora.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "datasets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dataset {
    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "company_id", nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false)
    private String filename;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "validation_status", length = 50)
    private String validationStatus;

    @Column(name = "quality_score", precision = 5, scale = 2)
    private BigDecimal qualityScore;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 1;
        }
        if (validationStatus == null) {
            validationStatus = "VALIDATED";
        }
    }
}
