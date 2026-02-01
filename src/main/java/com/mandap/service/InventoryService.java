package com.mandap.service;

import com.mandap.dto.InventoryItemDTO;
import com.mandap.entity.InventoryItem;
import com.mandap.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public List<InventoryItemDTO> getAllItems() {
        return inventoryItemRepository.findAllOrdered().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<InventoryItemDTO> getItemsBySide(String side) {
        InventoryItem.ItemSide itemSide = InventoryItem.ItemSide.valueOf(side);
        return inventoryItemRepository.findBySide(itemSide).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public InventoryItemDTO getItemById(Long id) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found: " + id));
        return toDTO(item);
    }

    public InventoryItemDTO updateItem(Long id, InventoryItemDTO dto) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found: " + id));

        if (dto.getNameEnglish() != null) {
            item.setNameEnglish(dto.getNameEnglish());
        }
        if (dto.getDefaultRate() != null) {
            item.setDefaultRate(dto.getDefaultRate());
        }
        if (dto.getActive() != null) {
            item.setActive(dto.getActive());
        }
        if (dto.getTotalStock() != null) {
            item.setTotalStock(dto.getTotalStock());
        }
        if (dto.getAvailableStock() != null) {
            item.setAvailableStock(dto.getAvailableStock());
        }

        item = inventoryItemRepository.save(item);
        return toDTO(item);
    }

    public InventoryItemDTO createItem(InventoryItemDTO dto) {
        InventoryItem item = InventoryItem.builder()
                .nameGujarati(dto.getNameGujarati())
                .nameEnglish(dto.getNameEnglish())
                .defaultRate(dto.getDefaultRate())
                .active(true) // Default to active
                .displayOrder(0) // Default order, will be fixed by drag-drop or reorder
                .totalStock(dto.getTotalStock() != null ? dto.getTotalStock() : 0)
                .availableStock(dto.getAvailableStock() != null ? dto.getAvailableStock() : 0)
                .build();

        // Handle enums if present, or set defaults
        if (dto.getCategory() != null) {
            try {
                item.setCategory(InventoryItem.ItemCategory.valueOf(dto.getCategory()));
            } catch (IllegalArgumentException e) {
                // Ignore or default
            }
        } else {
            item.setCategory(InventoryItem.ItemCategory.MANDAP); // Default category
        }

        // Side is deprecated but might be required by DB constraint? No, nullable in
        // code but maybe not in DB.
        // Let's check entity. Side is @Column(length=10) but not nullable=false in
        // annotation?
        // Wait, entity def says:
        // @Enumerated(EnumType.STRING)
        // @Column(length = 10)
        // private ItemSide side;
        // The DDL might differ. Best to set a default if null.
        if (dto.getSide() != null) {
            try {
                item.setSide(InventoryItem.ItemSide.valueOf(dto.getSide()));
            } catch (IllegalArgumentException e) {
                item.setSide(InventoryItem.ItemSide.LEFT);
            }
        } else {
            item.setSide(InventoryItem.ItemSide.LEFT); // Default side
        }

        // Set display order to max + 1?
        // For now 0 is fine, user can drag it. Or better, fetch max order.
        // Let's just save.

        item = inventoryItemRepository.save(item);
        return toDTO(item);
    }

    private InventoryItemDTO toDTO(InventoryItem item) {
        return InventoryItemDTO.builder()
                .id(item.getId())
                .nameGujarati(item.getNameGujarati())
                .nameEnglish(item.getNameEnglish())
                .defaultRate(item.getDefaultRate())
                .category(item.getCategory() != null ? item.getCategory().name() : null)
                .side(item.getSide() != null ? item.getSide().name() : null)
                .displayOrder(item.getDisplayOrder())
                .active(item.getActive())
                .totalStock(item.getTotalStock())
                .availableStock(item.getAvailableStock())
                .build();
    }

    public List<InventoryItemDTO> searchItems(String query) {
        return inventoryItemRepository.searchByName(query).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Autowired
    private com.mandap.repository.RentalOrderItemRepository rentalOrderItemRepository;

    public List<com.mandap.dto.ItemUsageDTO> getItemUsage(Long itemId) {
        return rentalOrderItemRepository.findActiveUsageByInventoryItem(itemId).stream()
                .map(item -> com.mandap.dto.ItemUsageDTO.builder()
                        .customerId(item.getRentalOrder().getCustomer().getId())
                        .customerName(item.getRentalOrder().getCustomer().getName())
                        .orderNumber(item.getRentalOrder().getOrderNumber())
                        .bookedQty(item.getBookedQty())
                        .dispatchedQty(item.getDispatchedQty() != null ? item.getDispatchedQty() : 0)
                        .returnedQty(item.getReturnedQty() != null ? item.getReturnedQty() : 0)
                        .outstandingQty(item.getOutstandingQty() != null ? item.getOutstandingQty() : 0)
                        .build())
                .collect(Collectors.toList());
    }

    public void reorderItems(List<Long> itemIds) {
        for (int i = 0; i < itemIds.size(); i++) {
            Long itemId = itemIds.get(i);
            InventoryItem item = inventoryItemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Item not found: " + itemId));
            item.setDisplayOrder(i);
            inventoryItemRepository.save(item);
        }
    }
}
