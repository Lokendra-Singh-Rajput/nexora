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
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
@Tag(name = "Business Intelligence & Insights", description = "Endpoints for root cause analysis, anomalies, and evidence-backed recommendations")
public class BusinessIntelligenceController {

    private final AnalyticsOrchestrationService analyticsOrchestrationService;

    @GetMapping
    @Operation(summary = "Get prioritized operational insights and recommendations")
    public ApiResponse<Map<String, Object>> getInsights(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getInsights(filters));
    }

    @GetMapping("/root-cause")
    @Operation(summary = "Execute variance decomposition and root cause analysis on a target KPI")
    public ApiResponse<Map<String, Object>> getRootCause(
            @ModelAttribute FilterCriteriaDto filters,
            @RequestParam(value = "kpi", defaultValue = "revenue") String targetKpi) {
        return ApiResponse.success(analyticsOrchestrationService.getRootCauseAnalysis(filters, targetKpi));
    }

    @GetMapping("/anomalies")
    @Operation(summary = "Detect statistical anomalies across revenue, margin, discount, and inventory")
    public ApiResponse<Map<String, Object>> getAnomalies(@ModelAttribute FilterCriteriaDto filters) {
        return ApiResponse.success(analyticsOrchestrationService.getAnomalies(filters));
    }
}
