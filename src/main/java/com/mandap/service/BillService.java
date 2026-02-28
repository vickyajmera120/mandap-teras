package com.mandap.service;

import com.mandap.dto.BillDTO;
import com.mandap.dto.BillItemDTO;
import com.mandap.dto.PaymentDTO;
import com.mandap.entity.*;
import com.mandap.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class BillService {

        @Autowired
        private BillRepository billRepository;

        @Autowired
        private CustomerRepository customerRepository;

        @Autowired
        private InventoryItemRepository inventoryItemRepository;

        @Autowired
        private PaymentRepository paymentRepository;

        @Autowired
        private RentalOrderRepository rentalOrderRepository;

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
                log.info("Creating bill for customerId={}, userId={}", dto.getCustomerId(), userId);
                Customer customer = customerRepository.findById(dto.getCustomerId())
                                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));

                List<Bill> existingBills = billRepository.findByCustomerId(customer.getId());
                if (!existingBills.isEmpty()) {
                        throw new RuntimeException("Customer already has a bill. Please edit the existing bill.");
                }

                String billNumber = generateBillNumber();

                Bill bill = Bill.builder()
                                .billNumber(billNumber)
                                .customer(customer)
                                .palNumbers(dto.getPalNumbers() != null ? dto.getPalNumbers()
                                                : (customer.getPalNumbers() != null
                                                                ? String.join(",", customer.getPalNumbers())
                                                                : "1"))
                                .billType(dto.getBillType() != null ? Bill.BillType.valueOf(dto.getBillType())
                                                : Bill.BillType.INVOICE)
                                .paymentStatus(dto.getPaymentStatus() != null
                                                ? Bill.PaymentStatus.valueOf(dto.getPaymentStatus())
                                                : Bill.PaymentStatus.DUE)
                                .billDate(dto.getBillDate() != null ? dto.getBillDate() : LocalDate.now())
                                // Deposit is handled as a payment now
                                .deposit(BigDecimal.ZERO)
                                .settlementDiscount(dto.getSettlementDiscount() != null ? dto.getSettlementDiscount()
                                                : BigDecimal.ZERO)
                                .remarks(dto.getRemarks())
                                .createdBy(userId)
                                .items(new ArrayList<>())
                                .build();

                if (dto.getItems() != null) {
                        for (BillItemDTO itemDTO : dto.getItems()) {
                                if (itemDTO.getQuantity() != null && itemDTO.getQuantity() > 0) {
                                        if (Boolean.TRUE.equals(itemDTO.getIsCustomItem())) {
                                                // Custom item - no inventory reference
                                                BillItem billItem = BillItem.builder()
                                                                .quantity(itemDTO.getQuantity())
                                                                .rate(itemDTO.getRate())
                                                                .isLostItem(false)
                                                                .isCustomItem(true)
                                                                .customItemName(itemDTO.getCustomItemName())
                                                                .build();
                                                billItem.setTotal(billItem.getRate()
                                                                .multiply(BigDecimal.valueOf(billItem.getQuantity())));
                                                bill.addItem(billItem);
                                        } else {
                                                InventoryItem inventoryItem = inventoryItemRepository
                                                                .findById(itemDTO.getItemId())
                                                                .orElseThrow(() -> new RuntimeException(
                                                                                "Item not found: "
                                                                                                + itemDTO.getItemId()));

                                                BillItem billItem = BillItem.builder()
                                                                .item(inventoryItem)
                                                                .quantity(itemDTO.getQuantity())
                                                                .rate(itemDTO.getRate() != null ? itemDTO.getRate()
                                                                                : inventoryItem.getDefaultRate())
                                                                .isLostItem(itemDTO.getIsLostItem() != null
                                                                                ? itemDTO.getIsLostItem()
                                                                                : false)
                                                                .isCustomItem(false)
                                                                .build();

                                                billItem.setTotal(billItem.getRate()
                                                                .multiply(BigDecimal.valueOf(billItem.getQuantity())));
                                                bill.addItem(billItem);
                                        }
                                }
                        }
                }

                bill.calculateTotals();
                bill = billRepository.save(bill);
                log.info("Bill created: number={}, total={}, items={}", bill.getBillNumber(), bill.getTotalAmount(),
                                bill.getItems().size());

                // Create initial payment if deposit is provided
                if (dto.getDeposit() != null && dto.getDeposit().compareTo(BigDecimal.ZERO) > 0) {
                        Payment payment = Payment.builder()
                                        .bill(bill)
                                        .amount(dto.getDeposit())
                                        .paymentDate(bill.getBillDate())
                                        .paymentMethod(dto.getDepositMethod() != null
                                                        ? Payment.PaymentMethod.valueOf(dto.getDepositMethod())
                                                        : Payment.PaymentMethod.CASH)
                                        .chequeNumber(dto.getDepositChequeNumber())
                                        .remarks("Initial Deposit")
                                        .isDeposit(true)
                                        .createdBy(userId)
                                        .build();

                        payment = paymentRepository.save(payment);

                        // Ensure bidirectional relationship is updated in memory
                        if (bill.getPayments() == null) {
                                bill.setPayments(new ArrayList<>());
                        }
                        bill.getPayments().add(payment);

                        // Recalculate and save bill
                        bill.calculateTotals();
                        bill = billRepository.save(bill);
                }

                // Link bill to rental order if rentalOrderId is provided
                if (dto.getRentalOrderId() != null) {
                        RentalOrder rentalOrder = rentalOrderRepository.findById(dto.getRentalOrderId())
                                        .orElse(null);
                        if (rentalOrder != null) {
                                rentalOrder.setBill(bill);
                                rentalOrder.setBillOutOfSync(false);
                                rentalOrderRepository.save(rentalOrder);
                                log.info("Linked bill {} to rental order {}", bill.getBillNumber(),
                                                rentalOrder.getOrderNumber());
                        }
                }

                return toDTO(bill);
        }

        public BillDTO updateBill(Long id, BillDTO dto) {
                log.info("Updating bill id={}", id);
                Bill bill = billRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));

                if (dto.getCustomerId() != null && !dto.getCustomerId().equals(bill.getCustomer().getId())) {
                        throw new RuntimeException("Cannot change customer on an existing bill.");
                }

                bill.setPalNumbers(dto.getPalNumbers());
                // bill.setDeposit(dto.getDeposit() != null ? dto.getDeposit() :
                // BigDecimal.ZERO); // Deposit is now calculated from payments
                bill.setSettlementDiscount(
                                dto.getSettlementDiscount() != null ? dto.getSettlementDiscount() : BigDecimal.ZERO);
                bill.setRemarks(dto.getRemarks());
                if (dto.getBillType() != null) {
                        bill.setBillType(Bill.BillType.valueOf(dto.getBillType()));
                }
                // Payment status is calculated automatically

                bill.getItems().clear();

                if (dto.getItems() != null) {
                        for (BillItemDTO itemDTO : dto.getItems()) {
                                if (itemDTO.getQuantity() != null && itemDTO.getQuantity() > 0) {
                                        if (Boolean.TRUE.equals(itemDTO.getIsCustomItem())) {
                                                // Custom item - no inventory reference
                                                BillItem billItem = BillItem.builder()
                                                                .quantity(itemDTO.getQuantity())
                                                                .rate(itemDTO.getRate())
                                                                .isLostItem(false)
                                                                .isCustomItem(true)
                                                                .customItemName(itemDTO.getCustomItemName())
                                                                .build();
                                                billItem.setTotal(billItem.getRate()
                                                                .multiply(BigDecimal.valueOf(billItem.getQuantity())));
                                                bill.addItem(billItem);
                                        } else {
                                                InventoryItem inventoryItem = inventoryItemRepository
                                                                .findById(itemDTO.getItemId())
                                                                .orElseThrow(() -> new RuntimeException(
                                                                                "Item not found: "
                                                                                                + itemDTO.getItemId()));

                                                BillItem billItem = BillItem.builder()
                                                                .item(inventoryItem)
                                                                .quantity(itemDTO.getQuantity())
                                                                .rate(itemDTO.getRate() != null ? itemDTO.getRate()
                                                                                : inventoryItem.getDefaultRate())
                                                                .isLostItem(itemDTO.getIsLostItem() != null
                                                                                ? itemDTO.getIsLostItem()
                                                                                : false)
                                                                .isCustomItem(false)
                                                                .build();

                                                billItem.setTotal(billItem.getRate()
                                                                .multiply(BigDecimal.valueOf(billItem.getQuantity())));
                                                bill.addItem(billItem);
                                        }
                                }
                        }
                }

                // Handle Deposit Update
                BigDecimal newDeposit = dto.getDeposit() != null ? dto.getDeposit() : BigDecimal.ZERO;
                Payment depositPayment = bill.getPayments().stream()
                                .filter(Payment::isDeposit)
                                .findFirst()
                                .orElse(null);

                if (newDeposit.compareTo(BigDecimal.ZERO) > 0) {
                        if (depositPayment != null) {
                                // Update existing
                                depositPayment.setAmount(newDeposit);
                                if (dto.getDepositMethod() != null) {
                                        depositPayment.setPaymentMethod(
                                                        Payment.PaymentMethod.valueOf(dto.getDepositMethod()));
                                }
                                depositPayment.setChequeNumber(dto.getDepositChequeNumber());
                                paymentRepository.save(depositPayment);
                        } else {
                                // Create new
                                Payment newPayment = Payment.builder()
                                                .bill(bill)
                                                .amount(newDeposit)
                                                .paymentDate(bill.getBillDate())
                                                .paymentMethod(dto.getDepositMethod() != null
                                                                ? Payment.PaymentMethod.valueOf(dto.getDepositMethod())
                                                                : Payment.PaymentMethod.CASH)
                                                .chequeNumber(dto.getDepositChequeNumber())
                                                .remarks("Initial Deposit")
                                                .isDeposit(true)
                                                .createdBy(1L)
                                                .build();

                                newPayment = paymentRepository.save(newPayment);
                                bill.addPayment(newPayment);
                        }
                } else if (depositPayment != null) {
                        // Update to zero if removed
                        depositPayment.setAmount(BigDecimal.ZERO);
                        paymentRepository.save(depositPayment);
                }

                bill.calculateTotals();
                bill = billRepository.save(bill);

                // Clear out-of-sync flag on linked rental order
                rentalOrderRepository.findByBillId(bill.getId()).ifPresent(rentalOrder -> {
                        rentalOrder.setBillOutOfSync(false);
                        rentalOrderRepository.save(rentalOrder);
                });

                return toDTO(bill);
        }

        public void deleteBill(Long id) {
                log.warn("Attempting to delete bill id={}", id);
                Bill bill = billRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Bill not found: " + id));

                // Check for payments
                if (bill.getPayments() != null && !bill.getPayments().isEmpty()) {
                        long paymentCount = bill.getPayments().stream()
                                        .filter(p -> p.getAmount() != null
                                                        && p.getAmount().compareTo(java.math.BigDecimal.ZERO) > 0)
                                        .count();
                        if (paymentCount > 0) {
                                throw new RuntimeException(
                                                "Cannot delete bill because payments have been recorded. Delete the payments first.");
                        }
                }

                // Clean up linked rental order
                rentalOrderRepository.findByBillId(id).ifPresent(order -> {
                        log.info("Unlinking bill {} from rental order {}", bill.getBillNumber(),
                                        order.getOrderNumber());
                        order.setBill(null);
                        order.setBillOutOfSync(false);
                        // If order was completed because of this bill, revert status
                        if (order.getStatus() == RentalOrder.RentalOrderStatus.COMPLETED) {
                                order.setStatus(RentalOrder.RentalOrderStatus.RETURNED);
                        }
                        rentalOrderRepository.save(order);
                });

                billRepository.delete(bill);
                log.info("Bill deleted successfully: number={}", bill.getBillNumber());
        }

        public List<PaymentDTO> getPaymentsByBillId(Long billId) {
                return paymentRepository.findByBillId(billId).stream()
                                .map(this::toPaymentDTO)
                                .collect(Collectors.toList());
        }

        public PaymentDTO addPayment(PaymentDTO dto, Long userId) {
                log.info("Adding payment: billId={}, amount={}, isDeposit={}", dto.getBillId(), dto.getAmount(),
                                dto.isDeposit());
                Bill bill = billRepository.findById(dto.getBillId())
                                .orElseThrow(() -> new RuntimeException("Bill not found: " + dto.getBillId()));

                Payment payment = Payment.builder()
                                .bill(bill)
                                .amount(dto.getAmount())
                                .paymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDate.now())
                                .paymentMethod(dto.getPaymentMethod() != null
                                                ? Payment.PaymentMethod.valueOf(dto.getPaymentMethod())
                                                : Payment.PaymentMethod.CASH)
                                .chequeNumber(dto.getChequeNumber())
                                .remarks(dto.getRemarks())
                                .isDeposit(dto.isDeposit())
                                .createdBy(userId)
                                .build();

                payment = paymentRepository.save(payment);

                bill.addPayment(payment);
                bill.calculateTotals();
                billRepository.save(bill);

                return toPaymentDTO(payment);
        }

        public PaymentDTO updatePayment(Long id, PaymentDTO dto) {
                Payment payment = paymentRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));

                payment.setAmount(dto.getAmount());
                payment.setPaymentDate(dto.getPaymentDate());
                payment.setPaymentMethod(
                                dto.getPaymentMethod() != null ? Payment.PaymentMethod.valueOf(dto.getPaymentMethod())
                                                : Payment.PaymentMethod.CASH);
                payment.setChequeNumber(dto.getChequeNumber());
                payment.setRemarks(dto.getRemarks());
                payment.setDeposit(dto.isDeposit());

                Bill bill = payment.getBill();
                bill.calculateTotals();
                billRepository.save(bill);

                return toPaymentDTO(payment);
        }

        public void deletePayment(Long id) {
                log.warn("Deleting payment id={}", id);
                Payment payment = paymentRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));

                Bill bill = payment.getBill();
                log.info("Removing payment from bill: number={}, amount={}", bill.getBillNumber(), payment.getAmount());
                bill.removePayment(payment);
                bill.calculateTotals();
                billRepository.save(bill);
        }

        private String generateBillNumber() {
                int year = LocalDate.now().getYear();
                String prefix = "FS13-" + year + "-";

                Integer maxNumber = billRepository.findMaxBillNumberForPrefix(prefix);
                int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;

                return prefix + String.format("%03d", nextNumber);
        }

        private PaymentDTO toPaymentDTO(Payment payment) {
                return PaymentDTO.builder()
                                .id(payment.getId())
                                .billId(payment.getBill().getId())
                                .amount(payment.getAmount())
                                .paymentDate(payment.getPaymentDate())
                                .paymentMethod(payment.getPaymentMethod().name())
                                .chequeNumber(payment.getChequeNumber())
                                .remarks(payment.getRemarks())
                                .isDeposit(payment.isDeposit())
                                .build();
        }

        private BillDTO toDTO(Bill bill) {
                // Build a map of itemId -> bookedQty from the linked rental order (if any)
                java.util.Map<Long, Integer> orderQtyMap = new java.util.HashMap<>();
                Long linkedRentalOrderId = null;
                RentalOrder linkedOrder = rentalOrderRepository.findByBillId(bill.getId()).orElse(null);
                if (linkedOrder != null) {
                        linkedRentalOrderId = linkedOrder.getId();
                        for (RentalOrderItem roi : linkedOrder.getItems()) {
                                orderQtyMap.put(roi.getInventoryItem().getId(), roi.getBookedQty());
                        }
                }

                final Long finalRentalOrderId = linkedRentalOrderId;

                List<BillItemDTO> itemDTOs = bill.getItems().stream()
                                .map(item -> {
                                        BillItemDTO.BillItemDTOBuilder builder = BillItemDTO.builder()
                                                        .id(item.getId())
                                                        .quantity(item.getQuantity())
                                                        .rate(item.getRate())
                                                        .total(item.getTotal())
                                                        .isLostItem(Boolean.TRUE.equals(item.getIsLostItem()))
                                                        .isCustomItem(Boolean.TRUE.equals(item.getIsCustomItem()))
                                                        .customItemName(item.getCustomItemName());

                                        if (item.getItem() != null) {
                                                builder.itemId(item.getItem().getId())
                                                                .itemNameGujarati(item.getItem().getNameGujarati())
                                                                .itemNameEnglish(item.getItem().getNameEnglish());
                                                // Set order quantity if this item exists in the linked rental order
                                                Integer oQty = orderQtyMap.get(item.getItem().getId());
                                                if (oQty != null) {
                                                        builder.orderQty(oQty);
                                                }
                                        } else if (item.getCustomItemName() != null) {
                                                builder.itemNameGujarati(item.getCustomItemName())
                                                                .itemNameEnglish(item.getCustomItemName());
                                        }

                                        return builder.build();
                                })
                                .collect(Collectors.toList());

                return BillDTO.builder()
                                .id(bill.getId())
                                .billNumber(bill.getBillNumber())
                                .customerId(bill.getCustomer().getId())
                                .customerName(bill.getCustomer().getName())
                                .customerMobile(bill.getCustomer().getMobile())
                                .palNumbers(bill.getCustomer().getPalNumbers() != null
                                                ? String.join(", ", bill.getCustomer().getPalNumbers())
                                                : "")
                                .billType(bill.getBillType() != null ? bill.getBillType().name() : "INVOICE")
                                .paymentStatus(bill.getPaymentStatus() != null ? bill.getPaymentStatus().name() : "DUE")
                                .totalAmount(bill.getTotalAmount())
                                .deposit(bill.getDeposit())
                                .settlementDiscount(bill.getSettlementDiscount())
                                .netPayable(bill.getNetPayable())
                                .toBeReturned(bill.getNetPayable().compareTo(BigDecimal.ZERO) < 0
                                                ? bill.getNetPayable().negate()
                                                : BigDecimal.ZERO)
                                .billDate(bill.getBillDate())
                                .remarks(bill.getRemarks())
                                .rentalOrderId(finalRentalOrderId)
                                .orderItemQuantities(orderQtyMap.isEmpty() ? null : orderQtyMap)
                                .items(itemDTOs)
                                .payments(bill.getPayments().stream().map(this::toPaymentDTO)
                                                .collect(Collectors.toList()))
                                .build();
        }
}
