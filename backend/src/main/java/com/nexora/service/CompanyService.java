package com.nexora.service;

import com.nexora.dto.CompanyDto;
import com.nexora.entity.Company;
import com.nexora.exception.DataValidationException;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final OrderRepository orderRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final ManufacturingBatchRepository manufacturingBatchRepository;
    private final DatasetRepository datasetRepository;

    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Company getCompanyById(String id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    public CompanyDto getCompanyDtoById(String id) {
        return toDto(getCompanyById(id));
    }

    @Transactional
    public CompanyDto createCompany(CompanyDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new DataValidationException("Company name cannot be blank");
        }

        String id = dto.getId();
        if (id == null || id.trim().isEmpty()) {
            id = generateSlug(dto.getName());
        } else {
            id = id.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-");
        }

        if (companyRepository.existsById(id)) {
            throw new DataValidationException("A company with ID '" + id + "' already exists. Choose a unique identifier.");
        }

        String canonicalIndustry = normalizeIndustry(dto.getIndustry());

        Company company = Company.builder()
                .id(id)
                .name(dto.getName().trim())
                .industry(canonicalIndustry)
                .description(dto.getDescription() != null ? dto.getDescription().trim() : "")
                .build();

        Company saved = companyRepository.save(company);
        log.info("Created new company profile: {} ({}) with industry {}", saved.getName(), saved.getId(), saved.getIndustry());
        return toDto(saved);
    }

    @Transactional
    public Company createOrGetCompany(String id, String name, String industry, String description) {
        return companyRepository.findById(id).orElseGet(() -> {
            Company comp = Company.builder()
                    .id(id)
                    .name(name)
                    .industry(normalizeIndustry(industry))
                    .description(description)
                    .build();
            return companyRepository.save(comp);
        });
    }

    @Transactional
    public Company createOrGetCompany(String id, String name, String industry) {
        return createOrGetCompany(id, name, industry, "");
    }

    private CompanyDto toDto(Company company) {
        long recordCount = 0;
        String ind = company.getIndustry() != null ? company.getIndustry().toUpperCase(Locale.ROOT) : "RETAIL";
        if (ind.contains("BANK")) {
            recordCount = bankTransactionRepository.countByCompanyId(company.getId());
        } else if (ind.contains("MANUF")) {
            recordCount = manufacturingBatchRepository.countByCompanyId(company.getId());
        } else {
            recordCount = orderRepository.countByCompanyId(company.getId());
        }

        long datasetCount = datasetRepository.countByCompanyId(company.getId());

        return CompanyDto.builder()
                .id(company.getId())
                .name(company.getName())
                .industry(company.getIndustry())
                .description(company.getDescription())
                .recordCount(recordCount)
                .datasetCount(datasetCount)
                .createdAt(company.getCreatedAt())
                .build();
    }

    private String normalizeIndustry(String industry) {
        if (industry == null) return "RETAIL";
        String upper = industry.trim().toUpperCase(Locale.ROOT);
        if (upper.contains("BANK") || upper.contains("FINANC")) {
            return "BANKING";
        }
        if (upper.contains("MANUF") || upper.contains("PROD") || upper.contains("INDUS")) {
            return "MANUFACTURING";
        }
        return "RETAIL";
    }

    private String generateSlug(String name) {
        String base = name.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.isEmpty()) base = "company";
        String candidate = base;
        int counter = 1;
        while (companyRepository.existsById(candidate)) {
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }
}
