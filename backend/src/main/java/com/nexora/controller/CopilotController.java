package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.dto.CopilotChatRequestDto;
import com.nexora.service.AnalyticsOrchestrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/copilot")
@RequiredArgsConstructor
@Tag(name = "AI Copilot", description = "Endpoints for conversational AI Analyst Copilot with grounded tool calling")
public class CopilotController {

    private final AnalyticsOrchestrationService analyticsOrchestrationService;

    @PostMapping("/chat")
    @Operation(summary = "Ask a question to the AI Analyst Copilot")
    public ApiResponse<Map<String, Object>> chat(@Valid @RequestBody CopilotChatRequestDto request) {
        String companyId = request.getCompanyId() != null ? request.getCompanyId() : "novamart";
        return ApiResponse.success(analyticsOrchestrationService.chatWithCopilot(companyId, request.getQuery()));
    }
}
