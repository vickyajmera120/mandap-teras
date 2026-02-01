package com.mandap.controller;

import com.mandap.dto.RentalOrderDTO;
import com.mandap.dto.RentalOrderItemDTO;
import com.mandap.service.RentalOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rental-orders")
@CrossOrigin(origins = "*")
public class RentalOrderController {

    @Autowired
    private RentalOrderService rentalOrderService;

    /**
     * Get all rental orders.
     */
    @GetMapping
    public ResponseEntity<List<RentalOrderDTO>> getAllOrders() {
        return ResponseEntity.ok(rentalOrderService.getAllOrders());
    }

    /**
     * Get active (non-completed, non-cancelled) orders.
     */
    @GetMapping("/active")
    public ResponseEntity<List<RentalOrderDTO>> getActiveOrders() {
        return ResponseEntity.ok(rentalOrderService.getActiveOrders());
    }

    /**
     * Get order by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<RentalOrderDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(rentalOrderService.getOrderById(id));
    }

    /**
     * Create a new booking (rental order).
     */
    @PostMapping
    public ResponseEntity<RentalOrderDTO> createBooking(@RequestBody RentalOrderDTO dto) {
        return ResponseEntity.ok(rentalOrderService.createBooking(dto));
    }

    /**
     * Update an existing rental order.
     */
    @PutMapping("/{id}")
    public ResponseEntity<RentalOrderDTO> updateOrder(@PathVariable Long id, @RequestBody RentalOrderDTO dto) {
        return ResponseEntity.ok(rentalOrderService.updateOrder(id, dto));
    }

    /**
     * Dispatch items for an order.
     */
    @PutMapping("/{id}/dispatch")
    public ResponseEntity<RentalOrderDTO> dispatchItems(
            @PathVariable Long id,
            @RequestBody List<RentalOrderItemDTO> items) {
        return ResponseEntity.ok(rentalOrderService.dispatchItems(id, items));
    }

    /**
     * Receive (return) items from customer.
     */
    @PutMapping("/{id}/receive")
    public ResponseEntity<RentalOrderDTO> receiveItems(
            @PathVariable Long id,
            @RequestBody List<RentalOrderItemDTO> items) {
        return ResponseEntity.ok(rentalOrderService.receiveItems(id, items));
    }

    /**
     * Get unreturned items for a specific customer (for billing warning).
     */
    @GetMapping("/customer/{customerId}/unreturned")
    public ResponseEntity<List<RentalOrderItemDTO>> getUnreturnedItemsByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(rentalOrderService.getUnreturnedItemsByCustomer(customerId));
    }

    /**
     * Get orders with unreturned items for a customer.
     */
    @GetMapping("/customer/{customerId}/unreturned-orders")
    public ResponseEntity<List<RentalOrderDTO>> getUnreturnedOrdersByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(rentalOrderService.getUnreturnedOrdersByCustomer(customerId));
    }

    /**
     * Delete a rental order.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        rentalOrderService.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}
