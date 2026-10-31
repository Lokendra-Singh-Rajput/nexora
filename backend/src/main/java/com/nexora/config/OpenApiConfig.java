package com.nexora.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI nexoraOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NEXORA - AI Analyst Intelligence Platform API")
                        .description("Enterprise REST APIs for data ingestion, analytics orchestration, AI-driven root cause decomposition, forecasting, and what-if simulation.")
                        .version("1.0.0")
                        .contact(new Contact().name("NEXORA Platform Engineering").email("engineering@nexora.io"))
                        .license(new License().name("Enterprise Commercial License")));
    }
}
