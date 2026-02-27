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
public class CustomerAuditDTO {
    private Integer revisionNumber;
    private LocalDateTime revisionDate;
    private String action; // CREATE, UPDATE, DELETE
    private String changedBy;
    private Map<String, Object> changes; // Field Name -> New Value
    private CustomerDTO entity; // The state of the entity at this revision
}
