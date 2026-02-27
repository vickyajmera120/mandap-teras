package com.mandap.controller;

import com.mandap.dto.InventoryItemDTO;
import com.mandap.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryItemDTO>> getAllItems() {
        return ResponseEntity.ok(inventoryService.getAllItems());
    }

    @PostMapping
    public ResponseEntity<InventoryItemDTO> createItem(@RequestBody InventoryItemDTO dto) {
        log.info("Creating inventory item: nameEn={}, nameGu={}", dto.getNameEnglish(), dto.getNameGujarati());
        InventoryItemDTO result = inventoryService.createItem(dto);
        log.info("Inventory item created: id={}", result.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getItemById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> updateItem(@PathVariable Long id, @RequestBody InventoryItemDTO dto) {
        log.info("Updating inventory item id={}", id);
        return ResponseEntity.ok(inventoryService.updateItem(id, dto));
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderItems(@RequestBody List<Long> itemIds) {
        log.info("Reordering {} inventory items", itemIds.size());
        inventoryService.reorderItems(itemIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<InventoryItemDTO>> searchItems(@RequestParam("q") String query) {
        return ResponseEntity.ok(inventoryService.searchItems(query));
    }

    @GetMapping("/{id}/usage")
    public ResponseEntity<List<com.mandap.dto.ItemUsageDTO>> getItemUsage(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getItemUsage(id));
    }
}
