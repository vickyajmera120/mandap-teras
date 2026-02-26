package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    public enum ItemCategory {
        MANDAP,
        FURNITURE,
        BEDDING,
        KITCHEN,
        UTENSILS,
        DECORATION,
        MISCELLANEOUS
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_gujarati", nullable = false, length = 200)
    private String nameGujarati;

    @Column(name = "name_english", length = 200)
    private String nameEnglish;

    @Column(name = "default_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal defaultRate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ItemCategory category;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "total_stock", nullable = false)
    @Builder.Default
    private Integer totalStock = 0;

    @Column(name = "available_stock", nullable = false)
    @Builder.Default
    private Integer availableStock = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
