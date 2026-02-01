package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    public enum BillType {
        ESTIMATE,
        INVOICE
    }

    public enum PaymentStatus {
        DUE,
        PAID,
        PARTIAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_number", unique = true, nullable = false, length = 20)
    private String billNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "pal_numbers", length = 50)
    @Builder.Default
    private String palNumbers = "1";

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_type", length = 10)
    @Builder.Default
    private BillType billType = BillType.INVOICE;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 10)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.DUE;

    @Column(name = "total_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deposit = BigDecimal.ZERO;

    @Column(name = "net_payable", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netPayable = BigDecimal.ZERO;

    @Column(name = "bill_date", nullable = false)
    private LocalDate billDate;

    @Column(length = 500)
    private String remarks;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BillItem> items = new ArrayList<>();

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

    public void addItem(BillItem item) {
        items.add(item);
        item.setBill(this);
    }

    public void removeItem(BillItem item) {
        items.remove(item);
        item.setBill(null);
    }

    public void calculateTotals() {
        this.totalAmount = items.stream()
                .map(BillItem::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.netPayable = this.totalAmount.subtract(this.deposit != null ? this.deposit : BigDecimal.ZERO);
    }
}
