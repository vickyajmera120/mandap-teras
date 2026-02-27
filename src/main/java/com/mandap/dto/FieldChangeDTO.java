package com.mandap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FieldChangeDTO {
    private Object oldValue;
    private Object newValue;
}
