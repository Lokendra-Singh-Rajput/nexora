package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.dto.SimulationRequestDto;
import com.nexora.service.AnalyticsOrchestrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/simulator")
@RequiredArgsConstructor
@Tag(name = "Scenario Simulator", description = "Endpoints for what-if business simulation with price and marketing elasticity")
public class SimulatorController {

    private final AnalyticsOrchestrationService analyticsOrchestrationService;

    @PostMapping("/run")
    @Operation(summary = "Run interactive what-if business simulation")
    public ApiResponse<Map<String, Object>> runSimulator(@RequestBody SimulationRequestDto request) {
        return ApiResponse.success(analyticsOrchestrationService.runSimulation(request));
    }
}
