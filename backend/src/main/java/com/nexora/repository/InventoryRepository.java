package com.nexora.repository;

import com.nexora.entity.InventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryEntity, Long> {
    List<InventoryEntity> findByCompanyId(String companyId);
    void deleteByCompanyId(String companyId);
}
