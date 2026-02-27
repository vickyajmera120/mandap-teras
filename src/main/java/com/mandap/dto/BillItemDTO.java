package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemDTO {
    private Long id;
    private Long itemId;
    private String itemNameGujarati;
    private String itemNameEnglish;
    private Integer quantity;
    private BigDecimal rate;
    private BigDecimal total;
    private Boolean isLostItem;
    private String customItemName;
    private Boolean isCustomItem;
    private Integer orderQty; // Quantity from linked rental order (null if no order linked)
}
