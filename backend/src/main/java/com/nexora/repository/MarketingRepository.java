package com.nexora.repository;

import com.nexora.entity.MarketingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketingRepository extends JpaRepository<MarketingEntity, Long> {
    List<MarketingEntity> findByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
