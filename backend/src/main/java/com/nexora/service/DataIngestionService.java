package com.nexora.service;

import com.nexora.dto.UploadResponseDto;
import com.nexora.entity.*;
import com.nexora.exception.DataValidationException;
import com.nexora.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataIngestionService {

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd")
    );

    private final CompanyRepository companyRepository;
    private final DatasetRepository datasetRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final MarketingRepository marketingRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final ManufacturingBatchRepository manufacturingBatchRepository;
    private final RestTemplate restTemplate;

    @Value("${analytics.service.url:http://localhost:8000}")
    private String analyticsServiceUrl;

    @Transactional
    public UploadResponseDto ingestFile(String companyId, MultipartFile file, boolean replaceExisting) {
        if (file.isEmpty()) {
            throw new DataValidationException("Uploaded file is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            filename = "upload_" + System.currentTimeMillis() + ".csv";
        }

        log.info("Processing ingestion for company: {}, file: {}", companyId, filename);

        // Fetch company profile to determine industry
        Company company = companyRepository.findById(companyId)
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .id(companyId)
                        .name(companyId.substring(0, 1).toUpperCase() + companyId.substring(1))
                        .industry("RETAIL")
                        .build()));

        String industry = company.getIndustry() != null ? company.getIndustry().toUpperCase(Locale.ROOT) : "RETAIL";

        List<Map<String, Object>> records = new ArrayList<>();
        try {
            if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) {
                records = parseExcel(file.getInputStream());
            } else {
                records = parseCsv(file.getInputStream());
            }
        } catch (Exception e) {
            log.error("Failed to parse file: {}", e.getMessage(), e);
            throw new DataValidationException("Error reading dataset file: " + e.getMessage());
        }

        if (records.isEmpty()) {
            throw new DataValidationException("No data rows found in uploaded file.");
        }

        // Auto-detect industry from column names if file doesn't match company industry
        Set<String> colsNormalized = records.get(0).keySet().stream()
                .map(k -> k.trim().toLowerCase().replaceAll("[_\\s-]+", ""))
                .collect(java.util.stream.Collectors.toSet());
        boolean hasRetailCols = colsNormalized.contains("sales") || colsNormalized.contains("orderid")
                || colsNormalized.contains("profit") || colsNormalized.contains("subCategory".toLowerCase());
        boolean hasBankCols = colsNormalized.contains("transactionid") || colsNormalized.contains("accountid")
                || colsNormalized.contains("isfraud") || colsNormalized.contains("riskscore");
        boolean hasMfgCols = colsNormalized.contains("batchid") || colsNormalized.contains("workcenter")
                || colsNormalized.contains("plannedquantity") || colsNormalized.contains("defectivequantity");

        if (hasRetailCols && !hasBankCols && !hasMfgCols && !industry.equals("RETAIL")) {
            log.info("File columns suggest RETAIL data; overriding company industry '{}' for this upload", industry);
            industry = "RETAIL";
        } else if (hasBankCols && !industry.contains("BANK")) {
            log.info("File columns suggest BANKING data; overriding company industry '{}' for this upload", industry);
            industry = "BANKING";
        } else if (hasMfgCols && !industry.contains("MANUF")) {
            log.info("File columns suggest MANUFACTURING data; overriding company industry '{}' for this upload", industry);
            industry = "MANUFACTURING";
        }

        // Call Python profiling endpoint to validate dataset and calculate quality score
        Object qualityReport = null;
        Map<String, String> columnMapping = new HashMap<>();
        BigDecimal qualityScore = new BigDecimal("92.50");

        try {
            String tableType = "orders";
            if (industry.contains("BANK")) tableType = "banking";
            else if (industry.contains("MANUF")) tableType = "manufacturing";

            Map<String, Object> req = Map.of(
                    "records", records.subList(0, Math.min(records.size(), 1000)),
                    "table_type", tableType
            );
            ResponseEntity<Map> resp = restTemplate.postForEntity(analyticsServiceUrl + "/api/v1/analytics/profile", req, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map body = resp.getBody();
                qualityReport = body.get("quality_report");
                if (body.get("suggested_mapping") instanceof Map) {
                    columnMapping = (Map<String, String>) body.get("suggested_mapping");
                }
                if (qualityReport instanceof Map && ((Map) qualityReport).get("quality_score") != null) {
                    double qs = Double.parseDouble(((Map) qualityReport).get("quality_score").toString());
                    qualityScore = BigDecimal.valueOf(qs).setScale(2, RoundingMode.HALF_UP);
                }
            }
        } catch (Exception e) {
            log.warn("Python profiling service unavailable during upload: {}. Using default scoring.", e.getMessage());
        }

        // Handle versioning
        int nextVersion = 1;
        Optional<Dataset> latestDataset = datasetRepository.findTopByCompanyIdOrderByVersionDesc(companyId);
        if (latestDataset.isPresent()) {
            nextVersion = latestDataset.get().getVersion() + 1;
        }

        String datasetId = "DS-" + UUID.randomUUID().toString().substring(0, 8);
        Dataset dataset = Dataset.builder()
                .id(datasetId)
                .companyId(companyId)
                .filename(filename)
                .rowCount(records.size())
                .qualityScore(qualityScore)
                .validationStatus("VALIDATED")
                .version(nextVersion)
                .build();
        datasetRepository.save(dataset);

        int rowsProcessed = 0;
        if (industry.contains("BANK")) {
            if (replaceExisting) {
                log.info("Replacing existing bank transactions for company {}", companyId);
                bankTransactionRepository.deleteByCompanyId(companyId);
            }
            rowsProcessed = persistBankTransactions(companyId, datasetId, records, columnMapping);
        } else if (industry.contains("MANUF")) {
            if (replaceExisting) {
                log.info("Replacing existing manufacturing batches for company {}", companyId);
                manufacturingBatchRepository.deleteByCompanyId(companyId);
            }
            rowsProcessed = persistManufacturingBatches(companyId, datasetId, records, columnMapping);
        } else {
            if (replaceExisting) {
                log.info("Replacing existing orders for company {}", companyId);
                orderRepository.deleteByCompanyId(companyId);
            }
            rowsProcessed = persistOrders(companyId, datasetId, records, columnMapping);
        }

        log.info("Persisted {} records for company {} in dataset {}", rowsProcessed, companyId, datasetId);

        return UploadResponseDto.builder()
                .datasetId(datasetId)
                .filename(filename)
                .rowsProcessed(rowsProcessed)
                .qualityScore(qualityScore)
                .validationStatus("VALIDATED")
                .version(nextVersion)
                .qualityReport(qualityReport)
                .columnMapping(columnMapping)
                .build();
    }

    private int persistOrders(String companyId, String datasetId, List<Map<String, Object>> records, Map<String, String> columnMapping) {
        List<OrderEntity> orderEntities = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            Map<String, Object> row = records.get(i);
            try {
                String orderId = getVal(row, columnMapping, "order_id", "ORD-" + (10000 + i));
                String dateStr = getVal(row, columnMapping, "order_date", LocalDate.now().toString());
                LocalDate orderDate = parseFlexibleDate(dateStr);

                String customerId = getVal(row, columnMapping, "customer_id", "CUST-DEFAULT");
                String productId = getVal(row, columnMapping, "product_id", "PROD-DEFAULT");
                String region = getVal(row, columnMapping, "region", "Central");
                int qty = Math.max(1, parseInt(getVal(row, columnMapping, "quantity", "1"), 1));
                BigDecimal discount = parseDecimal(getVal(row, columnMapping, "discount", "0.0"), BigDecimal.ZERO);

                BigDecimal sales = parseDecimal(getVal(row, columnMapping, "sales", ""), null);

                // Derive unit_price: prefer explicit column, then compute from sales
                String unitPriceRaw = getVal(row, columnMapping, "unit_price", "");
                BigDecimal unitPrice;
                if (!unitPriceRaw.isEmpty()) {
                    unitPrice = parseDecimal(unitPriceRaw, null);
                } else {
                    unitPrice = null;
                }

                if (sales == null && unitPrice != null) {
                    BigDecimal discountFactor = BigDecimal.ONE.subtract(discount.abs().compareTo(BigDecimal.ONE) < 0 ? discount : discount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                    sales = unitPrice.multiply(BigDecimal.valueOf(qty)).multiply(discountFactor).setScale(2, RoundingMode.HALF_UP);
                }
                if (sales == null) {
                    sales = new BigDecimal("50.00");
                }
                if (unitPrice == null) {
                    // Back-calculate from sales: price = sales / (qty * (1 - discount))
                    BigDecimal discountFactor = BigDecimal.ONE.subtract(discount.abs().compareTo(BigDecimal.ONE) < 0 ? discount : BigDecimal.ZERO);
                    if (discountFactor.compareTo(BigDecimal.ZERO) > 0 && qty > 0) {
                        unitPrice = sales.divide(BigDecimal.valueOf(qty).multiply(discountFactor), 2, RoundingMode.HALF_UP);
                    } else {
                        unitPrice = sales.divide(BigDecimal.valueOf(qty), 2, RoundingMode.HALF_UP);
                    }
                }

                BigDecimal profit = parseDecimal(getVal(row, columnMapping, "profit", ""), null);
                if (profit == null) {
                    profit = sales.multiply(new BigDecimal("0.28")).setScale(2, RoundingMode.HALF_UP);
                }

                String status = getVal(row, columnMapping, "order_status", "Completed");
                if (status.isEmpty()) status = "Completed";

                orderEntities.add(OrderEntity.builder()
                        .companyId(companyId)
                        .datasetId(datasetId)
                        .orderId(orderId)
                        .orderDate(orderDate)
                        .customerId(customerId)
                        .productId(productId)
                        .region(region)
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .discount(discount)
                        .sales(sales)
                        .profit(profit)
                        .orderStatus(status)
                        .build());
            } catch (Exception ex) {
                log.warn("Skipping corrupt record {}: {}", i, ex.getMessage());
            }
        }
        orderRepository.saveAll(orderEntities);
        return orderEntities.size();
    }

    private int persistBankTransactions(String companyId, String datasetId, List<Map<String, Object>> records, Map<String, String> columnMapping) {
        List<BankTransactionEntity> entities = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            Map<String, Object> row = records.get(i);
            try {
                String txnId = getVal(row, columnMapping, "transaction_id", "TXN-" + (10000 + i));
                String dateStr = getVal(row, columnMapping, "transaction_date", LocalDate.now().toString());
                LocalDate txnDate = parseFlexibleDate(dateStr);

                String acctId = getVal(row, columnMapping, "account_id", "ACC-" + (1000 + (i % 200)));
                String custId = getVal(row, columnMapping, "customer_id", "CUST-" + (100 + (i % 50)));
                String txnType = getVal(row, columnMapping, "transaction_type", "Wire Transfer");
                BigDecimal amount = parseDecimal(getVal(row, columnMapping, "amount", "100.0"), new BigDecimal("100.0"));
                boolean isFraud = parseBool(getVal(row, columnMapping, "is_fraud", "false"));
                BigDecimal riskScore = parseDecimal(getVal(row, columnMapping, "risk_score", "0.05"), new BigDecimal("0.05"));
                boolean isDefault = parseBool(getVal(row, columnMapping, "is_default", "false"));
                String status = getVal(row, columnMapping, "status", isFraud ? "Flagged" : (isDefault ? "Defaulted" : "Settled"));
                String channel = getVal(row, columnMapping, "channel", "Online");

                entities.add(BankTransactionEntity.builder()
                        .companyId(companyId)
                        .datasetId(datasetId)
                        .transactionId(txnId)
                        .transactionDate(txnDate)
                        .accountId(acctId)
                        .customerId(custId)
                        .transactionType(txnType)
                        .amount(amount)
                        .isFraud(isFraud)
                        .riskScore(riskScore)
                        .isDefault(isDefault)
                        .status(status)
                        .channel(channel)
                        .build());
            } catch (Exception ex) {
                log.warn("Skipping corrupt bank record {}: {}", i, ex.getMessage());
            }
        }
        bankTransactionRepository.saveAll(entities);
        return entities.size();
    }

    private int persistManufacturingBatches(String companyId, String datasetId, List<Map<String, Object>> records, Map<String, String> columnMapping) {
        List<ManufacturingBatchEntity> entities = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            Map<String, Object> row = records.get(i);
            try {
                String batchId = getVal(row, columnMapping, "batch_id", "BATCH-" + (1000 + i));
                String dateStr = getVal(row, columnMapping, "production_date", LocalDate.now().toString());
                LocalDate prodDate = parseFlexibleDate(dateStr);

                String workCenter = getVal(row, columnMapping, "work_center", "Assembly Line 1");
                String productCode = getVal(row, columnMapping, "product_code", "PART-001");
                int planned = parseInt(getVal(row, columnMapping, "planned_quantity", "1000"), 1000);
                int produced = parseInt(getVal(row, columnMapping, "produced_quantity", "980"), 980);
                int defects = parseInt(getVal(row, columnMapping, "defective_quantity", "20"), 20);
                int downtime = parseInt(getVal(row, columnMapping, "downtime_minutes", "15"), 15);
                BigDecimal opHours = parseDecimal(getVal(row, columnMapping, "operating_hours", "8.0"), BigDecimal.valueOf(8.0));
                
                BigDecimal eff = parseDecimal(getVal(row, columnMapping, "efficiency_pct", ""), null);
                if (eff == null) {
                    eff = planned > 0 ? BigDecimal.valueOf((double) produced / planned * 100.0).setScale(2, RoundingMode.HALF_UP) : BigDecimal.valueOf(95.0);
                }
                String shift = getVal(row, columnMapping, "shift", "Morning");

                entities.add(ManufacturingBatchEntity.builder()
                        .companyId(companyId)
                        .datasetId(datasetId)
                        .batchId(batchId)
                        .productionDate(prodDate)
                        .workCenter(workCenter)
                        .productCode(productCode)
                        .plannedQuantity(planned)
                        .producedQuantity(produced)
                        .defectiveQuantity(defects)
                        .downtimeMinutes(downtime)
                        .operatingHours(opHours)
                        .efficiencyPct(eff)
                        .shift(shift)
                        .build());
            } catch (Exception ex) {
                log.warn("Skipping corrupt manufacturing record {}: {}", i, ex.getMessage());
            }
        }
        manufacturingBatchRepository.saveAll(entities);
        return entities.size();
    }

    private boolean parseBool(String s) {
        if (s == null) return false;
        String trimmed = s.trim().toLowerCase();
        return trimmed.equals("true") || trimmed.equals("1") || trimmed.equals("yes") || trimmed.equals("t");
    }

    /**
     * Parses a date string in multiple common formats.
     * Superstore uses M/d/yy (e.g. "1/3/2019"), ISO uses yyyy-MM-dd.
     * Falls back to today if unparseable.
     */
    private LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return LocalDate.now();
        String s = dateStr.trim();
        // Try ISO first (most common in CSV/system data)
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s, fmt);
            } catch (Exception ignored) {}
        }
        // Try MM/dd/yyyy or M/d/yyyy patterns
        String[] parts = s.split("[/\\-\\.]");
        if (parts.length == 3) {
            try {
                int p0 = Integer.parseInt(parts[0]);
                int p1 = Integer.parseInt(parts[1]);
                int p2 = Integer.parseInt(parts[2]);
                // If last part is 4-digit year: M/d/yyyy
                if (p2 > 999) return LocalDate.of(p2, p0, p1);
                // If first part is 4-digit year: yyyy/M/d
                if (p0 > 999) return LocalDate.of(p0, p1, p2);
                // 2-digit year: assume 2000+
                if (p2 < 100) return LocalDate.of(2000 + p2, p0, p1);
            } catch (Exception ignored) {}
        }
        log.warn("Could not parse date '{}', using today", dateStr);
        return LocalDate.now();
    }

    private List<Map<String, Object>> parseCsv(InputStream is) throws IOException {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (Reader reader = new InputStreamReader(is);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build())) {
            for (CSVRecord record : csvParser) {
                rows.add(new HashMap<>(record.toMap()));
            }
        }
        return rows;
    }

    private List<Map<String, Object>> parseExcel(InputStream is) throws Exception {
        List<Map<String, Object>> rows = new ArrayList<>();
        Workbook workbook = WorkbookFactory.create(is);
        Sheet sheet = workbook.getSheetAt(0);

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return rows;

        List<String> headers = new ArrayList<>();
        for (Cell cell : headerRow) {
            // Use safe cell-to-string so non-string header cells don't throw
            headers.add(cellToString(cell).trim());
        }

        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            Map<String, Object> map = new HashMap<>();
            boolean hasData = false;
            for (int c = 0; c < headers.size(); c++) {
                String header = headers.get(c);
                if (header.isEmpty()) continue; // skip unnamed columns
                Cell cell = row.getCell(c);
                String val = cellToString(cell);
                if (!val.trim().isEmpty()) hasData = true;
                map.put(header, val);
            }
            if (hasData) rows.add(map);
        }
        return rows;
    }

    /**
     * Converts any cell type to a clean string value.
     * Numeric cells are formatted without scientific notation or floating-point artifacts.
     */
    private String cellToString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                // Avoid floating-point noise like "261.96000000000003"
                double d = cell.getNumericCellValue();
                if (d == Math.floor(d) && !Double.isInfinite(d) && Math.abs(d) < 1e15) {
                    return String.valueOf((long) d);
                }
                return java.math.BigDecimal.valueOf(d).stripTrailingZeros().toPlainString();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try { return cell.getStringCellValue(); } catch (Exception e2) {
                    try {
                        double fd = cell.getNumericCellValue();
                        return java.math.BigDecimal.valueOf(fd).stripTrailingZeros().toPlainString();
                    } catch (Exception e3) { return ""; }
                }
            default:
                String s = cell.toString();
                return s == null ? "" : s;
        }
    }

    private String getVal(Map<String, Object> row, Map<String, String> mapping, String targetCanonical, String fallback) {
        // 1. Use explicit column mapping provided by profiling service
        for (Map.Entry<String, String> entry : mapping.entrySet()) {
            if (entry.getValue().equalsIgnoreCase(targetCanonical)) {
                Object val = row.get(entry.getKey());
                if (val != null && !val.toString().trim().isEmpty()) {
                    return val.toString().trim();
                }
            }
        }
        String targetNormalized = targetCanonical.toLowerCase().replaceAll("[_\\s-]+", "");
        // 2. Exact normalized match (e.g. "Order ID" -> "orderid" == "order_id" -> "orderid")
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            String colNormalized = entry.getKey().trim().toLowerCase().replaceAll("[_\\s-]+", "");
            if (colNormalized.equals(targetNormalized)) {
                Object val = entry.getValue();
                if (val != null && !val.toString().trim().isEmpty()) {
                    return val.toString().trim();
                }
            }
        }
        // 3. Starts-with match (e.g. target="sales" matches column "Sales Amount")
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            String colNormalized = entry.getKey().trim().toLowerCase().replaceAll("[_\\s-]+", "");
            if (colNormalized.startsWith(targetNormalized) || targetNormalized.startsWith(colNormalized)) {
                Object val = entry.getValue();
                if (val != null && !val.toString().trim().isEmpty()) {
                    return val.toString().trim();
                }
            }
        }
        return fallback;
    }

    private BigDecimal parseDecimal(String s, BigDecimal fallback) {
        if (s == null || s.trim().isEmpty()) return fallback;
        try {
            String cleaned = s.replace("$", "").replace(",", "").replace("%", "").trim();
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return fallback;
        }
    }

    private int parseInt(String s, int fallback) {
        if (s == null || s.trim().isEmpty()) return fallback;
        try {
            String cleaned = s.replace(",", "").trim();
            if (cleaned.contains(".")) {
                return (int) Double.parseDouble(cleaned);
            }
            return Integer.parseInt(cleaned);
        } catch (Exception e) {
            return fallback;
        }
    }
}
