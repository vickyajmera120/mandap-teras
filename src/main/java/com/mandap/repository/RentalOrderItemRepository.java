package com.mandap.repository;

import com.mandap.entity.RentalOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalOrderItemRepository extends JpaRepository<RentalOrderItem, Long> {

    List<RentalOrderItem> findByRentalOrderId(Long rentalOrderId);

    @Query("SELECT roi FROM RentalOrderItem roi WHERE roi.rentalOrder.customer.id = :customerId AND roi.dispatchedQty > roi.returnedQty")
    List<RentalOrderItem> findUnreturnedItemsByCustomer(Long customerId);

    @Query("SELECT roi FROM RentalOrderItem roi WHERE roi.inventoryItem.id = :inventoryItemId AND roi.rentalOrder.status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY roi.rentalOrder.orderDate DESC")
    List<RentalOrderItem> findActiveUsageByInventoryItem(Long inventoryItemId);

    @Query("SELECT roi.inventoryItem.id, SUM(roi.bookedQty - COALESCE(roi.dispatchedQty, 0)) " +
            "FROM RentalOrderItem roi " +
            "WHERE roi.rentalOrder.status NOT IN ('CANCELLED', 'COMPLETED') " +
            "GROUP BY roi.inventoryItem.id")
    List<Object[]> getPendingDispatchQuantities();
}
