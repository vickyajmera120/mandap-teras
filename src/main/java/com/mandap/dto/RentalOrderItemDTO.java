package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalOrderItemDTO {
    private Long id;
    private Long inventoryItemId;
    private String itemNameGujarati;
    private String itemNameEnglish;
    private Integer bookedQty;
    private Integer dispatchedQty;
    private Integer returnedQty;
    private Integer outstandingQty;
    private LocalDate dispatchDate;
    private LocalDate returnDate;
}
