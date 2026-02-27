package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private Long id;
    private String name;
    private String mobile;
    private java.util.List<String> palNumbers;
    private String alternateContact;
    private String address;
    private String notes;
    private Boolean active;
    private boolean hasUnbilledOrders;
    private boolean hasBilledOrders;
    private boolean hasRentalOrders;
}
