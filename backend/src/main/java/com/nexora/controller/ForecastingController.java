package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.dto.FilterCriteriaDto;
import com.nexora.service.AnalyticsOrchestrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/forecast")
@RequiredArgsConstructor
@Tag(name = "Predictive Analytics", description = "Endpoints for time-series sales forecasting and model evaluation")
public class ForecastingController {

    private final AnalyticsOrchestrationService analyticsOrchestrationService;

    @GetMapping
    @Operation(summary = "Generate 30-day sales forecast with confidence intervals and evaluation metrics")
    public ApiResponse<Map<String, Object>> getForecast(
            @ModelAttribute FilterCriteriaDto filters,
            @RequestParam(value = "days", defaultValue = "30") int days) {
        return ApiResponse.success(analyticsOrchestrationService.getForecast(filters, days));
    }
}
