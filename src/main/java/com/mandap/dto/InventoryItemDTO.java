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
public class InventoryItemDTO {
    private Long id;
    private String nameGujarati;
    private String nameEnglish;
    private BigDecimal defaultRate;
    private String category;
    private Integer displayOrder;
    private Boolean active;
    private Integer totalStock;
    private Integer availableStock;
    private Integer pendingDispatchQty;
}
