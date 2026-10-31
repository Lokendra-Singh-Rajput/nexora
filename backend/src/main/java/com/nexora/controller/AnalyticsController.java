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
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Executive Analytics", description = "Endpoints for executive KPIs, sales trends, products, customers, and inventory")
public class AnalyticsController {

    private final AnalyticsOrchestrationService analyticsOrchestrationService;

    @GetMapping("/overview")
    @Operation(summary = "Get consolidated Executive Overview with KPIs, comparisons, and charts")
    public ApiResponse<Map<String, Object>> getOverview(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getExecutiveOverview(filters));
    }

    @GetMapping("/sales")
    @Operation(summary = "Get detailed Sales Analytics with time series, regional, and discount breakdowns")
    public ApiResponse<Map<String, Object>> getSalesAnalytics(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getSalesAnalytics(filters));
    }

    @GetMapping("/products")
    @Operation(summary = "Get Product Intelligence with top sellers, margin traps, and Pareto concentration")
    public ApiResponse<Map<String, Object>> getProductIntelligence(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getProductIntelligence(filters));
    }

    @GetMapping("/customers")
    @Operation(summary = "Get Customer Analytics with segmentation, repeat purchase rate, and frequency")
    public ApiResponse<Map<String, Object>> getCustomerAnalytics(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getCustomerAnalytics(filters));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Get Inventory Intelligence with days remaining, stockouts, and reorder alerts")
    public ApiResponse<Map<String, Object>> getInventoryIntelligence(
            @RequestParam(value = "companyId", defaultValue = "novamart") String companyId) {
        return ApiResponse.success(analyticsOrchestrationService.getInventoryIntelligence(companyId));
    }
}
