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
    private final BankTransactionRepository bankTransactionRepository;
    private final ManufacturingBatchRepository manufacturingBatchRepository;

    public static final String DEMO_COMPANY_ID = "novamart";
    public static final String APEX_COMPANY_ID = "apex-direct";
    public static final String BANK_COMPANY_ID = "meridian-bank";
    public static final String MFG_COMPANY_ID = "vanguard-mfg";

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
        companyService.createOrGetCompany(DEMO_COMPANY_ID, "NovaMart Retail", "RETAIL", "Flagship multi-department omnichannel retail enterprise with 4,400+ transactions.");
        companyService.createOrGetCompany(APEX_COMPANY_ID, "Apex Direct Retail", "RETAIL", "Direct-to-consumer specialty apparel and home electronics merchant.");
        companyService.createOrGetCompany(BANK_COMPANY_ID, "Meridian Trust Bank", "BANKING", "Regional commercial and consumer banking institution with retail loans and payment processing.");
        companyService.createOrGetCompany(MFG_COMPANY_ID, "Vanguard Precision", "MANUFACTURING", "High-precision components fabrication and assembly plant operating multiple machining lines.");

        long orderCount = orderRepository.countByCompanyId(DEMO_COMPANY_ID);
        if (orderCount == 0) {
            log.info("Initializing synthetic NovaMart Retail demo dataset...");
            loadNovaMartData();
        }

        if (orderRepository.countByCompanyId(APEX_COMPANY_ID) == 0) {
            log.info("Initializing synthetic Apex Direct Retail demo dataset...");
            loadApexRetailData();
        }

        if (bankTransactionRepository.countByCompanyId(BANK_COMPANY_ID) == 0) {
            log.info("Initializing synthetic Meridian Trust Bank demo dataset...");
            loadMeridianBankData();
        }

        if (manufacturingBatchRepository.countByCompanyId(MFG_COMPANY_ID) == 0) {
            log.info("Initializing synthetic Vanguard Precision Manufacturing demo dataset...");
            loadVanguardMfgData();
        }
    }

    @Transactional
    public void resetDemoData() {
        log.info("Resetting demo dataset for company: {}", DEMO_COMPANY_ID);
        orderRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        productRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        customerRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        inventoryRepository.deleteByCompanyId(DEMO_COMPANY_ID);
        marketingRepository.deleteByCompanyId(DEMO_COMPANY_ID);

        loadNovaMartData();
    }

    private void loadNovaMartData() {
        String baseDir = findSampleDataDir();
        if (baseDir == null) {
            log.warn("Sample data directory not found.");
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
                log.info("Loaded {} demo products for NovaMart.", products.size());
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
                log.info("Loaded {} demo customers for NovaMart.", customers.size());
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
                log.info("Loaded {} demo orders into database for NovaMart.", orders.size());

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

    private void loadApexRetailData() {
        String baseDir = findSampleDataDir();
        if (baseDir == null) return;
        File f = new File(baseDir, "apex_retail_orders.csv");
        if (!f.exists()) return;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String datasetId = "DS-APEX-V1";
        List<OrderEntity> orders = new ArrayList<>();
        try (Reader reader = new FileReader(f);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
            for (CSVRecord r : parser) {
                orders.add(OrderEntity.builder()
                        .companyId(APEX_COMPANY_ID)
                        .datasetId(datasetId)
                        .orderId(r.get("order_id"))
                        .orderDate(LocalDate.parse(r.get("order_date"), dtf))
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
            log.info("Loaded {} orders for Apex Direct Retail.", orders.size());

            datasetRepository.save(Dataset.builder()
                    .id(datasetId)
                    .companyId(APEX_COMPANY_ID)
                    .filename("apex_retail_orders.csv")
                    .rowCount(orders.size())
                    .qualityScore(new BigDecimal("97.00"))
                    .validationStatus("VALIDATED")
                    .version(1)
                    .build());
        } catch (Exception e) {
            log.error("Failed loading apex_retail_orders.csv: {}", e.getMessage());
        }
    }

    private void loadMeridianBankData() {
        String baseDir = findSampleDataDir();
        if (baseDir == null) return;
        File f = new File(baseDir, "meridian_bank_transactions.csv");
        if (!f.exists()) return;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String datasetId = "DS-MERIDIAN-V1";
        List<BankTransactionEntity> list = new ArrayList<>();
        try (Reader reader = new FileReader(f);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
            for (CSVRecord r : parser) {
                list.add(BankTransactionEntity.builder()
                        .companyId(BANK_COMPANY_ID)
                        .datasetId(datasetId)
                        .transactionId(r.get("transaction_id"))
                        .transactionDate(LocalDate.parse(r.get("transaction_date"), dtf))
                        .accountId(r.get("account_id"))
                        .customerId(r.get("customer_id"))
                        .transactionType(r.get("transaction_type"))
                        .amount(new BigDecimal(r.get("amount")))
                        .isFraud("1".equals(r.get("is_fraud")) || "true".equalsIgnoreCase(r.get("is_fraud")))
                        .riskScore(new BigDecimal(r.get("risk_score")))
                        .isDefault("1".equals(r.get("is_default")) || "true".equalsIgnoreCase(r.get("is_default")))
                        .status(r.get("status"))
                        .channel(r.get("channel"))
                        .build());
            }
            bankTransactionRepository.saveAll(list);
            log.info("Loaded {} transactions for Meridian Trust Bank.", list.size());

            datasetRepository.save(Dataset.builder()
                    .id(datasetId)
                    .companyId(BANK_COMPANY_ID)
                    .filename("meridian_bank_transactions.csv")
                    .rowCount(list.size())
                    .qualityScore(new BigDecimal("96.50"))
                    .validationStatus("VALIDATED")
                    .version(1)
                    .build());
        } catch (Exception e) {
            log.error("Failed loading meridian_bank_transactions.csv: {}", e.getMessage());
        }
    }

    private void loadVanguardMfgData() {
        String baseDir = findSampleDataDir();
        if (baseDir == null) return;
        File f = new File(baseDir, "vanguard_manufacturing_batches.csv");
        if (!f.exists()) return;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String datasetId = "DS-VANGUARD-V1";
        List<ManufacturingBatchEntity> list = new ArrayList<>();
        try (Reader reader = new FileReader(f);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
            for (CSVRecord r : parser) {
                list.add(ManufacturingBatchEntity.builder()
                        .companyId(MFG_COMPANY_ID)
                        .datasetId(datasetId)
                        .batchId(r.get("batch_id"))
                        .productionDate(LocalDate.parse(r.get("production_date"), dtf))
                        .workCenter(r.get("work_center"))
                        .productCode(r.get("product_code"))
                        .plannedQuantity(Integer.parseInt(r.get("planned_quantity")))
                        .producedQuantity(Integer.parseInt(r.get("produced_quantity")))
                        .defectiveQuantity(Integer.parseInt(r.get("defective_quantity")))
                        .downtimeMinutes(Integer.parseInt(r.get("downtime_minutes")))
                        .operatingHours(new BigDecimal(r.get("operating_hours")))
                        .efficiencyPct(new BigDecimal(r.get("efficiency_pct")))
                        .shift(r.get("shift"))
                        .build());
            }
            manufacturingBatchRepository.saveAll(list);
            log.info("Loaded {} batches for Vanguard Precision.", list.size());

            datasetRepository.save(Dataset.builder()
                    .id(datasetId)
                    .companyId(MFG_COMPANY_ID)
                    .filename("vanguard_manufacturing_batches.csv")
                    .rowCount(list.size())
                    .qualityScore(new BigDecimal("97.80"))
                    .validationStatus("VALIDATED")
                    .version(1)
                    .build());
        } catch (Exception e) {
            log.error("Failed loading vanguard_manufacturing_batches.csv: {}", e.getMessage());
        }
    }

    private String findSampleDataDir() {
        String[] possiblePaths = {
                "/app/sample-data",
                "sample-data",
                "../sample-data",
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
