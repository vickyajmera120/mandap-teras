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

        populateTotals(items);
        return items;
    }

    public List<com.mandap.dto.InventoryAuditDTO> getInventoryAuditHistory(Long id) {
        org.springframework.data.history.Revisions<Integer, InventoryItem> revisions = inventoryItemRepository
                .findRevisions(id);
        List<com.mandap.dto.InventoryAuditDTO> auditList = new java.util.ArrayList<>();
        InventoryItem previousState = null;

        for (org.springframework.data.history.Revision<Integer, InventoryItem> revision : revisions) {
            InventoryItem currentState = revision.getEntity();
            java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes = new java.util.HashMap<>();

            if (previousState == null) {
                changes.put("Status", new com.mandap.dto.FieldChangeDTO(null, "Item created in inventory"));
            } else {
                findItemChanges(previousState, currentState, changes);
            }

            auditList.add(com.mandap.dto.InventoryAuditDTO.builder()
                    .revisionNumber(revision.getRequiredRevisionNumber())
                    .revisionDate(java.time.LocalDateTime.ofInstant(revision.getRequiredRevisionInstant(),
                            java.time.ZoneId.systemDefault()))
                    .action(previousState == null ? "CREATE" : "UPDATE")
                    .changedBy(((com.mandap.entity.AuditRevisionEntity) revision.getMetadata().getDelegate())
                            .getUsername())
                    .changes(changes)
                    .entity(toDTO(currentState))
                    .build());

            previousState = currentState;
        }

        java.util.Collections.reverse(auditList);
        return auditList;
    }

    private void findItemChanges(InventoryItem oldState, InventoryItem newState,
            java.util.Map<String, com.mandap.dto.FieldChangeDTO> changes) {
        if (!java.util.Objects.equals(oldState.getNameGujarati(), newState.getNameGujarati())) {
            changes.put("Name (Gujarati)",
                    new com.mandap.dto.FieldChangeDTO(oldState.getNameGujarati(), newState.getNameGujarati()));
        }
        if (!java.util.Objects.equals(oldState.getNameEnglish(), newState.getNameEnglish())) {
            changes.put("Name (English)",
                    new com.mandap.dto.FieldChangeDTO(oldState.getNameEnglish(), newState.getNameEnglish()));
        }
        if (!java.util.Objects.equals(oldState.getDefaultRate(), newState.getDefaultRate())) {
            changes.put("Default Rate",
                    new com.mandap.dto.FieldChangeDTO(oldState.getDefaultRate(), newState.getDefaultRate()));
        }
        if (!java.util.Objects.equals(oldState.getCategory(), newState.getCategory())) {
            changes.put("Category", new com.mandap.dto.FieldChangeDTO(
                    oldState.getCategory() != null ? oldState.getCategory().name() : null,
                    newState.getCategory() != null ? newState.getCategory().name() : null));
        }
        if (!java.util.Objects.equals(oldState.getTotalStock(), newState.getTotalStock())) {
            changes.put("Total Stock",
                    new com.mandap.dto.FieldChangeDTO(oldState.getTotalStock(), newState.getTotalStock()));
        }
        if (!java.util.Objects.equals(oldState.getActive(), newState.getActive())) {
            changes.put("Active Status", new com.mandap.dto.FieldChangeDTO(
                    oldState.getActive() ? "Active" : "Inactive",
                    newState.getActive() ? "Active" : "Inactive"));
        }
    }

    private void populateTotals(List<InventoryItemDTO> items) {
        if (items.isEmpty())
            return;

        java.util.Map<Long, Object[]> totalsMap = rentalOrderItemRepository.getInventoryTotals().stream()
                .collect(Collectors.toMap(
                        obj -> (Long) obj[0],
                        obj -> obj));

        items.forEach(item -> {
            Object[] totals = totalsMap.get(item.getId());
            if (totals != null) {
                int booked = ((Number) totals[1]).intValue();
                int dispatched = ((Number) totals[2]).intValue();
                int returned = ((Number) totals[3]).intValue();

                item.setBookedQty(booked);
                item.setDispatchedQty(dispatched);
                item.setReturnedQty(returned);
                item.setPendingReturnQty(dispatched - returned);
                item.setPendingDispatchQty(booked - dispatched);
            } else {
                item.setBookedQty(0);
                item.setDispatchedQty(0);
                item.setReturnedQty(0);
                item.setPendingReturnQty(0);
                item.setPendingDispatchQty(0);
            }
        });
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
        List<InventoryItemDTO> items = inventoryItemRepository.searchByName(query).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        populateTotals(items);
        return items;
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
