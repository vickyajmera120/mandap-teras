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
    private String palNumber;
    private String alternateContact;
    private String address;
    private String notes;
    private Boolean active;
}
