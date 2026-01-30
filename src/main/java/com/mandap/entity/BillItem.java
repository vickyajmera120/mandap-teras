package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal rate;

    @Column(precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @PrePersist
    @PreUpdate
    protected void calculateTotal() {
        if (quantity != null && rate != null) {
            this.total = rate.multiply(BigDecimal.valueOf(quantity));
        }
    }
}
