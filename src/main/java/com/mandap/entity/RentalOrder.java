package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a rental order (booking) in the Mandap rental business.
 * Tracks the lifecycle: BOOKED → DISPATCHED → PARTIALLY_RETURNED → RETURNED →
 * COMPLETED
 */
@Entity
@Table(name = "rental_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@org.hibernate.envers.Audited
public class RentalOrder {

    public enum RentalOrderStatus {
        BOOKED, // Items reserved, not yet dispatched
        DISPATCHED, // Items given to customer
        PARTIALLY_RETURNED, // Some items returned
        RETURNED, // All items returned
        COMPLETED, // Bill generated, order closed
        CANCELLED // Order cancelled
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false, length = 20)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @org.hibernate.envers.Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    private Customer customer;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "dispatch_date")
    private LocalDate dispatchDate;

    @Column(name = "expected_return_date")
    private LocalDate expectedReturnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RentalOrderStatus status = RentalOrderStatus.BOOKED;

    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RentalOrderItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    @org.hibernate.envers.Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    private Bill bill;

    @Column(name = "bill_out_of_sync")
    @Builder.Default
    private boolean billOutOfSync = false;

    @Column(length = 500)
    private String remarks;

    @Column(name = "created_by")
    private Long createdBy;

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

    public void addItem(RentalOrderItem item) {
        items.add(item);
        item.setRentalOrder(this);
    }

    public void removeItem(RentalOrderItem item) {
        items.remove(item);
        item.setRentalOrder(null);
    }
}
