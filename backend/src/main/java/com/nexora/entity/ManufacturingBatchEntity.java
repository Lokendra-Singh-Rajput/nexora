package com.nexora.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "manufacturing_batches", indexes = {
    @Index(name = "idx_mb_comp_date", columnList = "company_id, production_date"),
    @Index(name = "idx_mb_comp_center", columnList = "company_id, work_center"),
    @Index(name = "idx_mb_comp_prod", columnList = "company_id, product_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManufacturingBatchEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, length = 64)
    private String companyId;

    @Column(name = "dataset_id", nullable = false, length = 64)
    private String datasetId;

    @Column(name = "batch_id", nullable = false, length = 64)
    private String batchId;

    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @Column(name = "work_center", length = 100)
    private String workCenter; // Assembly Line 1, CNC Mill 4, Injection Molding 2, Packaging Line

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Column(name = "planned_quantity", nullable = false)
    private Integer plannedQuantity;

    @Column(name = "produced_quantity", nullable = false)
    private Integer producedQuantity;

    @Column(name = "defective_quantity", nullable = false)
    @Builder.Default
    private Integer defectiveQuantity = 0;

    @Column(name = "downtime_minutes", nullable = false)
    @Builder.Default
    private Integer downtimeMinutes = 0;

    @Column(name = "operating_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal operatingHours = BigDecimal.valueOf(8.0);

    @Column(name = "efficiency_pct", precision = 6, scale = 2)
    private BigDecimal efficiencyPct;

    @Column(length = 50)
    private String shift; // Morning, Afternoon, Night

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
