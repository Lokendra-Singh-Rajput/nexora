package com.nexora.service;

import com.nexora.entity.Company;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company getCompanyById(String id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    @Transactional
    public Company createOrGetCompany(String id, String name, String industry) {
        return companyRepository.findById(id).orElseGet(() -> {
            Company comp = Company.builder()
                    .id(id)
                    .name(name)
                    .industry(industry)
                    .build();
            return companyRepository.save(comp);
        });
    }
}
