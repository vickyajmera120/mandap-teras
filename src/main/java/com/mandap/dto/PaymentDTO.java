package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private Long billId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String chequeNumber;
    private String remarks;
    private boolean isDeposit;
}
