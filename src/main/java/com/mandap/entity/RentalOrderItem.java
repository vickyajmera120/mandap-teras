package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing an individual item within a rental order.
 * Tracks booked, dispatched, and returned quantities for each inventory item.
 */
@Entity
@Table(name = "rental_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@org.hibernate.envers.Audited
public class RentalOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    private RentalOrder rentalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    @org.hibernate.envers.Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    private InventoryItem inventoryItem;

    @Column(name = "booked_qty", nullable = false)
    private Integer bookedQty;

    @Column(name = "dispatched_qty")
    @Builder.Default
    private Integer dispatchedQty = 0;

    @Column(name = "returned_qty")
    @Builder.Default
    private Integer returnedQty = 0;

    @Column(name = "dispatch_date")
    private LocalDate dispatchDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

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

    /**
     * Returns the quantity that has been dispatched but not yet returned.
     */
    public Integer getOutstandingQty() {
        return dispatchedQty - returnedQty;
    }
}
