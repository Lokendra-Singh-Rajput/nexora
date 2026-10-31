package com.nexora.service;

import com.nexora.entity.*;
import com.nexora.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DemoDataInitializationService implements CommandLineRunner {

    private final CompanyService companyService;
    private final DatasetRepository datasetRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final MarketingRepository marketingRepository;

    public static final String DEMO_COMPANY_ID = "novamart";

    @Override
    public void run(String... args) {
        try {
            initDemoDataIfEmpty();
        } catch (Exception e) {
            log.error("Error loading demo dataset on startup: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void initDemoDataIfEmpty() {
        companyService.createOrGetCompany(DEMO_COMPANY_ID, "NovaMart Retail", "Retail & E-Commerce");

        long orderCount = orderRepository.countByCompanyId(DEMO_COMPANY_ID);
        if (orderCount > 0) {
            log.info("Demo dataset for {} already initialized ({} orders present).", DEMO_COMPANY_ID, orderCount);
            return;
        }

        log.info("Initializing synthetic NovaMart Retail demo dataset...");
        loadFromSampleDataDirectory();
    }

    @Transactional
    public void resetDemoData() {
        log.info("Resetting demo dataset for company: {}", DEMO_COMPANY_ID);
        orderRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        productRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        customerRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        inventoryRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        marketingRepository.deleteByCompanyId(DEMO_COMPANY_ID);

        loadFromSampleDataDirectory();
    }

    private void loadFromSampleDataDirectory() {
        String baseDir = findSampleDataDir();
        if (baseDir == null) {
            log.warn("Sample data directory not found. Please run sample-data/generate_demo_data.py first.");
            return;
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String datasetId = "DS-NOVAMART-V1";

        // 1. Products
        File prodFile = new File(baseDir, "products.csv");
        if (prodFile.exists()) {
            List<ProductEntity> products = new ArrayList<>();
            try (Reader reader = new FileReader(prodFile);
                 CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord r : parser) {
                    products.add(ProductEntity.builder()
                            .companyId(DEMO_COMPANY_ID)
                            .datasetId(datasetId)
                            .productId(r.get("product_id"))
                            .productName(r.get("product_name"))
                            .category(r.get("category"))
                            .subCategory(r.get("sub_category"))
                            .unitCost(new BigDecimal(r.get("unit_cost")))
                            .sellingPrice(new BigDecimal(r.get("selling_price")))
                            .build());
                }
                productRepository.saveAll(products);
                log.info("Loaded {} demo products.", products.size());
            } catch (Exception e) {
                log.error("Failed loading products.csv: {}", e.getMessage());
            }
        }

        // 2. Customers
        File custFile = new File(baseDir, "customers.csv");
        if (custFile.exists()) {
            List<CustomerEntity> customers = new ArrayList<>();
            try (Reader reader = new FileReader(custFile);
                 CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord r : parser) {
                    LocalDate acq = null;
                    try { acq = LocalDate.parse(r.get("acquisition_date"), dtf); } catch (Exception ignored) {}
                    customers.add(CustomerEntity.builder()
                            .companyId(DEMO_COMPANY_ID)
                            .datasetId(datasetId)
                            .customerId(r.get("customer_id"))
                            .customerName(r.get("customer_name"))
                            .segment(r.get("segment"))
                            .region(r.get("region"))
                            .acquisitionDate(acq)
                            .build());
                }
                customerRepository.saveAll(customers);
                log.info("Loaded {} demo customers.", customers.size());
            } catch (Exception e) {
                log.error("Failed loading customers.csv: {}", e.getMessage());
            }
        }

        // 3. Inventory
        File invFile = new File(baseDir, "inventory.csv");
        if (invFile.exists()) {
            List<InventoryEntity> invList = new ArrayList<>();
            try (Reader reader = new FileReader(invFile);
                 CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord r : parser) {
                    invList.add(InventoryEntity.builder()
                            .companyId(DEMO_COMPANY_ID)
                            .datasetId(datasetId)
                            .productId(r.get("product_id"))
                            .stockQuantity(Integer.parseInt(r.get("stock_quantity")))
                            .reorderLevel(Integer.parseInt(r.get("reorder_level")))
                            .supplierLeadTime(Integer.parseInt(r.get("supplier_lead_time")))
                            .build());
                }
                inventoryRepository.saveAll(invList);
                log.info("Loaded {} demo inventory items.", invList.size());
            } catch (Exception e) {
                log.error("Failed loading inventory.csv: {}", e.getMessage());
            }
        }

        // 4. Marketing
        File mktFile = new File(baseDir, "marketing.csv");
        if (mktFile.exists()) {
            List<MarketingEntity> mktList = new ArrayList<>();
            try (Reader reader = new FileReader(mktFile);
                 CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord r : parser) {
                    LocalDate cDate = null;
                    try { cDate = LocalDate.parse(r.get("campaign_date"), dtf); } catch (Exception ignored) {}
                    mktList.add(MarketingEntity.builder()
                            .companyId(DEMO_COMPANY_ID)
                            .datasetId(datasetId)
                            .campaignId(r.get("campaign_id"))
                            .campaignName(r.get("campaign_name"))
                            .marketingSpend(new BigDecimal(r.get("marketing_spend")))
                            .campaignRevenue(new BigDecimal(r.get("campaign_revenue")))
                            .campaignDate(cDate)
                            .channel(r.get("channel"))
                            .build());
                }
                marketingRepository.saveAll(mktList);
                log.info("Loaded {} demo marketing campaigns.", mktList.size());
            } catch (Exception e) {
                log.error("Failed loading marketing.csv: {}", e.getMessage());
            }
        }

        // 5. Orders
        File ordFile = new File(baseDir, "orders.csv");
        if (ordFile.exists()) {
            List<OrderEntity> orders = new ArrayList<>();
            try (Reader reader = new FileReader(ordFile);
                 CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord r : parser) {
                    LocalDate oDate = LocalDate.parse(r.get("order_date"), dtf);
                    orders.add(OrderEntity.builder()
                            .companyId(DEMO_COMPANY_ID)
                            .datasetId(datasetId)
                            .orderId(r.get("order_id"))
                            .orderDate(oDate)
                            .customerId(r.get("customer_id"))
                            .productId(r.get("product_id"))
                            .region(r.get("region"))
                            .quantity(Integer.parseInt(r.get("quantity")))
                            .unitPrice(new BigDecimal(r.get("unit_price")))
                            .discount(new BigDecimal(r.get("discount")))
                            .sales(new BigDecimal(r.get("sales")))
                            .profit(new BigDecimal(r.get("profit")))
                            .orderStatus(r.get("order_status"))
                            .build());
                }
                orderRepository.saveAll(orders);
                log.info("Loaded {} demo orders into database.", orders.size());

                Dataset ds = Dataset.builder()
                        .id(datasetId)
                        .companyId(DEMO_COMPANY_ID)
                        .filename("orders.csv")
                        .rowCount(orders.size())
                        .qualityScore(new BigDecimal("98.50"))
                        .validationStatus("VALIDATED")
                        .version(1)
                        .build();
                datasetRepository.save(ds);
            } catch (Exception e) {
                log.error("Failed loading orders.csv: {}", e.getMessage());
            }
        }
    }

    private String findSampleDataDir() {
        String[] possiblePaths = {
                "../sample-data",
                "sample-data",
                "/Users/lucky/Downloads/nexora/sample-data"
        };
        for (String p : possiblePaths) {
            File f = new File(p, "orders.csv");
            if (f.exists()) {
                return p;
            }
        }
        return null;
    }
}
