package com.nexora.repository;

import com.nexora.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long>, JpaSpecificationExecutor<OrderEntity> {
    List<OrderEntity> findByCompanyId(String companyId);
    List<OrderEntity> findByCompanyIdAndOrderDateBetween(String companyId, LocalDate startDate, LocalDate endDate);
    long countByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
