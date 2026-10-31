package com.nexora.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, length = 64)
    private String companyId;

    @Column(name = "dataset_id", nullable = false, length = 64)
    private String datasetId;

    @Column(name = "campaign_id", nullable = false, length = 64)
    private String campaignId;

    @Column(name = "campaign_name", nullable = false)
    private String campaignName;

    @Column(name = "marketing_spend", precision = 12, scale = 2, nullable = false)
    private BigDecimal marketingSpend;

    @Column(name = "campaign_revenue", precision = 12, scale = 2, nullable = false)
    private BigDecimal campaignRevenue;

    @Column(name = "campaign_date")
    private LocalDate campaignDate;

    @Column(length = 64)
    private String channel;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
