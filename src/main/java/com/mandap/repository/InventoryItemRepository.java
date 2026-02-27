package com.mandap.repository;

import com.mandap.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.repository.history.RevisionRepository;

@Repository
public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, Long>, RevisionRepository<InventoryItem, Long, Integer> {

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true ORDER BY i.displayOrder")
    List<InventoryItem> findAllActiveOrdered();

    @Query("SELECT i FROM InventoryItem i ORDER BY i.displayOrder")
    List<InventoryItem> findAllOrdered();

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true AND i.category = :category ORDER BY i.displayOrder")
    List<InventoryItem> findByCategory(InventoryItem.ItemCategory category);

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true AND (LOWER(i.nameEnglish) LIKE LOWER(CONCAT('%', :query, '%')) OR i.nameGujarati LIKE CONCAT('%', :query, '%')) ORDER BY i.displayOrder")
    List<InventoryItem> searchByName(String query);

    @Query("SELECT COALESCE(MAX(i.displayOrder), 0) FROM InventoryItem i")
    Integer findMaxDisplayOrder();
}
