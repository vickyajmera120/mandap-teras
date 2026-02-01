package com.mandap.controller;

import com.mandap.dto.PaymentDTO;
import com.mandap.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        // Assuming userId 1 for now or passed via header
        Long userId = 1L;
        return ResponseEntity.ok(billService.addPayment(paymentDTO, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO paymentDTO) {
        return ResponseEntity.ok(billService.updatePayment(id, paymentDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        billService.deletePayment(id);
        return ResponseEntity.ok().build();
    }
}
