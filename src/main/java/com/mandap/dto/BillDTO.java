package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDTO {
    private Long id;
    private String billNumber;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private String palNumbers;
    private String billType; // ESTIMATE or INVOICE
    private String paymentStatus; // DUE, PAID, PARTIAL
    private BigDecimal totalAmount;
    private BigDecimal deposit;
    private BigDecimal settlementDiscount;
    private BigDecimal netPayable;
    private LocalDate billDate;
    private String remarks;
    private String depositMethod;
    private String depositChequeNumber;
    private List<BillItemDTO> items;
    private List<PaymentDTO> payments;
}
