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
public class RentalOrderTransactionDTO {
    private Long id;
    private Long rentalOrderId;
    private String type; // DISPATCH, RETURN
    private String voucherNumber;
    private String vehicleNumber;
    private LocalDate transactionDate;
    private List<RentalOrderItemDTO> items;
}
