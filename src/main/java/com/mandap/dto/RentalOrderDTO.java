package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalOrderDTO {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private List<String> customerPalNumbers;
    private LocalDate orderDate;
    private LocalDate dispatchDate;
    private LocalDate expectedReturnDate;
    private LocalDate actualReturnDate;
    private String status;
    private Long billId;
    private String remarks;
    private List<RentalOrderItemDTO> items;
    private List<RentalOrderTransactionDTO> transactions;
}
