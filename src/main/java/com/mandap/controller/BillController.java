package com.mandap.controller;

import com.mandap.dto.ApiResponse;
import com.mandap.dto.BillDTO;
import com.mandap.entity.User;
import com.mandap.security.CustomUserDetailsService;
import com.mandap.service.BillService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @GetMapping
    public ResponseEntity<List<BillDTO>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillDTO> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }

    @GetMapping("/number/{billNumber}")
    public ResponseEntity<BillDTO> getBillByNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(billService.getBillByNumber(billNumber));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<BillDTO>> getBillsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(billService.getBillsByCustomer(customerId));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<BillDTO>> getBillsByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(billService.getBillsByYear(year));
    }

    @GetMapping("/search")
    public ResponseEntity<List<BillDTO>> searchBills(@RequestParam String query) {
        return ResponseEntity.ok(billService.searchBills(query));
    }

    @PostMapping
    public ResponseEntity<BillDTO> createBill(@RequestBody BillDTO dto, Authentication authentication) {
        User user = userDetailsService.getUserByUsername(authentication.getName());
        log.info("Creating bill for customer={}, by user={}", dto.getCustomerId(), authentication.getName());
        BillDTO result = billService.createBill(dto, user.getId());
        log.info("Bill created: billNumber={}, totalAmount={}", result.getBillNumber(), result.getTotalAmount());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BillDTO> updateBill(@PathVariable Long id, @RequestBody BillDTO dto) {
        log.info("Updating bill id={}", id);
        BillDTO result = billService.updateBill(id, dto);
        log.info("Bill updated: billNumber={}, totalAmount={}", result.getBillNumber(), result.getTotalAmount());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBill(@PathVariable Long id) {
        log.warn("Deleting bill id={}", id);
        billService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted successfully"));
    }
}
