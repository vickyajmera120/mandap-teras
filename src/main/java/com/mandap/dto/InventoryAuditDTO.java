package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAuditDTO {
    private Integer revisionNumber;
    private LocalDateTime revisionDate;
    private String action; // CREATE, UPDATE, DELETE
    private String changedBy;
    private Map<String, FieldChangeDTO> changes; // Field Name -> Change Data
    private InventoryItemDTO entity;
}
