package com.mandap.repository;

import com.mandap.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBillNumber(String billNumber);

    @Query("SELECT b FROM Bill b JOIN FETCH b.customer JOIN FETCH b.event ORDER BY b.createdAt DESC")
    List<Bill> findAllWithDetails();

    @Query("SELECT b FROM Bill b JOIN FETCH b.customer JOIN FETCH b.event WHERE b.customer.id = :customerId ORDER BY b.createdAt DESC")
    List<Bill> findByCustomerId(Long customerId);

    @Query("SELECT b FROM Bill b JOIN FETCH b.customer JOIN FETCH b.event WHERE b.event.id = :eventId ORDER BY b.billNumber")
    List<Bill> findByEventId(Long eventId);

    @Query("SELECT b FROM Bill b JOIN FETCH b.customer c JOIN FETCH b.event e WHERE e.year = :year ORDER BY b.createdAt DESC")
    List<Bill> findByYear(Integer year);

    @Query("SELECT b FROM Bill b JOIN FETCH b.customer c JOIN FETCH b.event WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR b.billNumber LIKE CONCAT('%', :query, '%')")
    List<Bill> searchByCustomerNameOrBillNumber(String query);

    @Query("SELECT MAX(CAST(SUBSTRING(b.billNumber, LENGTH(:prefix) + 1) AS integer)) FROM Bill b WHERE b.billNumber LIKE CONCAT(:prefix, '%')")
    Integer findMaxBillNumberForPrefix(String prefix);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.event.id = :eventId")
    Long countByEventId(Long eventId);
}
