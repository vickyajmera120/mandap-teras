package com.mandap.controller;

import com.mandap.dto.RentalOrderDTO;
import com.mandap.dto.RentalOrderItemDTO;
import com.mandap.dto.RentalOrderTransactionDTO;
import com.mandap.service.RentalOrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/rental-orders")
@CrossOrigin(origins = "*")
public class RentalOrderController {

    @Autowired
    private RentalOrderService rentalOrderService;

    @GetMapping
    public ResponseEntity<List<RentalOrderDTO>> getAllOrders() {
        return ResponseEntity.ok(rentalOrderService.getAllOrders());
    }

    @GetMapping("/active")
    public ResponseEntity<List<RentalOrderDTO>> getActiveOrders() {
        return ResponseEntity.ok(rentalOrderService.getActiveOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalOrderDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(rentalOrderService.getOrderById(id));
    }

    @PostMapping
    public ResponseEntity<RentalOrderDTO> createBooking(@RequestBody RentalOrderDTO dto) {
        log.info("Creating booking for customerId={}, items={}", dto.getCustomerId(),
                dto.getItems() != null ? dto.getItems().size() : 0);
        RentalOrderDTO result = rentalOrderService.createBooking(dto);
        log.info("Booking created: orderNumber={}", result.getOrderNumber());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RentalOrderDTO> updateOrder(@PathVariable Long id, @RequestBody RentalOrderDTO dto) {
        log.info("Updating rental order id={}", id);
        return ResponseEntity.ok(rentalOrderService.updateOrder(id, dto));
    }

    @PutMapping("/{id}/dispatch")
    public ResponseEntity<RentalOrderDTO> dispatchItems(
            @PathVariable Long id,
            @RequestBody RentalOrderTransactionDTO transactionDto) {
        log.info("Dispatching items for orderId={}, voucher={}", id, transactionDto.getVoucherNumber());
        RentalOrderDTO result = rentalOrderService.dispatchItems(id, transactionDto);
        log.info("Dispatch complete for orderId={}, newStatus={}", id, result.getStatus());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<RentalOrderDTO> receiveItems(
            @PathVariable Long id,
            @RequestBody RentalOrderTransactionDTO transactionDto) {
        log.info("Receiving items for orderId={}, voucher={}", id, transactionDto.getVoucherNumber());
        RentalOrderDTO result = rentalOrderService.receiveItems(id, transactionDto);
        log.info("Receive complete for orderId={}, newStatus={}", id, result.getStatus());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/customer/{customerId}/unreturned")
    public ResponseEntity<List<RentalOrderItemDTO>> getUnreturnedItemsByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(rentalOrderService.getUnreturnedItemsByCustomer(customerId));
    }

    @GetMapping("/customer/{customerId}/unreturned-orders")
    public ResponseEntity<List<RentalOrderDTO>> getUnreturnedOrdersByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(rentalOrderService.getUnreturnedOrdersByCustomer(customerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        log.warn("Deleting rental order id={}", id);
        rentalOrderService.deleteOrder(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<RentalOrderDTO> cancelOrder(@PathVariable Long id) {
        log.warn("Cancelling rental order id={}", id);
        return ResponseEntity.ok(rentalOrderService.cancelOrder(id));
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<com.mandap.dto.RentalOrderAuditDTO>> getRentalOrderAuditHistory(@PathVariable Long id) {
        return ResponseEntity.ok(rentalOrderService.getRentalOrderAuditHistory(id));
    }
}
