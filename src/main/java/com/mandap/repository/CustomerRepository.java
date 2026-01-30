package com.mandap.repository;

import com.mandap.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE c.active = true ORDER BY c.name")
    List<Customer> findAllActive();

    @Query("SELECT c FROM Customer c WHERE c.active = true AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR c.mobile LIKE CONCAT('%', :query, '%'))")
    List<Customer> searchByNameOrMobile(String query);

    List<Customer> findByMobile(String mobile);

    boolean existsByMobile(String mobile);
}
