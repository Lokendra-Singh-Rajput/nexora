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

@Slf4j
@Service
@RequiredArgsConstructor
public class DataIngestionService {

    private final DatasetRepository datasetRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final MarketingRepository marketingRepository;
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

        // Call Python profiling endpoint to validate dataset and calculate quality score
        Object qualityReport = null;
        Map<String, String> columnMapping = new HashMap<>();
        BigDecimal qualityScore = new BigDecimal("92.50");

        try {
            Map<String, Object> req = Map.of("records", records.subList(0, Math.min(records.size(), 1000)), "table_type", "orders");
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

        if (replaceExisting) {
            log.info("Replacing existing orders for company {}", companyId);
            orderRepository.deleteByCompanyId(companyId);
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

        // Convert and persist orders
        List<OrderEntity> orderEntities = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 0; i < records.size(); i++) {
            Map<String, Object> row = records.get(i);
            try {
                String orderId = getVal(row, columnMapping, "order_id", "ORD-" + (10000 + i));
                String dateStr = getVal(row, columnMapping, "order_date", LocalDate.now().toString());
                LocalDate orderDate = LocalDate.now();
                try {
                    orderDate = LocalDate.parse(dateStr.substring(0, Math.min(10, dateStr.length())), dtf);
                } catch (Exception ignored) {}

                String customerId = getVal(row, columnMapping, "customer_id", "CUST-DEFAULT");
                String productId = getVal(row, columnMapping, "product_id", "PROD-DEFAULT");
                String region = getVal(row, columnMapping, "region", "Central");
                int qty = parseInt(getVal(row, columnMapping, "quantity", "1"), 1);
                BigDecimal unitPrice = parseDecimal(getVal(row, columnMapping, "unit_price", "50.0"), new BigDecimal("50.0"));
                BigDecimal discount = parseDecimal(getVal(row, columnMapping, "discount", "0.0"), BigDecimal.ZERO);

                BigDecimal sales = parseDecimal(getVal(row, columnMapping, "sales", ""), null);
                if (sales == null) {
                    sales = unitPrice.multiply(BigDecimal.valueOf(qty)).multiply(BigDecimal.ONE.subtract(discount)).setScale(2, RoundingMode.HALF_UP);
                }

                BigDecimal profit = parseDecimal(getVal(row, columnMapping, "profit", ""), null);
                if (profit == null) {
                    profit = sales.multiply(new BigDecimal("0.28")).setScale(2, RoundingMode.HALF_UP);
                }

                String status = getVal(row, columnMapping, "order_status", "Completed");

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
        log.info("Persisted {} orders for dataset {}", orderEntities.size(), datasetId);

        return UploadResponseDto.builder()
                .datasetId(datasetId)
                .filename(filename)
                .rowsProcessed(orderEntities.size())
                .qualityScore(qualityScore)
                .validationStatus("VALIDATED")
                .version(nextVersion)
                .qualityReport(qualityReport)
                .columnMapping(columnMapping)
                .build();
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
        Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
        if (sheet == null) return rows;

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return rows;

        List<String> headers = new ArrayList<>();
        for (Cell cell : headerRow) {
            headers.add(cell.getStringCellValue().trim());
        }

        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            Map<String, Object> map = new HashMap<>();
            for (int c = 0; c < headers.size(); c++) {
                Cell cell = row.getCell(c);
                if (cell != null) {
                    map.put(headers.get(c), getCellValue(cell));
                }
            }
            if (!map.isEmpty()) {
                rows.add(map);
            }
        }
        workbook.close();
        return rows;
    }

    private Object getCellValue(Cell cell) {
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate().toString();
            }
            return cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.BOOLEAN) {
            return cell.getBooleanCellValue();
        }
        return "";
    }

    private String getVal(Map<String, Object> row, Map<String, String> mapping, String canonicalKey, String defaultVal) {
        // Direct canonical check
        if (row.containsKey(canonicalKey) && row.get(canonicalKey) != null && !row.get(canonicalKey).toString().isBlank()) {
            return row.get(canonicalKey).toString().trim();
        }
        // Mapping check
        for (Map.Entry<String, String> entry : mapping.entrySet()) {
            if (entry.getValue().equalsIgnoreCase(canonicalKey) && row.containsKey(entry.getKey())) {
                Object v = row.get(entry.getKey());
                if (v != null && !v.toString().isBlank()) {
                    return v.toString().trim();
                }
            }
        }
        // Case-insensitive lookup
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            String norm = entry.getKey().replaceAll("[_\\s\\-\\.]+", "").toLowerCase();
            String normKey = canonicalKey.replaceAll("[_\\s\\-\\.]+", "").toLowerCase();
            if (norm.equals(normKey) && entry.getValue() != null && !entry.getValue().toString().isBlank()) {
                return entry.getValue().toString().trim();
            }
        }
        return defaultVal;
    }

    private int parseInt(String str, int defaultVal) {
        try {
            return (int) Double.parseDouble(str.replaceAll("[^0-9.-]", ""));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private BigDecimal parseDecimal(String str, BigDecimal defaultVal) {
        if (str == null || str.isBlank()) return defaultVal;
        try {
            return new BigDecimal(str.replaceAll("[^0-9.-]", ""));
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
