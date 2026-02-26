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
        List<InventoryItemDTO> items = inventoryItemRepository.findAllOrdered().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        // Populate pending dispatch quantities efficienty
        java.util.Map<Long, Integer> pendingMap = rentalOrderItemRepository.getPendingDispatchQuantities().stream()
                .collect(Collectors.toMap(
                        obj -> (Long) obj[0],
                        obj -> ((Number) obj[1]).intValue()));

        items.forEach(item -> {
            item.setPendingDispatchQty(pendingMap.getOrDefault(item.getId(), 0));
        });

        return items;
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
            int oldTotal = item.getTotalStock();
            int newTotal = dto.getTotalStock();
            int delta = newTotal - oldTotal;

            item.setTotalStock(newTotal);
            // Adjust available stock by the change in total stock
            item.setAvailableStock(item.getAvailableStock() + delta);
        }
        // Do not update available stock directly from DTO

        item = inventoryItemRepository.save(item);
        return toDTO(item);
    }

    public InventoryItemDTO createItem(InventoryItemDTO dto) {
        int totalStock = dto.getTotalStock() != null ? dto.getTotalStock() : 0;

        // Set display order to max + 1 so new items appear at the end
        int maxOrder = inventoryItemRepository.findMaxDisplayOrder();

        InventoryItem item = InventoryItem.builder()
                .nameGujarati(dto.getNameGujarati())
                .nameEnglish(dto.getNameEnglish())
                .defaultRate(dto.getDefaultRate())
                .active(true)
                .displayOrder(maxOrder + 1)
                .totalStock(totalStock)
                .availableStock(totalStock)
                .build();

        // Handle category
        if (dto.getCategory() != null) {
            try {
                item.setCategory(InventoryItem.ItemCategory.valueOf(dto.getCategory()));
            } catch (IllegalArgumentException e) {
                item.setCategory(InventoryItem.ItemCategory.MANDAP);
            }
        } else {
            item.setCategory(InventoryItem.ItemCategory.MANDAP);
        }

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
                        .pendingDispatchQty(
                                item.getBookedQty() - (item.getDispatchedQty() != null ? item.getDispatchedQty() : 0))
                        .pendingReturnQty((item.getDispatchedQty() != null ? item.getDispatchedQty() : 0)
                                - (item.getReturnedQty() != null ? item.getReturnedQty() : 0))
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
