package com.nexora.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_comp_date", columnList = "company_id, order_date"),
    @Index(name = "idx_orders_reg", columnList = "company_id, region"),
    @Index(name = "idx_orders_prod", columnList = "company_id, product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, length = 64)
    private String companyId;

    @Column(name = "dataset_id", nullable = false, length = 64)
    private String datasetId;

    @Column(name = "order_id", nullable = false, length = 64)
    private String orderId;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "customer_id", nullable = false, length = 64)
    private String customerId;

    @Column(name = "product_id", nullable = false, length = 64)
    private String productId;

    @Column(length = 64)
    private String region;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(precision = 5, scale = 4, nullable = false)
    private BigDecimal discount;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal sales;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal profit;

    @Column(name = "order_status", length = 50)
    private String orderStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (orderStatus == null) {
            orderStatus = "Completed";
        }
        if (discount == null) {
            discount = BigDecimal.ZERO;
        }
    }
}
