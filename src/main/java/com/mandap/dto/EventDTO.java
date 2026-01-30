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
public class EventDTO {
    private Long id;
    private String name;
    private String type;
    private Integer year;
    private LocalDate eventDate;

    private String description;
    private Boolean active;
}
