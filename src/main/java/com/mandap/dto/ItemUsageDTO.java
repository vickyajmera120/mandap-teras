package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemUsageDTO {
    private Long customerId;
    private String customerName;
    private String orderNumber;
    private int bookedQty;
    private int dispatchedQty;
    private int returnedQty;
    private int outstandingQty;
}
