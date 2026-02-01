package com.mandap.service;

import com.mandap.dto.BillDTO;
import com.mandap.dto.BillItemDTO;
import com.mandap.entity.*;
import com.mandap.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public List<BillDTO> getAllBills() {
        return billRepository.findAllWithDetails().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public BillDTO getBillById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));
        return toDTO(bill);
    }

    public BillDTO getBillByNumber(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billNumber));
        return toDTO(bill);
    }

    public List<BillDTO> getBillsByCustomer(Long customerId) {
        return billRepository.findByCustomerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<BillDTO> getBillsByYear(Integer year) {
        return billRepository.findByYear(year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<BillDTO> searchBills(String query) {
        return billRepository.searchByCustomerNameOrBillNumber(query).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public BillDTO createBill(BillDTO dto, Long userId) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));

        // Check if customer already has a bill
        List<Bill> existingBills = billRepository.findByCustomerId(customer.getId());
        if (!existingBills.isEmpty()) {
            throw new RuntimeException("Customer already has a bill. Please edit the existing bill.");
        }

        // Generate bill number
        String billNumber = generateBillNumber();

        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .customer(customer)
                .palNumbers(dto.getPalNumbers() != null ? dto.getPalNumbers()
                        : (customer.getPalNumber() != null ? customer.getPalNumber() : "1"))
                .billType(dto.getBillType() != null ? Bill.BillType.valueOf(dto.getBillType()) : Bill.BillType.INVOICE)
                .paymentStatus(dto.getPaymentStatus() != null ? Bill.PaymentStatus.valueOf(dto.getPaymentStatus())
                        : Bill.PaymentStatus.DUE)
                .billDate(dto.getBillDate() != null ? dto.getBillDate() : LocalDate.now())
                .deposit(dto.getDeposit() != null ? dto.getDeposit() : BigDecimal.ZERO)
                .remarks(dto.getRemarks())
                .createdBy(userId)
                .items(new ArrayList<>())
                .build();

        // Add items
        if (dto.getItems() != null) {
            for (BillItemDTO itemDTO : dto.getItems()) {
                if (itemDTO.getQuantity() != null && itemDTO.getQuantity() > 0) {
                    InventoryItem inventoryItem = inventoryItemRepository.findById(itemDTO.getItemId())
                            .orElseThrow(() -> new RuntimeException("Item not found: " + itemDTO.getItemId()));

                    BillItem billItem = BillItem.builder()
                            .item(inventoryItem)
                            .quantity(itemDTO.getQuantity())
                            .rate(itemDTO.getRate() != null ? itemDTO.getRate() : inventoryItem.getDefaultRate())
                            .build();

                    // Calculate total immediately so bill.calculateTotals() works
                    billItem.setTotal(billItem.getRate().multiply(BigDecimal.valueOf(billItem.getQuantity())));

                    bill.addItem(billItem);
                }
            }
        }

        bill.calculateTotals();
        bill = billRepository.save(bill);

        return toDTO(bill);
    }

    public BillDTO updateBill(Long id, BillDTO dto) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));

        bill.setPalNumbers(dto.getPalNumbers());
        bill.setDeposit(dto.getDeposit() != null ? dto.getDeposit() : BigDecimal.ZERO);
        bill.setRemarks(dto.getRemarks());
        if (dto.getBillType() != null) {
            bill.setBillType(Bill.BillType.valueOf(dto.getBillType()));
        }
        if (dto.getPaymentStatus() != null) {
            bill.setPaymentStatus(Bill.PaymentStatus.valueOf(dto.getPaymentStatus()));
        }

        // Clear and re-add items
        bill.getItems().clear();

        if (dto.getItems() != null) {
            for (BillItemDTO itemDTO : dto.getItems()) {
                if (itemDTO.getQuantity() != null && itemDTO.getQuantity() > 0) {
                    InventoryItem inventoryItem = inventoryItemRepository.findById(itemDTO.getItemId())
                            .orElseThrow(() -> new RuntimeException("Item not found: " + itemDTO.getItemId()));

                    BillItem billItem = BillItem.builder()
                            .item(inventoryItem)
                            .quantity(itemDTO.getQuantity())
                            .rate(itemDTO.getRate() != null ? itemDTO.getRate() : inventoryItem.getDefaultRate())
                            .build();

                    // Calculate total immediately so bill.calculateTotals() works
                    billItem.setTotal(billItem.getRate().multiply(BigDecimal.valueOf(billItem.getQuantity())));

                    bill.addItem(billItem);
                }
            }
        }

        bill.calculateTotals();
        bill = billRepository.save(bill);

        return toDTO(bill);
    }

    public void deleteBill(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));
        billRepository.delete(bill);
    }

    private String generateBillNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "FS13-" + year + "-";

        Integer maxNumber = billRepository.findMaxBillNumberForPrefix(prefix);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;

        return prefix + String.format("%03d", nextNumber);
    }

    private BillDTO toDTO(Bill bill) {
        List<BillItemDTO> itemDTOs = bill.getItems().stream()
                .map(item -> BillItemDTO.builder()
                        .id(item.getId())
                        .itemId(item.getItem().getId())
                        .itemNameGujarati(item.getItem().getNameGujarati())
                        .itemNameEnglish(item.getItem().getNameEnglish())
                        .quantity(item.getQuantity())
                        .rate(item.getRate())
                        .total(item.getTotal())
                        .build())
                .collect(Collectors.toList());

        return BillDTO.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .customerId(bill.getCustomer().getId())
                .customerName(bill.getCustomer().getName())
                .customerMobile(bill.getCustomer().getMobile())
                .palNumbers(bill.getPalNumbers())
                .billType(bill.getBillType() != null ? bill.getBillType().name() : "INVOICE")
                .paymentStatus(bill.getPaymentStatus() != null ? bill.getPaymentStatus().name() : "DUE")
                .totalAmount(bill.getTotalAmount())
                .deposit(bill.getDeposit())
                .netPayable(bill.getNetPayable())
                .billDate(bill.getBillDate())
                .remarks(bill.getRemarks())
                .items(itemDTOs)
                .build();
    }
}
