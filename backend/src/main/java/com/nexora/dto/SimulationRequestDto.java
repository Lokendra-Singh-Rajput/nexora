package com.nexora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationRequestDto {
    private String companyId;
    @Builder.Default
    private Double priceChangePct = 0.0;
    @Builder.Default
    private Double discountChangePct = 0.0;
    @Builder.Default
    private Double marketingSpendChangePct = 0.0;
    @Builder.Default
    private Double volumeShockPct = 0.0;
    @Builder.Default
    private Double costChangePct = 0.0;
    @Builder.Default
    private Double priceElasticity = -1.2;
    @Builder.Default
    private Double marketingElasticity = 0.25;
}
