package com.mandap.controller;

import com.mandap.dto.InventoryItemDTO;
import com.mandap.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return ResponseEntity.ok(inventoryService.createItem(dto));
    }

    @GetMapping("/side/{side}")
    public ResponseEntity<List<InventoryItemDTO>> getItemsBySide(@PathVariable String side) {
        return ResponseEntity.ok(inventoryService.getItemsBySide(side));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getItemById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> updateItem(@PathVariable Long id, @RequestBody InventoryItemDTO dto) {
        return ResponseEntity.ok(inventoryService.updateItem(id, dto));
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderItems(@RequestBody List<Long> itemIds) {
        inventoryService.reorderItems(itemIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<InventoryItemDTO>> searchItems(@RequestParam("q") String query) {
        return ResponseEntity.ok(inventoryService.searchItems(query));
    }
}
