package com.nexora;

import com.nexora.dto.ApiResponse;
import com.nexora.entity.Company;
import com.nexora.service.CompanyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NexoraApplicationTests {

    @Autowired
    private CompanyService companyService;

    @Test
    void contextLoads() {
        assertNotNull(companyService);
    }

    @Test
    void testCompanyServiceCreation() {
        Company comp = companyService.createOrGetCompany("test-comp", "Test Retail Corp", "Retail");
        assertNotNull(comp);
        assertEquals("test-comp", comp.getId());
        assertEquals("Test Retail Corp", comp.getName());
    }

    @Test
    void testApiResponseContract() {
        ApiResponse<String> resp = ApiResponse.success("Data payload");
        assertTrue(resp.isSuccess());
        assertEquals("Data payload", resp.getData());
        assertNotNull(resp.getTimestamp());
    }
}
