package com.nexora.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_transactions", indexes = {
    @Index(name = "idx_bt_comp_date", columnList = "company_id, transaction_date"),
    @Index(name = "idx_bt_comp_channel", columnList = "company_id, channel"),
    @Index(name = "idx_bt_comp_type", columnList = "company_id, transaction_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, length = 64)
    private String companyId;

    @Column(name = "dataset_id", nullable = false, length = 64)
    private String datasetId;

    @Column(name = "transaction_id", nullable = false, length = 64)
    private String transactionId;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "account_id", length = 64)
    private String accountId;

    @Column(name = "customer_id", length = 64)
    private String customerId;

    @Column(name = "transaction_type", length = 64)
    private String transactionType; // Transfer, Wire, POS Payment, Deposit, Withdrawal, Loan Disbursement

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "is_fraud", nullable = false)
    @Builder.Default
    private Boolean isFraud = false;

    @Column(name = "risk_score", precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal riskScore = BigDecimal.ZERO;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(length = 50)
    private String status; // Approved, Settled, Flagged, In Review, Defaulted

    @Column(length = 50)
    private String channel; // Online, Mobile, ATM, Branch, POS

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
