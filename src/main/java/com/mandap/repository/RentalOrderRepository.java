package com.mandap.repository;

import com.mandap.entity.RentalOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalOrderRepository extends JpaRepository<RentalOrder, Long> {

    Optional<RentalOrder> findByOrderNumber(String orderNumber);

    List<RentalOrder> findByCustomerIdOrderByOrderDateDesc(Long customerId);

    List<RentalOrder> findByStatusOrderByOrderDateDesc(RentalOrder.RentalOrderStatus status);

    @Query("SELECT ro FROM RentalOrder ro WHERE ro.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY ro.orderDate DESC")
    List<RentalOrder> findActiveOrders();

    @Query("SELECT ro FROM RentalOrder ro WHERE ro.customer.id = :customerId AND ro.status IN ('DISPATCHED', 'PARTIALLY_RETURNED')")
    List<RentalOrder> findUnreturnedOrdersByCustomer(Long customerId);

    // Fetch the latest order number for the current year prefix to generate the
    // next number safely in Java
    Optional<RentalOrder> findFirstByOrderNumberStartingWithOrderByIdDesc(String prefix);
}
