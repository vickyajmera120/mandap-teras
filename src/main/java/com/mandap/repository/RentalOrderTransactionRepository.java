package com.mandap.repository;

import com.mandap.entity.RentalOrderTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalOrderTransactionRepository extends JpaRepository<RentalOrderTransaction, Long> {
    List<RentalOrderTransaction> findByRentalOrderIdOrderByTransactionDateDesc(Long rentalOrderId);
}
