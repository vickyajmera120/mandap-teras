package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a transaction (Dispatch or Return) for a Rental Order.
 * Captures the voucher number, vehicle number, and the items involved in this
 * specific chunk.
 */
@Entity
@Table(name = "rental_order_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalOrderTransaction {

    public enum TransactionType {
        DISPATCH,
        RETURN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    private RentalOrder rentalOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "voucher_number", length = 50)
    private String voucherNumber;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RentalOrderTransactionItem> items = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void addItem(RentalOrderTransactionItem item) {
        items.add(item);
        item.setTransaction(this);
    }
}
