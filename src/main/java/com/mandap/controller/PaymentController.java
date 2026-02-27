package com.mandap.controller;

import com.mandap.dto.PaymentDTO;
import com.mandap.service.BillService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private BillService billService;

    @GetMapping("/bill/{billId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByBillId(@PathVariable Long billId) {
        return ResponseEntity.ok(billService.getPaymentsByBillId(billId));
    }

    @PostMapping
    public ResponseEntity<PaymentDTO> addPayment(@RequestBody PaymentDTO paymentDTO) {
        log.info("Adding payment: billId={}, amount={}, method={}", paymentDTO.getBillId(),
                paymentDTO.getAmount(), paymentDTO.getPaymentMethod());
        // Assuming userId 1 for now or passed via header
        Long userId = 1L;
        PaymentDTO result = billService.addPayment(paymentDTO, userId);
        log.info("Payment added: id={}, billId={}", result.getId(), result.getBillId());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO paymentDTO) {
        log.info("Updating payment id={}", id);
        return ResponseEntity.ok(billService.updatePayment(id, paymentDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        log.warn("Deleting payment id={}", id);
        billService.deletePayment(id);
        return ResponseEntity.ok().build();
    }
}
