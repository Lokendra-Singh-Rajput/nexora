package com.nexora.repository;

import com.nexora.entity.ManufacturingBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ManufacturingBatchRepository extends JpaRepository<ManufacturingBatchEntity, Long>, JpaSpecificationExecutor<ManufacturingBatchEntity> {
    List<ManufacturingBatchEntity> findByCompanyId(String companyId);
    List<ManufacturingBatchEntity> findByCompanyIdAndProductionDateBetween(String companyId, LocalDate startDate, LocalDate endDate);
    long countByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
