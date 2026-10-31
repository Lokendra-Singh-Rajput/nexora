package com.nexora.controller;

import com.nexora.dto.ApiResponse;
import com.nexora.entity.Company;
import com.nexora.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Company Management", description = "Endpoints for multi-tenant company isolation")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "List all organizations")
    public ApiResponse<List<Company>> getCompanies() {
        return ApiResponse.success(companyService.getAllCompanies());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get organization by ID")
    public ApiResponse<Company> getCompany(@PathVariable String id) {
        return ApiResponse.success(companyService.getCompanyById(id));
    }
}
