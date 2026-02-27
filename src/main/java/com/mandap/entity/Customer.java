package com.mandap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@org.hibernate.envers.Audited
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 15)
    private String mobile;

    @ElementCollection
    @CollectionTable(name = "customer_pal_numbers", joinColumns = @JoinColumn(name = "customer_id"), uniqueConstraints = @UniqueConstraint(columnNames = "pal_number"))
    @Column(name = "pal_number")
    @Builder.Default
    private Set<String> palNumbers = new HashSet<>();

    @Column(name = "alternate_contact", length = 15)
    private String alternateContact;

    @Column(length = 500)
    private String address;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
