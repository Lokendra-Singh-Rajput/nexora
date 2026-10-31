package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.dto.CompanyDto;
import com.nexora.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Company Management", description = "Endpoints for multi-tenant company isolation and profile lifecycle")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "List all organizations with industry and record counts")
    public ApiResponse<List<CompanyDto>> getCompanies() {
        return ApiResponse.success(companyService.getAllCompanies());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new company profile with industry configuration")
    public ApiResponse<CompanyDto> createCompany(@Valid @RequestBody CompanyDto dto) {
        return ApiResponse.success(companyService.createCompany(dto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get organization by ID")
    public ApiResponse<CompanyDto> getCompany(@PathVariable String id) {
        return ApiResponse.success(companyService.getCompanyDtoById(id));
    }
}
