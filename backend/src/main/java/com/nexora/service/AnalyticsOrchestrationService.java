package com.nexora.service;

import com.nexora.dto.FilterCriteriaDto;
import com.nexora.dto.SimulationRequestDto;
import com.nexora.entity.*;
import com.nexora.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsOrchestrationService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final MarketingRepository marketingRepository;
    private final RestTemplate restTemplate;

    @Value("${analytics.service.url:http://localhost:8000}")
    private String analyticsServiceUrl;

    public Map<String, Object> getExecutiveOverview(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> currentOrders = queryOrders(filters);
        List<OrderEntity> previousOrders;

        if (filters.getStartDate() == null && filters.getEndDate() == null && !currentOrders.isEmpty()) {
            LocalDate minDate = currentOrders.stream().map(OrderEntity::getOrderDate).min(LocalDate::compareTo).get();
            LocalDate maxDate = currentOrders.stream().map(OrderEntity::getOrderDate).max(LocalDate::compareTo).get();
            long totalDays = ChronoUnit.DAYS.between(minDate, maxDate);
            LocalDate midDate = minDate.plusDays(totalDays / 2);

            previousOrders = currentOrders.stream()
                    .filter(o -> !o.getOrderDate().isAfter(midDate))
                    .collect(Collectors.toList());
        } else {
            previousOrders = queryPreviousPeriodOrders(filters, currentOrders);
        }

        List<ProductEntity> products = productRepository.findByCompanyId(companyId);
        List<CustomerEntity> customers = customerRepository.findByCompanyId(companyId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("orders", toOrderMaps(currentOrders));
        payload.put("previous_orders", toOrderMaps(previousOrders));
        payload.put("products", toProductMaps(products));
        payload.put("customers", toCustomerMaps(customers));

        Map<String, Object> kpis = callPythonEndpoint("/api/v1/analytics/kpis", payload);
        Map<String, Object> salesAnalytics = callPythonEndpoint("/api/v1/analytics/sales", payload);
        Map<String, Object> productIntel = callPythonEndpoint("/api/v1/analytics/products", payload);
        Map<String, Object> customerAnalytics = callPythonEndpoint("/api/v1/analytics/customers", payload);

        Map<String, Object> response = new HashMap<>();
        response.put("kpis", kpis);
        response.put("sales", salesAnalytics);
        response.put("products", productIntel);
        response.put("customers", customerAnalytics);
        response.put("meta", Map.of(
                "companyId", companyId,
                "recordCount", currentOrders.size(),
                "previousRecordCount", previousOrders.size(),
                "refreshedAt", new Date()
        ));

        return response;
    }

    public Map<String, Object> getSalesAnalytics(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = queryOrders(filters);
        List<ProductEntity> products = productRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "orders", toOrderMaps(orders),
                "products", toProductMaps(products)
        );
        return callPythonEndpoint("/api/v1/analytics/sales", payload);
    }

    public Map<String, Object> getProductIntelligence(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = queryOrders(filters);
        List<ProductEntity> products = productRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "orders", toOrderMaps(orders),
                "products", toProductMaps(products)
        );
        return callPythonEndpoint("/api/v1/analytics/products", payload);
    }

    public Map<String, Object> getCustomerAnalytics(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = queryOrders(filters);
        List<CustomerEntity> customers = customerRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "orders", toOrderMaps(orders),
                "customers", toCustomerMaps(customers)
        );
        return callPythonEndpoint("/api/v1/analytics/customers", payload);
    }

    public Map<String, Object> getInventoryIntelligence(String companyId) {
        List<InventoryEntity> inventory = inventoryRepository.findByCompanyId(companyId);
        List<OrderEntity> orders = orderRepository.findByCompanyId(companyId);
        List<ProductEntity> products = productRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "inventory", toInventoryMaps(inventory),
                "orders", toOrderMaps(orders),
                "products", toProductMaps(products)
        );
        return callPythonEndpoint("/api/v1/analytics/inventory", payload);
    }

    public Map<String, Object> getRootCauseAnalysis(FilterCriteriaDto filters, String targetKpi) {
        List<OrderEntity> currentOrders = queryOrders(filters);
        List<OrderEntity> previousOrders;

        if (filters.getStartDate() == null && filters.getEndDate() == null && !currentOrders.isEmpty()) {
            // Partition full history chronologically into two halves
            LocalDate minDate = currentOrders.stream().map(OrderEntity::getOrderDate).min(LocalDate::compareTo).get();
            LocalDate maxDate = currentOrders.stream().map(OrderEntity::getOrderDate).max(LocalDate::compareTo).get();
            long totalDays = ChronoUnit.DAYS.between(minDate, maxDate);
            LocalDate midDate = minDate.plusDays(totalDays / 2);

            previousOrders = currentOrders.stream()
                    .filter(o -> !o.getOrderDate().isAfter(midDate))
                    .collect(Collectors.toList());
            currentOrders = currentOrders.stream()
                    .filter(o -> o.getOrderDate().isAfter(midDate))
                    .collect(Collectors.toList());
        } else {
            previousOrders = queryPreviousPeriodOrders(filters, currentOrders);
        }

        Map<String, Object> payload = Map.of(
                "current_orders", toOrderMaps(currentOrders),
                "previous_orders", toOrderMaps(previousOrders),
                "target_kpi", targetKpi != null ? targetKpi : "revenue"
        );
        return callPythonEndpoint("/api/v1/analytics/root-cause", payload);
    }

    public Map<String, Object> getForecast(FilterCriteriaDto filters, int days) {
        List<OrderEntity> orders = queryOrders(filters);
        Map<String, Object> payload = Map.of("orders", toOrderMaps(orders));
        return callPythonEndpoint("/api/v1/analytics/forecast?days=" + days, payload);
    }

    public Map<String, Object> getAnomalies(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = queryOrders(filters);
        List<InventoryEntity> inventory = inventoryRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "orders", toOrderMaps(orders),
                "inventory", toInventoryMaps(inventory)
        );
        return callPythonEndpoint("/api/v1/analytics/anomalies", payload);
    }

    public Map<String, Object> runSimulation(SimulationRequestDto req) {
        String companyId = req.getCompanyId() != null ? req.getCompanyId() : "novamart";
        List<OrderEntity> orders = orderRepository.findByCompanyId(companyId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("orders", toOrderMaps(orders));
        payload.put("price_change_pct", req.getPriceChangePct());
        payload.put("discount_change_pct", req.getDiscountChangePct());
        payload.put("marketing_spend_change_pct", req.getMarketingSpendChangePct());
        payload.put("volume_shock_pct", req.getVolumeShockPct());
        payload.put("cost_change_pct", req.getCostChangePct());
        payload.put("price_elasticity", req.getPriceElasticity());
        payload.put("marketing_elasticity", req.getMarketingElasticity());

        return callPythonEndpoint("/api/v1/analytics/simulate", payload);
    }

    public Map<String, Object> getInsights(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = queryOrders(filters);
        List<InventoryEntity> inventory = inventoryRepository.findByCompanyId(companyId);
        List<MarketingEntity> marketing = marketingRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "orders", toOrderMaps(orders),
                "inventory", toInventoryMaps(inventory),
                "marketing", toMarketingMaps(marketing)
        );
        return callPythonEndpoint("/api/v1/analytics/insights", payload);
    }

    public Map<String, Object> chatWithCopilot(String companyId, String query) {
        List<OrderEntity> orders = orderRepository.findByCompanyId(companyId);
        List<ProductEntity> products = productRepository.findByCompanyId(companyId);
        List<InventoryEntity> inventory = inventoryRepository.findByCompanyId(companyId);

        Map<String, Object> payload = Map.of(
                "query", query,
                "orders", toOrderMaps(orders),
                "products", toProductMaps(products),
                "inventory", toInventoryMaps(inventory)
        );
        return callPythonEndpoint("/api/v1/analytics/copilot", payload);
    }

    private List<OrderEntity> queryOrders(FilterCriteriaDto filters) {
        String companyId = getCompanyId(filters);
        List<OrderEntity> orders = orderRepository.findByCompanyId(companyId);

        return orders.stream()
                .filter(o -> filters.getStartDate() == null || !o.getOrderDate().isBefore(filters.getStartDate()))
                .filter(o -> filters.getEndDate() == null || !o.getOrderDate().isAfter(filters.getEndDate()))
                .filter(o -> filters.getRegion() == null || filters.getRegion().isBlank() || filters.getRegion().equalsIgnoreCase(o.getRegion()))
                .filter(o -> filters.getProductId() == null || filters.getProductId().isBlank() || filters.getProductId().equalsIgnoreCase(o.getProductId()))
                .collect(Collectors.toList());
    }

    private List<OrderEntity> queryPreviousPeriodOrders(FilterCriteriaDto filters, List<OrderEntity> currentOrders) {
        String companyId = getCompanyId(filters);
        if (currentOrders.isEmpty()) return Collections.emptyList();

        LocalDate minDate = filters.getStartDate();
        LocalDate maxDate = filters.getEndDate();

        if (minDate == null || maxDate == null) {
            minDate = currentOrders.stream().map(OrderEntity::getOrderDate).min(LocalDate::compareTo).orElse(LocalDate.now().minusMonths(1));
            maxDate = currentOrders.stream().map(OrderEntity::getOrderDate).max(LocalDate::compareTo).orElse(LocalDate.now());
        }

        long days = ChronoUnit.DAYS.between(minDate, maxDate);
        if (days <= 0) days = 30;

        LocalDate prevEnd = minDate.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days);

        List<OrderEntity> allOrders = orderRepository.findByCompanyId(companyId);
        final LocalDate pStart = prevStart;
        final LocalDate pEnd = prevEnd;

        return allOrders.stream()
                .filter(o -> !o.getOrderDate().isBefore(pStart) && !o.getOrderDate().isAfter(pEnd))
                .filter(o -> filters.getRegion() == null || filters.getRegion().isBlank() || filters.getRegion().equalsIgnoreCase(o.getRegion()))
                .filter(o -> filters.getProductId() == null || filters.getProductId().isBlank() || filters.getProductId().equalsIgnoreCase(o.getProductId()))
                .collect(Collectors.toList());
    }

    private Map<String, Object> callPythonEndpoint(String path, Object payload) {
        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(analyticsServiceUrl + path, payload, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return (Map<String, Object>) resp.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to call analytics engine at {}: {}", path, e.getMessage());
        }
        return Collections.emptyMap();
    }

    private String getCompanyId(FilterCriteriaDto f) {
        return (f != null && f.getCompanyId() != null && !f.getCompanyId().isBlank()) ? f.getCompanyId() : "novamart";
    }

    private List<Map<String, Object>> toOrderMaps(List<OrderEntity> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (OrderEntity o : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("order_id", o.getOrderId());
            m.put("order_date", o.getOrderDate().toString());
            m.put("customer_id", o.getCustomerId());
            m.put("product_id", o.getProductId());
            m.put("region", o.getRegion());
            m.put("quantity", o.getQuantity());
            m.put("unit_price", o.getUnitPrice().doubleValue());
            m.put("discount", o.getDiscount().doubleValue());
            m.put("sales", o.getSales().doubleValue());
            m.put("profit", o.getProfit().doubleValue());
            m.put("order_status", o.getOrderStatus());
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toProductMaps(List<ProductEntity> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ProductEntity p : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("product_id", p.getProductId());
            m.put("product_name", p.getProductName());
            m.put("category", p.getCategory());
            m.put("sub_category", p.getSubCategory());
            m.put("unit_cost", p.getUnitCost() != null ? p.getUnitCost().doubleValue() : 0.0);
            m.put("selling_price", p.getSellingPrice() != null ? p.getSellingPrice().doubleValue() : 0.0);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toCustomerMaps(List<CustomerEntity> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (CustomerEntity c : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("customer_id", c.getCustomerId());
            m.put("customer_name", c.getCustomerName());
            m.put("segment", c.getSegment());
            m.put("region", c.getRegion());
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toInventoryMaps(List<InventoryEntity> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (InventoryEntity i : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("product_id", i.getProductId());
            m.put("stock_quantity", i.getStockQuantity());
            m.put("reorder_level", i.getReorderLevel());
            m.put("supplier_lead_time", i.getSupplierLeadTime());
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toMarketingMaps(List<MarketingEntity> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (MarketingEntity m : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("campaign_id", m.getCampaignId());
            map.put("campaign_name", m.getCampaignName());
            map.put("marketing_spend", m.getMarketingSpend().doubleValue());
            map.put("campaign_revenue", m.getCampaignRevenue().doubleValue());
            map.put("channel", m.getChannel());
            out.add(map);
        }
        return out;
    }
}
